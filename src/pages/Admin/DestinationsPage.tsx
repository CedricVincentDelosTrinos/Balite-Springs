
import { useEffect, useState, type FormEvent } from "react";
import { MapPin, Plus, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Destination {
    id: string;
    slug: string;
    name: string;
    location: string | null;
    maps_url: string | null;
    image_url: string | null;
}

interface DestinationForm {
    slug: string;
    name: string;
    location: string;
    maps_url: string;
    image_url: string;
}

const emptyForm: DestinationForm = {
    slug: "",
    name: "",
    location: "",
    maps_url: "",
    image_url: "",
};

function createSlug(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

const DESTINATION_DRAFT_KEY = "balite-admin-destination-draft";

interface DestinationDraft {
    form: DestinationForm;
    editingId: string | null;
    formOpen: boolean;
}

function getSavedDraft(): DestinationDraft | null {
    try {
        const saved = localStorage.getItem(DESTINATION_DRAFT_KEY);
        return saved ? JSON.parse(saved) as DestinationDraft : null;
    } catch {
        return null;
    }
}

export default function DestinationsPage() {
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [savedDraft] = useState(getSavedDraft);

    const [formOpen, setFormOpen] = useState(
        savedDraft?.formOpen ?? false
    );

    const [editingId, setEditingId] = useState<string | null>(
        savedDraft?.editingId ?? null
    );

    const [form, setForm] = useState<DestinationForm>(
        savedDraft?.form ?? emptyForm
    );

    async function loadDestinations() {
        setLoading(true);
        setError("");

        const { data, error } = await supabase
            .from("destinations")
            .select("id, slug, name, location, maps_url, image_url")
            .order("name", { ascending: true });

        if (error) {
            setError(error.message);
        } else {
            setDestinations(data ?? []);
        }

        setLoading(false);
    }

    useEffect(() => {
        loadDestinations();
    }, []);

    function openCreateForm() {
        setEditingId(null);
        setForm(emptyForm);
        setError("");
        setSuccess("");
        setFormOpen(true);
    }

    function openEditForm(destination: Destination) {
        setEditingId(destination.id);
        setForm({
            slug: destination.slug,
            name: destination.name,
            location: destination.location ?? "",
            maps_url: destination.maps_url ?? "",
            image_url: destination.image_url ?? "",
        });
        setError("");
        setSuccess("");
        setFormOpen(true);
    }

    function closeForm() {
        setFormOpen(false);
        setEditingId(null);
        setForm(emptyForm);
    }

    function updateField(field: keyof DestinationForm, value: string) {
        setForm((current) => ({
            ...current,
            [field]: value,
            ...(field === "name" && !editingId
                ? { slug: createSlug(value) }
                : {}),
        }));
    }

/* --------------------- Draft Management ----------------------- */
    useEffect(() => {
        if (formOpen) {
            const draft: DestinationDraft = {
                form,
                editingId,
                formOpen,
            };

            localStorage.setItem(
                DESTINATION_DRAFT_KEY,
                JSON.stringify(draft)
            );
        } else {
            localStorage.removeItem(DESTINATION_DRAFT_KEY);
        }
    }, [form, editingId, formOpen]);


    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        const payload = {
            slug: form.slug.trim(),
            name: form.name.trim(),
            location: form.location.trim() || null,
            maps_url: form.maps_url.trim() || null,
            image_url: form.image_url.trim() || null,
        };

        const result = editingId
            ? await supabase
                .from("destinations")
                .update(payload)
                .eq("id", editingId)
            : await supabase
                .from("destinations")
                .insert(payload);

        if (result.error) {
            setError(result.error.message);
            setSaving(false);
            return;
        }

        setSuccess(editingId
            ? "Destination updated successfully."
            : "Destination created successfully."
        );

        await loadDestinations();
        setSaving(false);
        closeForm();
    }

    async function handleDelete(destination: Destination) {
        const confirmed = window.confirm(
            `Delete "${destination.name}"? Its associated pages will also be deleted.`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        const { error } = await supabase
            .from("destinations")
            .delete()
            .eq("id", destination.id);

        if (error) {
            setError(error.message);
            return;
        }

        setDestinations((current) =>
            current.filter((item) => item.id !== destination.id)
        );

        setSuccess(`${destination.name} was deleted.`);
    }

    return (
        <div className="admin-content">
            <header className="admin-page-header admin-header-row">
                <div>
                    <p className="admin-eyebrow">CONTENT MANAGEMENT</p>
                    <h1>Destinations</h1>
                    <p>Manage the destinations displayed in your brochure.</p>
                </div>

                <button className="admin-primary-button" onClick={openCreateForm}>
                    <Plus size={18} />
                    Add destination
                </button>
            </header>

            {error && <div className="admin-alert error">{error}</div>}
            {success && <div className="admin-alert success">{success}</div>}

            {formOpen && (
                <section className="admin-form-panel">
                    <div className="admin-form-heading">
                        <div>
                            <h2>{editingId ? "Edit destination" : "New destination"}</h2>
                            <p>Enter the destination details below.</p>
                        </div>

                        <button
                            type="button"
                            className="admin-icon-button"
                            onClick={closeForm}
                            aria-label="Close form"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="admin-form">
                        <div className="admin-form-grid">
                            <label>
                                Destination name *
                                <input
                                    value={form.name}
                                    onChange={(e) => updateField("name", e.target.value)}
                                    placeholder="e.g. Balite Spring"
                                    required
                                />
                            </label>

                            <label>
                                Slug *
                                <input
                                    value={form.slug}
                                    onChange={(e) => updateField("slug", e.target.value)}
                                    placeholder="e.g. balite"
                                    required
                                />
                            </label>

                            <label className="full-width">
                                Location
                                <input
                                    value={form.location}
                                    onChange={(e) => updateField("location", e.target.value)}
                                    placeholder="Destination address"
                                />
                            </label>

                            <label className="full-width">
                                Google Maps URL
                                <input
                                    type="url"
                                    value={form.maps_url}
                                    onChange={(e) => updateField("maps_url", e.target.value)}
                                    placeholder="https://maps.google.com/..."
                                />
                            </label>

                            <label className="full-width">
                                Main image URL
                                <input
                                    type="url"
                                    value={form.image_url}
                                    onChange={(e) => updateField("image_url", e.target.value)}
                                    placeholder="https://..."
                                />
                            </label>
                        </div>

                        <div className="admin-form-actions">
                            <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={closeForm}
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
                                        : "Create destination"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="admin-list-section">
                <div className="admin-list-heading">
                    <h2>All destinations</h2>
                    <span>{destinations.length} total</span>
                </div>

                {loading ? (
                    <p className="admin-empty-state">Loading destinations...</p>
                ) : destinations.length === 0 ? (
                    <div className="admin-empty-state">
                        <MapPin size={32} />
                        <h3>No destinations yet</h3>
                        <p>Add your first destination to get started.</p>
                        <button
                            className="admin-primary-button"
                            onClick={openCreateForm}
                        >
                            <Plus size={18} />
                            Add destination
                        </button>
                    </div>
                ) : (
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Destination</th>
                                    <th>Slug</th>
                                    <th>Location</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {destinations.map((destination) => (
                                    <tr key={destination.id}>
                                        <td>
                                            <strong>{destination.name}</strong>
                                        </td>
                                        <td>{destination.slug}</td>
                                        <td>{destination.location || "—"}</td>
                                        <td>
                                            <div className="admin-row-actions">
                                                <button
                                                    className="admin-icon-button"
                                                    onClick={() => openEditForm(destination)}
                                                    aria-label={`Edit ${destination.name}`}
                                                    title="Edit"
                                                >
                                                    <Pencil size={17} />
                                                </button>

                                                <button
                                                    className="admin-icon-button danger"
                                                    onClick={() => handleDelete(destination)}
                                                    aria-label={`Delete ${destination.name}`}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
