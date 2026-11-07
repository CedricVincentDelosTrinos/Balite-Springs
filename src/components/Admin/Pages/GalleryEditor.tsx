import { useState } from "react";
import type { GalleryImage } from "../../../types/admin/pages";

interface GalleryEditorProps {
    images: GalleryImage[];
    onImagesChange: (images: GalleryImage[]) => void;
    selectedFiles: File[];
    onSelectedFilesChange: (files: File[]) => void;
}

export default function GalleryEditor({
    images,
    onImagesChange,
    selectedFiles,
    onSelectedFilesChange,
}: GalleryEditorProps) {
    const [imageUrl, setImageUrl] = useState("");
    const [urlError, setUrlError] = useState("");

    function addImageUrl() {
        const trimmedUrl = imageUrl.trim();

        if (!trimmedUrl) return;

        try {
            const parsedUrl = new URL(trimmedUrl);

            if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                throw new Error("Invalid protocol");
            }
        } catch {
            setUrlError("Please enter a valid HTTP or HTTPS image URL.");
            return;
        }

        onImagesChange([
            ...images,
            {
                url: trimmedUrl,
                alt: "",
                caption: "",
            },
        ]);

        setImageUrl("");
        setUrlError("");
    }

    function updateImage(
        index: number,
        field: "alt" | "caption",
        value: string
    ) {
        onImagesChange(
            images.map((image, imageIndex) =>
                imageIndex === index
                    ? { ...image, [field]: value }
                    : image
            )
        );
    }

    function removeImage(index: number) {
        onImagesChange(images.filter((_, imageIndex) => imageIndex !== index));
    }

    function moveImage(index: number, direction: -1 | 1) {
        const targetIndex = index + direction;

        if (targetIndex < 0 || targetIndex >= images.length) return;

        const reorderedImages = [...images];

        [reorderedImages[index], reorderedImages[targetIndex]] = [
            reorderedImages[targetIndex],
            reorderedImages[index],
        ];

        onImagesChange(reorderedImages);
    }

    return (
        <>
            <label className="full-width">
                Upload gallery images
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    multiple
                    onChange={(event) => {
                        onSelectedFilesChange([
                            ...selectedFiles,
                            ...Array.from(event.target.files ?? []),
                        ]);

                        event.target.value = "";
                    }}
                />

                <span className="admin-field-hint">
                    Select multiple images. Maximum 100 MB per image.
                </span>
            </label>

            {selectedFiles.length > 0 && (
                <div className="full-width">
                    <strong>New uploads ({selectedFiles.length})</strong>

                    {selectedFiles.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className="admin-field-hint"
                        >
                            {file.name}
                            <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={() =>
                                    onSelectedFilesChange(
                                        selectedFiles.filter(
                                            (_, fileIndex) => fileIndex !== index
                                        )
                                    )
                                }
                            >
                                Remove
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() => onSelectedFilesChange([])}
                    >
                        Clear all uploads
                    </button>
                </div>
            )}

            <div className="full-width">
                <label>
                    Add an external image URL
                    <input
                        type="url"
                        value={imageUrl}
                        onChange={(event) => {
                            setImageUrl(event.target.value);
                            setUrlError("");
                        }}
                        placeholder="https://..."
                    />
                </label>

                {urlError && (
                    <p className="admin-alert error">{urlError}</p>
                )}

                <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={addImageUrl}
                    disabled={!imageUrl.trim()}
                >
                    Add image URL
                </button>
            </div>

            <div className="full-width">
                <h3>Gallery images ({images.length})</h3>

                {images.length === 0 ? (
                    <p className="admin-field-hint">
                        No existing images yet. Add a URL or upload image files.
                    </p>
                ) : (
                    <div className="gallery-editor-list">
                        {images.map((image, index) => (
                            <div
                                key={`${image.url}-${index}`}
                                className="gallery-editor-item"
                            >
                                <div className="gallery-editor-preview">
                                    <img
                                        src={image.url}
                                        alt={image.alt || `Gallery image ${index + 1}`}
                                    />
                                </div>

                                <div className="gallery-editor-fields">
                                    <strong>Image {index + 1}</strong>

                                    <label>
                                        Alternative text
                                        <input
                                            value={image.alt}
                                            onChange={(event) =>
                                                updateImage(
                                                    index,
                                                    "alt",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Describe the image"
                                        />
                                    </label>

                                    <label>
                                        Caption
                                        <input
                                            value={image.caption}
                                            onChange={(event) =>
                                                updateImage(
                                                    index,
                                                    "caption",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Optional image caption"
                                        />
                                    </label>

                                    <div className="admin-row-actions">
                                        <button
                                            type="button"
                                            className="admin-secondary-button"
                                            disabled={index === 0}
                                            onClick={() => moveImage(index, -1)}
                                        >
                                            Move up
                                        </button>

                                        <button
                                            type="button"
                                            className="admin-secondary-button"
                                            disabled={index === images.length - 1}
                                            onClick={() => moveImage(index, 1)}
                                        >
                                            Move down
                                        </button>

                                        <button
                                            type="button"
                                            className="admin-secondary-button"
                                            onClick={() => removeImage(index)}
                                        >
                                            Remove image
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}