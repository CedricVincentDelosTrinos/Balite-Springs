
import { useEffect, useState } from "react";
import {
    Check,
    X,
    Trash2,
    RefreshCw,
    MessageSquare,
    AlertTriangle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

import "./FeedbackAdmin.css";

type FeedbackStatus = "pending" | "approved" | "rejected";

type FeedbackFilter = FeedbackStatus;

interface FeedbackImage {
    storage_path: string;
    thumbnail_path: string;
    alt_text: string;
    display_order: number;
    image_url: string | null;
    thumbnail_url: string | null;
}

interface FeedbackItem {
    id: string;
    display_name: string;
    message: string;
    status: FeedbackStatus;
    created_at: string;
    expires_at: string | null;
    images: FeedbackImage[];
    is_flagged: boolean;
    flag_reason: string | null;
}

export default function FeedbackPage() {
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [filter, setFilter] = useState<FeedbackFilter>("pending");
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function loadFeedback() {
        setLoading(true);
        setError("");

        try {
            const { data: entries, error: feedbackError } = await supabase
                .from("feedback")
                .select("id, display_name, message, status, created_at, expires_at")
                .order("created_at", { ascending: false });

            if (feedbackError) throw feedbackError;

            const ids = (entries ?? []).map((item) => item.id);

            if (ids.length === 0) {
                setFeedback([]);
                setLoading(false);
                return;
            }

            const [
                { data: imageRows, error: imageError },
                { data: moderationRows, error: moderationError },
            ] = await Promise.all([
                supabase
                    .from("feedback_images")
                    .select("feedback_id, storage_path, thumbnail_path, alt_text, display_order")
                    .in("feedback_id", ids)
                    .order("display_order", { ascending: true }),

                supabase
                    .from("feedback_moderation")
                    .select("feedback_id, is_flagged, flag_reason")
                    .in("feedback_id", ids),
            ]);

            if (imageError) throw imageError;
            if (moderationError) throw moderationError;

            const imageResults = await Promise.all(
                (imageRows ?? []).map(async (image) => {
                    const [main, thumbnail] = await Promise.all([
                        supabase.storage
                            .from("feedback-images")
                            .createSignedUrl(image.storage_path, 3600),

                        supabase.storage
                            .from("feedback-images")
                            .createSignedUrl(image.thumbnail_path, 3600),
                    ]);

                    return {
                        ...image,
                        image_url: main.data?.signedUrl ?? null,
                        thumbnail_url: thumbnail.data?.signedUrl ?? null,
                    };
                })
            );

            const moderationMap = new Map(
                (moderationRows ?? []).map((item) => [
                    item.feedback_id,
                    item,
                ])
            );

            const results: FeedbackItem[] = (entries ?? []).map((item) => {
                const moderation = moderationMap.get(item.id);

                return {
                    ...item,
                    status: item.status as FeedbackStatus,
                    images: imageResults.filter(
                        (image) => image.feedback_id === item.id
                    ),
                    is_flagged: moderation?.is_flagged ?? false,
                    flag_reason: moderation?.flag_reason ?? null,
                };
            });

            setFeedback(results);
        } catch (err) {
            console.error("Could not load feedback:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not load feedback."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadFeedback();
    }, []);

    async function updateStatus(
        item: FeedbackItem,
        status: "approved" | "rejected"
    ) {
        const action = status === "approved" ? "approve" : "reject";

        if (!window.confirm(
            `${action === "approve" ? "Approve" : "Reject"} feedback from ${item.display_name}?`
        )) {
            return;
        }

        setProcessingId(item.id);
        setError("");
        setSuccess("");

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;
            if (!user) throw new Error("Your admin session could not be verified.");

            const updatePayload = status === "rejected"
                ? {
                    status,
                    expires_at: new Date(
                        Date.now() + 7 * 24 * 60 * 60 * 1000
                    ).toISOString(),
                }
                : { status };

            const { error: statusError } = await supabase
                .from("feedback")
                .update(updatePayload)
                .eq("id", item.id)
                .eq("status", item.status);

            if (statusError) throw statusError;

            const { error: moderationError } = await supabase
                .from("feedback_moderation")
                .update({
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: user.id,
                })
                .eq("feedback_id", item.id);

            if (moderationError) throw moderationError;

            setSuccess(
                status === "approved"
                    ? "Feedback approved and published."
                    : "Feedback rejected. It will expire after seven days."
            );

            await loadFeedback();
        } catch (err) {
            console.error("Feedback moderation failed:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not update this feedback."
            );
        } finally {
            setProcessingId(null);
        }
    }

    async function deleteFeedback(item: FeedbackItem) {
        if (!window.confirm(
            `Permanently delete feedback from ${item.display_name} and all its photos? This cannot be undone.`
        )) {
            return;
        }

        setProcessingId(item.id);
        setError("");
        setSuccess("");

        try {
            const { data: images, error: imageError } = await supabase
                .from("feedback_images")
                .select("storage_path, thumbnail_path")
                .eq("feedback_id", item.id);

            if (imageError) throw imageError;

            const paths = (images ?? []).flatMap((image) => [
                image.storage_path,
                image.thumbnail_path,
            ]);

            if (paths.length > 0) {
                const { error: storageError } = await supabase.storage
                    .from("feedback-images")
                    .remove(paths);

                if (storageError) throw storageError;
            }

            const { error: deleteError } = await supabase
                .from("feedback")
                .delete()
                .eq("id", item.id);

            if (deleteError) throw deleteError;

            setFeedback((current) =>
                current.filter((entry) => entry.id !== item.id)
            );

            setSuccess("Feedback and associated photos deleted.");
        } catch (err) {
            console.error("Feedback deletion failed:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not delete this feedback."
            );
        } finally {
            setProcessingId(null);
        }
    }

    const visibleFeedback = feedback.filter(
        (item) => item.status === filter
    );

    const counts = {
        pending: feedback.filter((item) => item.status === "pending").length,
        approved: feedback.filter((item) => item.status === "approved").length,
        rejected: feedback.filter((item) => item.status === "rejected").length,
    };

    return (
        <div className="admin-content feedback-admin">
            <header className="admin-page-header admin-header-row">
                <div>
                    <p className="admin-eyebrow">CONTENT MANAGEMENT</p>
                    <h1>Visitor Feedback</h1>
                    <p>Review submissions and manage published visitor experiences.</p>
                </div>

                <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={loadFeedback}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </header>

            {error && <div className="admin-alert error">{error}</div>}
            {success && <div className="admin-alert success">{success}</div>}

            <div className="feedback-admin-tabs">
                {(["pending", "approved", "rejected"] as const).map((status) => (
                    <button
                        key={status}
                        type="button"
                        className={`feedback-admin-tab ${filter === status ? "active" : ""}`}
                        onClick={() => setFilter(status)}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        <span>{counts[status]}</span>
                    </button>
                ))}
            </div>

            <section className="admin-list-section">
                <div className="admin-list-heading">
                    <h2>
                        {filter === "pending"
                            ? "Awaiting review"
                            : filter === "approved"
                                ? "Published feedback"
                                : "Rejected feedback"}
                    </h2>
                    <span>{visibleFeedback.length} submissions</span>
                </div>

                {loading ? (
                    <p className="admin-empty-state">Loading feedback...</p>
                ) : visibleFeedback.length === 0 ? (
                    <div className="admin-empty-state">
                        <MessageSquare size={32} />
                        <h3>No {filter} feedback</h3>
                        <p>There are currently no submissions in this section.</p>
                    </div>
                ) : (
                    <div className="feedback-admin-list">
                        {visibleFeedback.map((item) => (
                            <article className="feedback-admin-card" key={item.id}>
                                <div className="feedback-admin-card-header">
                                    <div>
                                        <h3>{item.display_name}</h3>
                                        <time dateTime={item.created_at}>
                                            {new Date(item.created_at).toLocaleString(
                                                "en-PH",
                                                {
                                                    dateStyle: "medium",
                                                    timeStyle: "short",
                                                }
                                            )}
                                        </time>
                                    </div>

                                    <span className={`feedback-status ${item.status}`}>
                                        {item.status}
                                    </span>
                                </div>

                                {item.is_flagged && (
                                    <div className="feedback-flag-notice">
                                        <AlertTriangle size={16} />
                                        <span>
                                            Flagged for review
                                            {item.flag_reason
                                                ? `: ${item.flag_reason}`
                                                : ""}
                                        </span>
                                    </div>
                                )}

                                <p className="feedback-admin-message">
                                    {item.message}
                                </p>

                                {item.images.length > 0 && (
                                    <div className="feedback-admin-images">
                                        {item.images.map((image, index) => (
                                            <a
                                                key={`${item.id}-${index}`}
                                                href={image.image_url ?? undefined}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {image.thumbnail_url ? (
                                                    <img
                                                        src={image.thumbnail_url}
                                                        alt={image.alt_text}
                                                    />
                                                ) : (
                                                    <span>Image unavailable</span>
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                )}

                                <div className="feedback-admin-actions">
                                    {item.status !== "approved" && (
                                        <button
                                            type="button"
                                            className="admin-primary-button"
                                            disabled={processingId === item.id}
                                            onClick={() => updateStatus(item, "approved")}
                                        >
                                            <Check size={16} />
                                            Approve
                                        </button>
                                    )}

                                    {item.status !== "rejected" && (
                                        <button
                                            type="button"
                                            className="admin-secondary-button"
                                            disabled={processingId === item.id}
                                            onClick={() => updateStatus(item, "rejected")}
                                        >
                                            <X size={16} />
                                            Reject
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        className="admin-icon-button danger"
                                        title="Permanently delete"
                                        aria-label={`Delete feedback from ${item.display_name}`}
                                        disabled={processingId === item.id}
                                        onClick={() => deleteFeedback(item)}
                                    >
                                        <Trash2 size={17} />
                                    </button>

                                    {processingId === item.id && (
                                        <span className="feedback-processing">
                                            Processing...
                                        </span>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
