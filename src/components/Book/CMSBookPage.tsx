import type { CSSProperties } from "react";
import type { CMSPage } from "./types";

interface CMSBookPageProps {
    page: CMSPage;
}

function getVideoEmbedUrl(url: string): string | null {
    try {
        const parsed = new URL(url);

        if (parsed.hostname === "www.youtube.com" || parsed.hostname === "youtube.com") {
            const videoId = parsed.searchParams.get("v");

            return videoId
                ? `https://www.youtube.com/embed/${videoId}`
                : null;
        }

        if (parsed.hostname === "youtu.be") {
            const videoId = parsed.pathname.slice(1);

            return videoId
                ? `https://www.youtube.com/embed/${videoId}`
                : null;
        }

        if (parsed.hostname === "www.facebook.com" || parsed.hostname === "facebook.com") {
            return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
        }

        if (parsed.hostname === "player.vimeo.com") {
            return url;
        }

        if (parsed.hostname === "vimeo.com") {
            const videoId = parsed.pathname.split("/").filter(Boolean).pop();

            return videoId
                ? `https://player.vimeo.com/video/${videoId}`
                : null;
        }

        return null;
    } catch {
        return null;
    }
}

export default function CMSBookPage({ page }: CMSBookPageProps) {
    const content = page.content ?? {};

    const headingStyle: CSSProperties = {
        fontFamily: content.heading_font_family ?? "Georgia",
        fontSize: `${content.heading_font_size ?? 30}px`,
    };

    const bodyStyle: CSSProperties = {
        fontFamily: content.body_font_family ?? "Georgia",
        fontSize: `${content.body_font_size ?? 15}px`,
        textAlign: content.body_text_align ?? "justify",
        lineHeight: content.body_line_height ?? 1.7,
    };

    return (
        <section className={`cms-book-page cms-book-page-${page.page_type}`}>
            <header className="destination-info-header">
                <p className="destination-eyebrow">
                    {page.page_type.toUpperCase()}
                </p>

                <h1 style={headingStyle}>{page.title}</h1>

                <span className="destination-divider">❧</span>
            </header>

            {page.page_type === "text" && (
                <div className="destination-description" style={bodyStyle}>
                    {(content.description ?? []).map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </div>
            )}

            {page.page_type === "image" && (
                <figure className="cms-image-content">
                    {content.image_url ? (
                        <div className="cms-image-frame">
                            <div className="cms-image-layer">
                                <img
                                    src={content.image_url}
                                    alt={content.alt || page.title}
                                />

                                {content.overlay_enabled && content.overlay_url && (
                                    <img
                                        src={content.overlay_url}
                                        alt=""
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            left: `${content.overlay_position_x ?? 50}%`,
                                            top: `${content.overlay_position_y ?? 50}%`,
                                            width: `${(content.overlay_scale ?? 1) * 100}%`,
                                            height: `${(content.overlay_scale ?? 1) * 100}%`,
                                            objectFit: "contain",
                                            transform: "translate(-50%, -50%)",
                                            opacity: content.overlay_opacity ?? 1,
                                            pointerEvents: "none",
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <p>Image unavailable.</p>
                    )}

                    {content.caption && (
                        <figcaption>{content.caption}</figcaption>
                    )}
                </figure>
            )}

            {page.page_type === "video" && (
                <div className="video-container">
                    {content.video_url && getVideoEmbedUrl(content.video_url) ? (
                        <iframe
                            src={getVideoEmbedUrl(content.video_url)!}
                            title={page.title}
                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                            allowFullScreen
                        />
                    ) : (
                        <p>Video unavailable or unsupported URL.</p>
                    )}
                </div>
            )}

            {page.page_type === "gallery" && (
                <div className="cms-gallery-content">
                    {(content.images ?? []).map((image, index) => (
                        <figure key={`${image.url}-${index}`}>
                            <img
                                src={image.url}
                                alt={image.alt || `${page.title} image ${index + 1}`}
                                loading="lazy"
                            />

                            {image.caption && (
                                <figcaption>{image.caption}</figcaption>
                            )}
                        </figure>
                    ))}
                </div>
            )}
        </section>
    );
}