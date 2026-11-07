
import { useEffect, useState } from "react";
import type { PageForm } from "../../../types/admin/pages";

interface PageTypeFieldsProps {
    form: PageForm;
    selectedImageFile: File | null;
    selectedOverlayFile: File | null;
    onFieldChange: (field: keyof PageForm, value: string | boolean | number) => void;
    onImageFileChange: (file: File | null) => void;
    onOverlayFileChange: (file: File | null) => void;
}

export default function PageTypeFields({
    form,
    selectedImageFile,
    selectedOverlayFile,
    onFieldChange,
    onImageFileChange,
    onOverlayFileChange,
}: PageTypeFieldsProps) {
    const [imagePreview, setImagePreview] = useState("");
    const [overlayPreview, setOverlayPreview] = useState("");

    useEffect(() => {
        if (!selectedImageFile) {
            setImagePreview("");
            return;
        }

        const url = URL.createObjectURL(selectedImageFile);
        setImagePreview(url);

        return () => URL.revokeObjectURL(url);
    }, [selectedImageFile]);

    useEffect(() => {
        if (!selectedOverlayFile) {
            setOverlayPreview("");
            return;
        }

        const url = URL.createObjectURL(selectedOverlayFile);
        setOverlayPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [selectedOverlayFile]);

    const imageSource = imagePreview || form.image_url;
    const overlaySource = overlayPreview || form.overlay_url;

    return (
        <>
            {form.page_type === "text" && (
                <div className="full-width">
                    <h3>Typography</h3>

                    <label>
                        Heading font
                        <select
                            value={form.heading_font_family}
                            onChange={(e) =>
                                onFieldChange("heading_font_family", e.target.value)
                            }
                        >
                            <option value="Georgia">Georgia</option>
                            <option value="Arial">Arial</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Trebuchet MS">Trebuchet MS</option>
                            <option value="Courier New">Courier New</option>
                        </select>
                    </label>

                    <label>
                        Heading size: {form.heading_font_size}px
                        <input
                            type="range"
                            min="18"
                            max="48"
                            step="1"
                            value={form.heading_font_size}
                            onChange={(e) =>
                                onFieldChange("heading_font_size", Number(e.target.value))
                            }
                        />
                    </label>

                    <label>
                        Body font
                        <select
                            value={form.body_font_family}
                            onChange={(e) =>
                                onFieldChange("body_font_family", e.target.value)
                            }
                        >
                            <option value="Georgia">Georgia</option>
                            <option value="Arial">Arial</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Trebuchet MS">Trebuchet MS</option>
                            <option value="Courier New">Courier New</option>
                        </select>
                    </label>

                    <label>
                        Body size: {form.body_font_size}px
                        <input
                            type="range"
                            min="12"
                            max="24"
                            step="1"
                            value={form.body_font_size}
                            onChange={(e) =>
                                onFieldChange("body_font_size", Number(e.target.value))
                            }
                        />
                    </label>

                    <label>
                        Text alignment
                        <select
                            value={form.body_text_align}
                            onChange={(e) =>
                                onFieldChange("body_text_align", e.target.value)
                            }
                        >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                            <option value="justify">Justified</option>
                        </select>
                    </label>

                    <label>
                        Line spacing: {form.body_line_height}
                        <input
                            type="range"
                            min="1"
                            max="2.5"
                            step="0.1"
                            value={form.body_line_height}
                            onChange={(e) =>
                                onFieldChange("body_line_height", Number(e.target.value))
                            }
                        />
                    </label>
                </div>
            )}
            {form.page_type === "text" && (
                <label className="full-width">
                    Page content
                    <textarea
                        value={form.description}
                        onChange={(e) =>
                            onFieldChange("description", e.target.value)
                        }
                        placeholder={"Write your page content here.\n\nSeparate paragraphs with a blank line."}
                        rows={9}
                    />
                    <span className="admin-field-hint">
                        Separate paragraphs with a blank line.
                    </span>
                </label>
                
            )}

            <div className="full-width">
                <strong>Live preview</strong>

                <div
                    style={{
                        marginTop: "12px",
                        padding: "24px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        background: "#fffdf8",
                        color: "#333",
                        minHeight: "180px",
                    }}
                >
                    <h1
                        style={{
                            fontFamily: form.heading_font_family,
                            fontSize: `${form.heading_font_size}px`,
                            textAlign: "center",
                            margin: "0 0 20px",
                        }}
                    >
                        {form.title || "Page title"}
                    </h1>

                    <div
                        style={{
                            fontFamily: form.body_font_family,
                            fontSize: `${form.body_font_size}px`,
                            textAlign: form.body_text_align,
                            lineHeight: form.body_line_height,
                            whiteSpace: "pre-line",
                        }}
                    >
                        {form.description.trim() ? (
                            form.description.trim().split(/\n\s*\n/).map((paragraph, index) => (
                                <p key={index} style={{ margin: "0 0 1em" }}>
                                    {paragraph.trim()}
                                </p>
                            ))
                        ) : (
                            <p style={{ opacity: 0.5 }}>
                                Your page content will appear here...
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {form.page_type === "image" && (
                <>
                    <label className="full-width">
                        Upload image
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                            onChange={(e) =>
                                onImageFileChange(e.target.files?.[0] ?? null)
                            }
                        />

                        <span className="admin-field-hint">
                            Maximum file size: 100 MB. Supported formats: JPG, PNG,
                            WebP, GIF, and AVIF.
                        </span>

                        {selectedImageFile && (
                            <span className="admin-field-hint">
                                Selected: {selectedImageFile.name}
                                <button
                                    type="button"
                                    className="admin-secondary-button"
                                    onClick={() => onImageFileChange(null)}
                                >
                                    Remove selected file
                                </button>
                            </span>
                        )}
                    </label>

                    <label className="full-width">
                        Or use an external image URL
                        <input
                            type="url"
                            value={form.image_url}
                            onChange={(e) =>
                                onFieldChange("image_url", e.target.value)
                            }
                            placeholder="https://..."
                        />
                        <span className="admin-field-hint">
                            An uploaded file takes priority over this URL.
                        </span>
                    </label>

                    <label>
                        Alternative text
                        <input
                            value={form.alt}
                            onChange={(e) =>
                                onFieldChange("alt", e.target.value)
                            }
                            placeholder="Describe the image"
                        />
                    </label>

                    <label>
                        Caption
                        <input
                            value={form.caption}
                            onChange={(e) =>
                                onFieldChange("caption", e.target.value)
                            }
                            placeholder="Optional image caption"
                        />
                    </label>

                    <div className="full-width">
                        <label className="admin-checkbox-label">
                            <input
                                className="admin-checkbox"
                                type="checkbox"
                                checked={form.overlay_enabled}
                                onChange={(e) =>
                                    onFieldChange("overlay_enabled", e.target.checked)
                                }
                            />
                            <span>Enable decorative leaf overlay</span>
                        </label>
                    </div>

                    {form.overlay_enabled && (
                        <>
                            <label className="full-width">
                                Upload overlay image
                                <input
                                    type="file"
                                    accept="image/png,image/webp,image/avif"
                                    onChange={(e) =>
                                        onOverlayFileChange(e.target.files?.[0] ?? null)
                                    }
                                />
                                <span className="admin-field-hint">
                                    Use a transparent PNG or WebP overlay for the best result.
                                </span>

                                {selectedOverlayFile && (
                                    <span className="admin-field-hint">
                                        Selected: {selectedOverlayFile.name}
                                        <button
                                            type="button"
                                            className="admin-secondary-button"
                                            onClick={() => onOverlayFileChange(null)}
                                        >
                                            Remove selected overlay
                                        </button>
                                    </span>
                                )}
                            </label>

                            <label className="full-width">
                                Or use an existing overlay URL
                                <input
                                    type="url"
                                    value={form.overlay_url}
                                    onChange={(e) =>
                                        onFieldChange("overlay_url", e.target.value)
                                    }
                                    placeholder="https://..."
                                />
                            </label>

                            <label className="full-width">
                                Overlay opacity: {Math.round(form.overlay_opacity * 100)}%
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={form.overlay_opacity}
                                    onChange={(e) =>
                                        onFieldChange("overlay_opacity", Number(e.target.value))
                                    }
                                />
                            </label>

                            <label className="full-width">
                                Overlay scale: {Math.round(form.overlay_scale * 100)}%
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2"
                                    step="0.05"
                                    value={form.overlay_scale}
                                    onChange={(e) =>
                                        onFieldChange("overlay_scale", Number(e.target.value))
                                    }
                                />
                            </label>

                            <label>
                                Horizontal position: {form.overlay_position_x}%
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={form.overlay_position_x}
                                    onChange={(e) =>
                                        onFieldChange("overlay_position_x", Number(e.target.value))
                                    }
                                />
                            </label>

                            <label>
                                Vertical position: {form.overlay_position_y}%
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={form.overlay_position_y}
                                    onChange={(e) =>
                                        onFieldChange("overlay_position_y", Number(e.target.value))
                                    }
                                />
                            </label>

                            <div className="full-width">
                                <strong>Combined preview</strong>

                                {imageSource ? (
                                    <div
                                        style={{
                                            position: "relative",
                                            width: "100%",
                                            display: "inline-block",
                                            lineHeight: 0,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <img
                                            src={imageSource}
                                            alt="Base image preview"
                                            style={{
                                                display: "block",
                                                width: "100%",
                                                height: "auto",
                                            }}
                                        />

                                        {overlaySource && (
                                            <img
                                                src={overlaySource}
                                                alt="Decorative overlay preview"
                                                style={{
                                                    position: "absolute",
                                                    left: `${form.overlay_position_x}%`,
                                                    top: `${form.overlay_position_y}%`,
                                                    width: `${form.overlay_scale * 100}%`,
                                                    height: `${form.overlay_scale * 100}%`,
                                                    objectFit: "contain",
                                                    transform: "translate(-50%, -50%)",
                                                    opacity: form.overlay_opacity,
                                                    pointerEvents: "none",
                                                }}
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <p className="admin-field-hint">
                                        Upload an image or provide an image URL to preview the overlay.
                                    </p>
                                )}

                                {!overlaySource && (
                                    <p className="admin-field-hint">
                                        Upload an overlay image or provide its URL to see it here.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}

            {form.page_type === "video" && (
                <>
                    <label className="full-width">
                        Video URL *
                        <input
                            type="url"
                            value={form.video_url}
                            onChange={(e) =>
                                onFieldChange("video_url", e.target.value)
                            }
                            placeholder="https://..."
                            required
                        />
                        <span className="admin-field-hint">
                            Provide the video or supported embed URL.
                        </span>
                    </label>

                    <label className="full-width">
                        Description
                        <textarea
                            value={form.description}
                            onChange={(e) =>
                                onFieldChange("description", e.target.value)
                            }
                            placeholder="Optional video description"
                            rows={4}
                        />
                    </label>
                </>
            )}
        </>
    );
}
