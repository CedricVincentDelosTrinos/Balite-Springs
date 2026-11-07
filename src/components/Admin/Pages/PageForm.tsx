
import type { FormEventHandler } from "react";
import { X } from "lucide-react";

import PageTypeFields from "./PageTypeFields";

import type {
    Destination,
    PageForm as PageFormData,
} from "../../../types/admin/pages";

interface PageFormProps {
    form: PageFormData;
    editingId: string | null;
    saving: boolean;
    destinations: Destination[];
    selectedImageFile: File | null;
    selectedOverlayFile: File | null;
    onOverlayFileChange: (file: File | null) => void;
    onFieldChange: (
        field: keyof PageFormData,
        value: string | boolean | number
    ) => void;
    onImageFileChange: (file: File | null) => void;
    onSubmit: FormEventHandler<HTMLFormElement>;
    onClose: () => void;
}

export default function PageForm({
    form,
    editingId,
    saving,
    destinations,
    selectedImageFile,
    selectedOverlayFile,
    onOverlayFileChange,
    onFieldChange,
    onImageFileChange,
    onSubmit,
    onClose,
}: PageFormProps) {
    return (
        <section className="admin-form-panel">
            <div className="admin-form-header">
                <div>
                    <h2>{editingId ? "Edit page" : "New page"}</h2>
                    <p>
                        {editingId
                            ? "Update the page content and settings."
                            : "Add a new page to the digital brochure."}
                    </p>
                </div>

                <button
                    type="button"
                    className="admin-icon-button"
                    onClick={onClose}
                    aria-label="Close form"
                >
                    <X size={18} />
                </button>
            </div>

            <form onSubmit={onSubmit} className="admin-form">
                <div className="admin-form-grid">
                    <label>
                        Page type
                        <select
                            value={form.page_type}
                            onChange={(e) =>
                                onFieldChange("page_type", e.target.value)
                            }
                        >
                            <option value="text">Text</option>
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                        </select>
                    </label>

                    <label>
                        Destination
                        <select
                            value={form.destination_id}
                            onChange={(e) =>
                                onFieldChange("destination_id", e.target.value)
                            }
                        >
                            <option value="">General page</option>
                            {destinations.map((destination) => (
                                <option
                                    key={destination.id}
                                    value={destination.id}
                                >
                                    {destination.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Page title *
                        <input
                            value={form.title}
                            onChange={(e) =>
                                onFieldChange("title", e.target.value)
                            }
                            placeholder="Enter page title"
                            required
                        />
                    </label>

                    <label>
                        Page slug *
                        <input
                            value={form.slug}
                            onChange={(e) =>
                                onFieldChange("slug", e.target.value)
                            }
                            placeholder="page-slug"
                            required
                        />
                    </label>

                    <PageTypeFields
                        form={form}
                        selectedImageFile={selectedImageFile}
                        selectedOverlayFile={selectedOverlayFile}
                        onFieldChange={onFieldChange}
                        onImageFileChange={onImageFileChange}
                        onOverlayFileChange={onOverlayFileChange}
                    />


                    <label className="admin-checkbox-label">
                        <input
                            className="admin-checkbox"
                            type="checkbox"
                            checked={form.is_published}
                            onChange={(e) =>
                                onFieldChange("is_published", e.target.checked)
                            }
                        />
                        <span>Publish this page</span>
                    </label>
                </div>

                <div className="admin-form-actions">
                    <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="admin-primary-button"
                        disabled={saving}
                    >
                        {saving
                            ? "Saving..."
                            : editingId
                                ? "Save changes"
                                : "Create page"}
                    </button>
                </div>
            </form>
        </section>
    );
}
