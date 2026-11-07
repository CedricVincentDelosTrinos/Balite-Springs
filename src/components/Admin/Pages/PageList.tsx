    import { useState } from "react";
    import {
        FileText,
        Pencil,
        Trash2,
        Eye,
        EyeOff,
        GripVertical,
    } from "lucide-react";

    import type {
        Page,
        Destination,
    } from "../../../types/admin/pages";

    interface PageListProps {
        pages: Page[];
        destinations: Destination[];
        loading: boolean;
        onEdit: (page: Page) => void;
        onDelete: (page: Page) => void;
        onTogglePublished: (page: Page) => void;
        onReorder: (pages: Page[]) => void;
    }

    export default function PageList({
        pages,
        destinations,
        loading,
        onEdit,
        onDelete,
        onTogglePublished,
        onReorder,
    }: PageListProps) {
        const [draggingId, setDraggingId] = useState<string | null>(null);
        const [dragOverId, setDragOverId] = useState<string | null>(null);

        function getDestinationName(destinationId: string | null) {
            if (!destinationId) return "General";

            return destinations.find(
                (destination) => destination.id === destinationId
            )?.name ?? "Unknown destination";
        }

        function handleDrop(targetId: string) {
            if (!draggingId || draggingId === targetId) {
                setDraggingId(null);
                setDragOverId(null);
                return;
            }

            const reorderedPages = [...pages];

            const sourceIndex = reorderedPages.findIndex(
                (page) => page.id === draggingId
            );

            const targetIndex = reorderedPages.findIndex(
                (page) => page.id === targetId
            );

            if (sourceIndex === -1 || targetIndex === -1) {
                setDraggingId(null);
                setDragOverId(null);
                return;
            }

            const [movedPage] = reorderedPages.splice(sourceIndex, 1);
            reorderedPages.splice(targetIndex, 0, movedPage);

            onReorder(reorderedPages);

            setDraggingId(null);
            setDragOverId(null);
        }

        if (loading) {
            return <p className="admin-empty-state">Loading pages...</p>;
        }

        if (pages.length === 0) {
            return (
                <div className="admin-empty-state">
                    <FileText size={32} />
                    <h3>No pages yet</h3>
                    <p>Create your first page to start building the book.</p>
                </div>
            );
        }

        return (
            <section className="admin-list-section">
                <div className="admin-list-heading">
                    <div>
                        <h2>Book pages</h2>
                        <span>{pages.length} pages · Global order</span>
                    </div>
                </div>

                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Page title</th>
                                <th>Type</th>
                                <th>Destination</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {pages.map((page, index) => (
                                <tr
                                    key={page.id}
                                    draggable
                                    className={[
                                        draggingId === page.id ? "dragging" : "",
                                        dragOverId === page.id ? "drag-over" : "",
                                    ].filter(Boolean).join(" ")}
                                    onDragStart={(event) => {
                                        setDraggingId(page.id);
                                        event.dataTransfer.effectAllowed = "move";
                                        event.dataTransfer.setData("text/plain", page.id);
                                    }}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                        event.dataTransfer.dropEffect = "move";
                                        setDragOverId(page.id);
                                    }}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        handleDrop(page.id);
                                    }}
                                    onDragEnd={() => {
                                        setDraggingId(null);
                                        setDragOverId(null);
                                    }}
                                >
                                    <td>
                                        <div className="admin-page-order">
                                            <GripVertical size={17} />
                                            {index + 1}
                                        </div>
                                    </td>

                                    <td>
                                        <strong>{page.title}</strong>
                                    </td>

                                    <td>
                                        {page.page_type.charAt(0).toUpperCase() +
                                            page.page_type.slice(1)}
                                    </td>

                                    <td>
                                        {getDestinationName(page.destination_id)}
                                    </td>

                                    <td>
                                        <span
                                            className={`admin-status ${
                                                page.is_published ? "published" : "draft"
                                            }`}
                                        >
                                            {page.is_published ? "Published" : "Draft"}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="admin-row-actions">
                                            <button
                                                className="admin-icon-button"
                                                onClick={() => onTogglePublished(page)}
                                                title={page.is_published ? "Unpublish" : "Publish"}
                                                aria-label={
                                                    page.is_published
                                                        ? "Unpublish page"
                                                        : "Publish page"
                                                }
                                            >
                                                {page.is_published
                                                    ? <EyeOff size={17} />
                                                    : <Eye size={17} />}
                                            </button>

                                            <button
                                                className="admin-icon-button"
                                                onClick={() => onEdit(page)}
                                                title="Edit"
                                                aria-label={`Edit ${page.title}`}
                                            >
                                                <Pencil size={17} />
                                            </button>

                                            <button
                                                className="admin-icon-button danger"
                                                onClick={() => onDelete(page)}
                                                title="Delete"
                                                aria-label={`Delete ${page.title}`}
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
            </section>
        );
    }