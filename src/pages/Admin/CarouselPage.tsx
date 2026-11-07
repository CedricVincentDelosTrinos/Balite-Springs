
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
    Images,
    Upload,
    X,
    GripVertical,
    Save,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import { uploadMediaFile } from "../../lib/admin/media";
import "./CarouselPage.css";

interface CarouselImage {
    id: string;
    image_url: string;
    display_order: number;
    created_at: string;
}

function getStoragePath(publicUrl: string): string | null {
    try {
        const url = new URL(publicUrl);
        const marker = "/storage/v1/object/public/media/";

        const markerIndex = url.pathname.indexOf(marker);

        if (markerIndex === -1) return null;

        return decodeURIComponent(
            url.pathname.slice(markerIndex + marker.length)
        );
    } catch {
        return null;
    }
}

export default function CarouselPage() {
    const [images, setImages] = useState<CarouselImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    async function loadImages() {
        setLoading(true);
        setError("");

        const { data, error } = await supabase
            .from("gallery_carousel_images")
            .select("*")
            .order("display_order", { ascending: true });

        if (error) {
            setError(error.message);
        } else {
            setImages((data ?? []) as CarouselImage[]);
        }

        setLoading(false);
    }

    useEffect(() => {
        loadImages();
    }, []);

    async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files ?? []);

        // Allow selecting the same files again later.
        event.target.value = "";

        if (files.length === 0) return;

        setError("");
        setSuccess("");
        setUploading(true);

        const invalidFile = files.find(
            (file) => !file.type.startsWith("image/")
        );

        if (invalidFile) {
            setError(`${invalidFile.name} is not a valid image.`);
            setUploading(false);
            return;
        }

        const uploadedPaths: string[] = [];

        try {
            const uploadedImages: {
                image_url: string;
                display_order: number;
            }[] = [];

            for (const file of files) {
                const imageUrl = await uploadMediaFile(
                    file,
                    "gallery-carousel"
                );

                const storagePath = getStoragePath(imageUrl);

                if (!storagePath) {
                    throw new Error(
                        "Could not determine the uploaded image's storage path."
                    );
                }

                uploadedPaths.push(storagePath);

                uploadedImages.push({
                    image_url: imageUrl,
                    display_order: images.length + uploadedImages.length,
                });
            }

            const { error } = await supabase
                .from("gallery_carousel_images")
                .insert(uploadedImages);

            if (error) throw error;

            setSuccess(
                `${uploadedImages.length} image${uploadedImages.length === 1 ? "" : "s"} uploaded successfully.`
            );

            await loadImages();
        } catch (uploadError) {
            // Clean up files if the database insert failed.
            if (uploadedPaths.length > 0) {
                const { error: cleanupError } = await supabase.storage
                    .from("media")
                    .remove(uploadedPaths);

                if (cleanupError) {
                    console.error(
                        "Failed to clean up uploaded carousel images:",
                        cleanupError
                    );
                }
            }

            setError(
                uploadError instanceof Error
                    ? uploadError.message
                    : "Image upload failed."
            );
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(image: CarouselImage) {
        const confirmed = window.confirm(
            "Remove this image from the carousel? This cannot be undone."
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        const storagePath = getStoragePath(image.image_url);

        if (!storagePath) {
            setError("Could not determine the image's storage path.");
            return;
        }

        // Remove the database record first.
        const { error: databaseError } = await supabase
            .from("gallery_carousel_images")
            .delete()
            .eq("id", image.id);

        if (databaseError) {
            setError(databaseError.message);
            return;
        }

        // Then remove the actual Storage object.
        const { error: storageError } = await supabase.storage
            .from("media")
            .remove([storagePath]);

        if (storageError) {
            setError(
                `The image was removed from the carousel, but its Storage file could not be deleted: ${storageError.message}`
            );
        } else {
            setSuccess("Image removed successfully.");
        }

        await loadImages();
    }

    function handleDrop(targetId: string) {
        if (!draggingId || draggingId === targetId) {
            setDraggingId(null);
            setDragOverId(null);
            return;
        }

        const reorderedImages = [...images];

        const sourceIndex = reorderedImages.findIndex(
            (image) => image.id === draggingId
        );

        const targetIndex = reorderedImages.findIndex(
            (image) => image.id === targetId
        );

        if (sourceIndex === -1 || targetIndex === -1) {
            setDraggingId(null);
            setDragOverId(null);
            return;
        }

        const [movedImage] = reorderedImages.splice(sourceIndex, 1);

        reorderedImages.splice(targetIndex, 0, movedImage);

        setImages(reorderedImages);
        setDraggingId(null);
        setDragOverId(null);

        setSuccess("");
        setError("");
    }

    async function handleSaveOrder() {
        setSaving(true);
        setError("");
        setSuccess("");

        const updates = await Promise.all(
            images.map((image, index) =>
                supabase
                    .from("gallery_carousel_images")
                    .update({ display_order: index })
                    .eq("id", image.id)
            )
        );

        const failedUpdate = updates.find((result) => result.error);

        if (failedUpdate?.error) {
            setError(
                `Failed to save image order: ${failedUpdate.error.message}`
            );

            await loadImages();
        } else {
            setImages((current) =>
                current.map((image, index) => ({
                    ...image,
                    display_order: index,
                }))
            );

            setSuccess("Carousel order saved successfully.");
        }

        setSaving(false);
    }

    return (
        <div className="admin-content carousel-admin">
            <header className="admin-page-header admin-header-row">
                <div>
                    <p className="admin-eyebrow">CONTENT MANAGEMENT</p>
                    <h1>Carousel</h1>
                    <p>
                        Manage the images displayed beside the digital book.
                    </p>
                </div>

                <button
                    className="admin-primary-button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    <Upload size={18} />
                    {uploading ? "Uploading..." : "Upload images"}
                </button>
            </header>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleUpload}
            />

            {error && (
                <div className="admin-alert error">{error}</div>
            )}

            {success && (
                <div className="admin-alert success">{success}</div>
            )}

            <section className="admin-list-section">
                <div className="admin-list-heading carousel-admin-heading">
                    <div>
                        <h2>Carousel images</h2>
                        <span>
                            {images.length} image{images.length === 1 ? "" : "s"} ·
                            Drag to change display order
                        </span>
                    </div>

                    {images.length > 0 && (
                        <button
                            className="admin-primary-button"
                            onClick={handleSaveOrder}
                            disabled={saving || uploading}
                        >
                            <Save size={17} />
                            {saving ? "Saving..." : "Save order"}
                        </button>
                    )}
                </div>

                {loading ? (
                    <p className="admin-empty-state">
                        Loading carousel images...
                    </p>
                ) : images.length === 0 ? (
                    <div className="admin-empty-state">
                        <Images size={34} />
                        <h3>No carousel images yet</h3>
                        <p>
                            Upload images to start building your carousel.
                        </p>
                    </div>
                ) : (
                    <div className="carousel-image-grid">
                        {images.map((image, index) => (
                            <div
                                key={image.id}
                                className={[
                                    "carousel-image-card",
                                    draggingId === image.id ? "dragging" : "",
                                    dragOverId === image.id ? "drag-over" : "",
                                ].filter(Boolean).join(" ")}
                                draggable
                                onDragStart={(event) => {
                                    setDraggingId(image.id);
                                    event.dataTransfer.effectAllowed = "move";
                                    event.dataTransfer.setData(
                                        "text/plain",
                                        image.id
                                    );
                                }}
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    event.dataTransfer.dropEffect = "move";
                                    setDragOverId(image.id);
                                }}
                                onDrop={(event) => {
                                    event.preventDefault();
                                    handleDrop(image.id);
                                }}
                                onDragEnd={() => {
                                    setDraggingId(null);
                                    setDragOverId(null);
                                }}
                            >
                                <div className="carousel-image-preview">
                                    <img
                                        src={image.image_url}
                                        alt={`Carousel image ${index + 1}`}
                                    />

                                    <button
                                        type="button"
                                        className="carousel-image-remove"
                                        title="Remove image"
                                        aria-label={`Remove carousel image ${index + 1}`}
                                        onClick={() => handleDelete(image)}
                                        disabled={uploading || saving}
                                    >
                                        <X size={17} />
                                    </button>

                                    <div className="carousel-image-order">
                                        <GripVertical size={16} />
                                        {index + 1}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
