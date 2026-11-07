import {
    useState,
    useEffect,
    useMemo,
} from "react";

import "./Feedback.css";

import { supabase } from "../../lib/supabase";
import { processFeedbackImage } from "../../lib/feedback/images";

import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

interface ApprovedFeedbackImage {
    alt_text: string;
    display_order: number;
    image_url: string | null;
    thumbnail_url: string | null;
}

interface ApprovedFeedback {
    id: string;
    display_name: string;
    message: string;
    created_at: string;
    images: ApprovedFeedbackImage[];
}

interface ApprovedFeedbackResponse {
    feedback: ApprovedFeedback[];
    page: number;
    hasMore: boolean;
}

export default function FeedbackPage() {
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [imageError, setImageError] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const [approvedFeedback, setApprovedFeedback] = useState<ApprovedFeedback[]>([]);
    const [feedbackPage, setFeedbackPage] = useState(0);
    const [hasMoreFeedback, setHasMoreFeedback] = useState(false);
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(true);
    const [feedbackLoadError, setFeedbackLoadError] = useState("");

    const imagePreviews = useMemo(
        () =>
            images.map((file) => ({
                file,
                url: URL.createObjectURL(file),
            })),
        [images]
    );

    useEffect(() => {
        return () => {
            imagePreviews.forEach(({ url }) => {
                URL.revokeObjectURL(url);
            });
        };
    }, [imagePreviews]);
    useEffect(() => {
        loadApprovedFeedback(0);
    }, []);
    async function loadApprovedFeedback(page: number, append = false) {
        setIsLoadingFeedback(true);
        setFeedbackLoadError("");

        try {
            const { data, error } =
                await supabase.functions.invoke<ApprovedFeedbackResponse>(
                    `get-approved-feedback?page=${page}`,
                    {
                        method: "GET",
                    }
                );

            if (error) throw error;

            if (!data) {
                throw new Error("No feedback data was returned.");
            }

            if (append) {
                setApprovedFeedback((current) => [
                    ...current,
                    ...data.feedback,
                ]);
            } else {
                setApprovedFeedback(data.feedback);
            }

            setFeedbackPage(data.page);
            setHasMoreFeedback(data.hasMore);
        } catch (error) {
            console.error("Could not load approved feedback:", error);

            setFeedbackLoadError(
                "We couldn't load feedback right now. Please try again."
            );
        } finally {
            setIsLoadingFeedback(false);
        }
    }

    function handleImageChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const selectedFiles = Array.from(event.target.files ?? []);

        setImageError("");

        const validFiles: File[] = [];
        const errors: string[] = [];

        for (const file of selectedFiles) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                errors.push(`${file.name}: Unsupported image format.`);
                continue;
            }

            if (file.size > MAX_FILE_SIZE) {
                errors.push(`${file.name}: Exceeds the 10 MB limit.`);
                continue;
            }

            validFiles.push(file);
        }

        setImages((current) => {
            const combined = [...current];

            for (const file of validFiles) {
                const duplicate = combined.some(
                    (existing) =>
                        existing.name === file.name &&
                        existing.size === file.size &&
                        existing.lastModified === file.lastModified
                );

                if (duplicate) {
                    errors.push(`${file.name}: Already selected.`);
                    continue;
                }

                if (combined.length >= MAX_IMAGES) {
                    errors.push("You can only upload up to 3 images.");
                    continue;
                }

                combined.push(file);
            }

            return combined;
        });

        if (errors.length > 0) {
            setImageError(errors.join(" "));
        }

        event.target.value = "";
    }

    function removeImage(index: number) {
        setImages((current) =>
            current.filter((_, i) => i !== index)
        );

        setImageError("");
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);
        setSubmitError("");
        setSubmitSuccess(false);

        try {
            // Process all images before creating the feedback record.
            const processedImages = await Promise.all(
                images.map((file) => processFeedbackImage(file))
            );

            const feedbackId = crypto.randomUUID();

            // Create the feedback record.
            const { error: feedbackError } = await supabase
                .from("feedback")
                .insert({
                    id: feedbackId,
                    display_name: name.trim(),
                    message: message.trim(),
                });

            if (feedbackError) {
                throw feedbackError;
            }

            // Prepare image metadata and storage paths.
            const imageRecords = processedImages.map((_, index) => ({
                feedback_id: feedbackId,
                storage_path: `${feedbackId}/image-${index + 1}.webp`,
                thumbnail_path: `${feedbackId}/thumb-image-${index + 1}.webp`,
                alt_text: `Feedback photo ${index + 1}`,
                display_order: index,
            }));

            // Register image paths before uploading.
            // This lets the scheduled cleanup find files if an upload fails.
            if (imageRecords.length > 0) {
                const { error: recordsError } = await supabase
                    .from("feedback_images")
                    .insert(imageRecords);

                if (recordsError) {
                    throw recordsError;
                }
            }

            // Upload main images and thumbnails.
            for (let index = 0; index < processedImages.length; index++) {
                const { image, thumbnail } = processedImages[index];
                const record = imageRecords[index];

                const { error: imageError } = await supabase.storage
                    .from("feedback-images")
                    .upload(record.storage_path, image, {
                        contentType: "image/webp",
                        upsert: false,
                    });

                if (imageError) {
                    throw imageError;
                }

                const { error: thumbnailError } = await supabase.storage
                    .from("feedback-images")
                    .upload(record.thumbnail_path, thumbnail, {
                        contentType: "image/webp",
                        upsert: false,
                    });

                if (thumbnailError) {
                    throw thumbnailError;
                }
            }

            setName("");
            setMessage("");
            setImages([]);
            setSubmitSuccess(true);
        } catch (error) {
            console.error("Feedback submission failed:", error);

            setSubmitError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while submitting your feedback."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="feedback-page">
            <section className="feedback-container">
                <header className="feedback-header">
                    <Link to="/" className="feedback-back-button">
                        <ArrowLeft size={17} />
                        Back to Book
                    </Link>
                    <p className="feedback-eyebrow">
                        BALITE SPRINGS
                    </p>

                    <h1>Share Your Experience</h1>

                    <p>
                        We'd love to hear about your visit.
                        Share your thoughts and photos with us.
                    </p>
                </header>

                <form
                    className="feedback-form"
                    onSubmit={handleSubmit}
                >
                    <label htmlFor="feedback-name">
                        Your Name
                    </label>

                    <input
                        id="feedback-name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={80}
                        placeholder="Enter your name"
                        required
                    />

                    <label htmlFor="feedback-message">
                        Your Feedback
                    </label>

                    <textarea
                        id="feedback-message"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        maxLength={2000}
                        placeholder="Tell us about your experience..."
                        rows={6}
                        required
                    />

                    <div className="feedback-upload-section">
                        <label htmlFor="feedback-images">
                            Add Photos ({images.length}/{MAX_IMAGES})
                        </label>

                        <p>
                            JPEG, PNG, or WebP. Up to 3 photos,
                            maximum 10 MB each.
                        </p>

                        <input
                            id="feedback-images"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            disabled={images.length >= MAX_IMAGES}
                            onChange={handleImageChange}
                        />

                        {imageError && (
                            <p className="feedback-image-error" role="alert">
                                {imageError}
                            </p>
                        )}

                        <div className="feedback-image-previews">
                            {imagePreviews.map(({ file, url }, index) => (
                                <div
                                    className="feedback-image-preview"
                                    key={`${file.name}-${file.lastModified}-${index}`}
                                >
                                    <img
                                        src={url}
                                        alt={`Selected photo ${index + 1}`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        aria-label={`Remove photo ${index + 1}`}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="feedback-submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </button>

                    {submitError && (
                        <p className="feedback-image-error" role="alert">
                            {submitError}
                        </p>
                    )}

                    {submitSuccess && (
                        <p className="feedback-success" role="status">
                            Thank you! Your feedback has been submitted
                            and is awaiting review.
                        </p>
                    )}

                    <p className="feedback-privacy-note">
                        Your submission will be reviewed before
                        appearing publicly on the website.
                    </p>
                </form>
            </section>
            <section className="approved-feedback-section">
                <header className="approved-feedback-header">
                    <p className="feedback-eyebrow">VISITOR EXPERIENCES</p>
                    <h2>What Our Visitors Say</h2>
                    <p>Experiences and memories shared by our visitors.</p>
                </header>

                {isLoadingFeedback && approvedFeedback.length === 0 && (
                    <p className="feedback-loading">Loading feedback...</p>
                )}

                {feedbackLoadError && (
                    <p className="feedback-image-error" role="alert">
                        {feedbackLoadError}
                    </p>
                )}

                {!isLoadingFeedback &&
                    !feedbackLoadError &&
                    approvedFeedback.length === 0 && (
                        <p className="feedback-empty">
                            No visitor feedback has been published yet.
                        </p>
                    )}

                <div className="approved-feedback-list">
                    {approvedFeedback.map((item) => (
                        <article className="approved-feedback-card" key={item.id}>
                            <div className="approved-feedback-card-header">
                                <h3>{item.display_name}</h3>
                                <time dateTime={item.created_at}>
                                    {new Date(item.created_at).toLocaleDateString(
                                        "en-PH",
                                        {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        }
                                    )}
                                </time>
                            </div>

                            <p className="approved-feedback-message">
                                {item.message}
                            </p>

                            {item.images.length > 0 && (
                                <div className="approved-feedback-images">
                                    {item.images.map((image, index) => (
                                        image.image_url && (
                                            <a
                                                key={`${item.id}-${index}`}
                                                href={image.image_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <img
                                                    src={image.thumbnail_url || image.image_url}
                                                    alt={image.alt_text}
                                                    loading="lazy"
                                                />
                                            </a>
                                        )
                                    ))}
                                </div>
                            )}
                        </article>
                    ))}
                </div>

                {hasMoreFeedback && (
                    <button
                        type="button"
                        className="feedback-load-more"
                        disabled={isLoadingFeedback}
                        onClick={() =>
                            loadApprovedFeedback(feedbackPage + 1, true)
                        }
                    >
                        {isLoadingFeedback ? "Loading..." : "Load More"}
                    </button>
                )}
            </section>
        </main>
    );
}