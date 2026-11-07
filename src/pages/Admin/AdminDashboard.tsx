
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../auth/AuthContext";

import {
    getDestinations,
    createDestination,
    updateDestination,
    deleteDestination,
} from "../../services/destinationService";

import type {
    Destination,
    DestinationInput,
} from "../../types/destination";

import "./AdminDashboard.css";

const emptyForm: DestinationInput = {
    slug: "",
    name: "",
    location: "",
    maps_url: "",
    image_url: "",
};

export default function AdminDashboard() {
    const { user, signOut } = useAuth();

    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [formOpen, setFormOpen] = useState(false);
    const [editingDestination, setEditingDestination] =
        useState<Destination | null>(null);

    const [form, setForm] = useState<DestinationInput>(emptyForm);

    async function loadDestinations() {
        setLoading(true);
        setError("");

        try {
            const data = await getDestinations();
            setDestinations(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load destinations."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadDestinations();
    }, []);

    function openCreateForm() {
        setEditingDestination(null);
        setForm(emptyForm);
        setError("");
        setFormOpen(true);
    }

    function openEditForm(destination: Destination) {
        setEditingDestination(destination);

        setForm({
            slug: destination.slug,
            name: destination.name,
            location: destination.location ?? "",
            maps_url: destination.maps_url ?? "",
            image_url: destination.image_url ?? "",
        });

        setError("");
        setFormOpen(true);
    }

    function closeForm() {
        setFormOpen(false);
        setEditingDestination(null);
        setForm(emptyForm);
        setError("");
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setSaving(true);
        setError("");

        const payload: DestinationInput = {
            slug: form.slug.trim().toLowerCase(),
            name: form.name.trim(),
            location: form.location?.trim() || null,
            maps_url: form.maps_url?.trim() || null,
            image_url: form.image_url?.trim() || null,
        };

        try {
            if (editingDestination) {
                await updateDestination(editingDestination.id, payload);
            } else {
                await createDestination(payload);
            }

            closeForm();
            await loadDestinations();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save destination."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(destination: Destination) {
        const confirmed = window.confirm(
            `Delete ${destination.name}? Its associated pages will also be deleted.`
        );

        if (!confirmed) return;

        setError("");

        try {
            await deleteDestination(destination.id);
            await loadDestinations();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete destination."
            );
        }
    }

    return (
        <main className="admin-dashboard">
            <header className="admin-header">
                <div>
                    <p className="admin-eyebrow">BALITE SPRINGS</p>
                    <h1>Content Management</h1>
                    <p>Manage your destinations and brochure content.</p>
                </div>

                <div className="admin-account">
                    <span>{user?.email}</span>
                    <button onClick={signOut}>Sign Out</button>
                </div>
            </header>

            <section className="destination-management">
                <div className="section-heading">
                    <div>
                        <h2>Destinations</h2>
                        <p>Manage the destinations featured in your brochure.</p>
                    </div>

                    <button onClick={openCreateForm}>
                        + Add Destination
                    </button>
                </div>

                {error && (
                    <p className="admin-error" role="alert">
                        {error}
                    </p>
                )}

                {loading ? (
                    <p>Loading destinations...</p>
                ) : destinations.length === 0 ? (
                    <div className="empty-state">
                        <h3>No destinations yet</h3>
                        <p>
                            Add your first destination to start building
                            your brochure content.
                        </p>
                        <button onClick={openCreateForm}>
                            Add Your First Destination
                        </button>
                    </div>
                ) : (
                    <div className="destination-list">
                        {destinations.map((destination) => (
                            <article
                                className="destination-card"
                                key={destination.id}
                            >
                                <div className="destination-card-info">
                                    <h3>{destination.name}</h3>
                                    <p>{destination.location || "No location provided"}</p>
                                    <span>/{destination.slug}</span>
                                </div>

                                <div className="destination-card-actions">
                                    <button
                                        onClick={() => openEditForm(destination)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="delete-button"
                                        onClick={() => handleDelete(destination)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {formOpen && (
                <div className="admin-modal-backdrop">
                    <section
                        className="admin-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="destination-form-title"
                    >
                        <h2 id="destination-form-title">
                            {editingDestination
                                ? "Edit Destination"
                                : "Add Destination"}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <label htmlFor="destination-name">Name</label>
                            <input
                                id="destination-name"
                                value={form.name}
                                onChange={(event) =>
                                    setForm({ ...form, name: event.target.value })
                                }
                                required
                            />

                            <label htmlFor="destination-slug">Slug</label>
                            <input
                                id="destination-slug"
                                value={form.slug}
                                onChange={(event) =>
                                    setForm({ ...form, slug: event.target.value })
                                }
                                placeholder="e.g. balite"
                                required
                            />

                            <label htmlFor="destination-location">Location</label>
                            <input
                                id="destination-location"
                                value={form.location ?? ""}
                                onChange={(event) =>
                                    setForm({ ...form, location: event.target.value })
                                }
                            />

                            <label htmlFor="destination-maps">Google Maps URL</label>
                            <input
                                id="destination-maps"
                                type="url"
                                value={form.maps_url ?? ""}
                                onChange={(event) =>
                                    setForm({ ...form, maps_url: event.target.value })
                                }
                            />

                            <label htmlFor="destination-image">Image URL</label>
                            <input
                                id="destination-image"
                                type="url"
                                value={form.image_url ?? ""}
                                onChange={(event) =>
                                    setForm({ ...form, image_url: event.target.value })
                                }
                            />

                            {error && (
                                <p className="admin-error" role="alert">
                                    {error}
                                </p>
                            )}

                            <div className="admin-form-actions">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button type="submit" disabled={saving}>
                                    {saving ? "Saving..." : "Save Destination"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </main>
    );
}
