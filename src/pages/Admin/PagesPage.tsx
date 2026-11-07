import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

import PageFormPanel from "../../components/Admin/Pages/PageForm";
import PageList from "../../components/Admin/Pages/PageList";

import { uploadMediaFile } from "../../lib/admin/media";


import type {
    Destination,
    Page,
    PageContent,
    PageForm,
} from "../../types/admin/pages";


import { supabase } from "../../lib/supabase";


interface PageDraft {
    form: PageForm;
    editingId: string | null;
    formOpen: boolean;
}

const PAGE_DRAFT_KEY = "balite-admin-page-draft";

const emptyForm: PageForm = {
    destination_id: "",
    page_type: "text",
    title: "",
    slug: "",
    description: "",
    image_url: "",
    alt: "",
    caption: "",
    video_url: "",
    is_published: false,
    overlay_enabled: false,
    overlay_url: "",
    overlay_opacity: 1,
    overlay_scale: 1,
    overlay_position_x: 50,
    overlay_position_y: 50,
    heading_font_family: "Georgia",
    heading_font_size: 30,

    body_font_family: "Georgia",
    body_font_size: 15,
    body_text_align: "justify",
    body_line_height: 1.7,
};

function getSavedDraft(): PageDraft | null {
    try {
        const saved = localStorage.getItem(PAGE_DRAFT_KEY);
        return saved ? JSON.parse(saved) as PageDraft : null;
    } catch {
        return null;
    }
}

function createSlug(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function getDescription(value: string): string[] {
    return value
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
}

function getPageContent(form: PageForm): PageContent {
    const typography = {
        heading_font_family: form.heading_font_family,
        heading_font_size: form.heading_font_size,

        body_font_family: form.body_font_family,
        body_font_size: form.body_font_size,
        body_text_align: form.body_text_align,
        body_line_height: form.body_line_height,
    };

    switch (form.page_type) {
        case "text":
            return {
                ...typography,
                description: getDescription(form.description),
            };

        case "image":
            return {
                ...typography,
                image_url: form.image_url.trim(),
                alt: form.alt.trim(),
                caption: form.caption.trim(),

                overlay_enabled: form.overlay_enabled,
                overlay_url: form.overlay_url.trim(),
                overlay_opacity: form.overlay_opacity,
                overlay_scale: form.overlay_scale,
                overlay_position_x: form.overlay_position_x,
                overlay_position_y: form.overlay_position_y,
            };

        case "video":
            return {
                ...typography,
                video_url: form.video_url.trim(),
                description: form.description.trim()
                    ? [form.description.trim()]
                    : [],
            };
    }
}

export default function PagesPage() {
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [pages, setPages] = useState<Page[]>([]);

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

    const [form, setForm] = useState<PageForm>({
        ...emptyForm,
        ...savedDraft?.form,
    });

    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [selectedOverlayFile, setSelectedOverlayFile] = useState<File | null>(null);


    async function loadData() {
        setLoading(true);
        setError("");

        const [destinationResult, pageResult] = await Promise.all([
            supabase
                .from("destinations")
                .select("id, name, slug")
                .order("name"),

            supabase
                .from("pages")
                .select("*")
                .order("display_order", { ascending: true }),
        ]);

        if (destinationResult.error) {
            setError(destinationResult.error.message);
        } else {
            setDestinations(destinationResult.data ?? []);
        }

        if (pageResult.error) {
            setError(pageResult.error.message);
        } else {
            setPages((pageResult.data ?? []) as Page[]);
        }

        setLoading(false);
    }

    useEffect(() => {
        loadData();
    }, []);

    // Preserve unfinished forms between admin sections.
    useEffect(() => {
        if (formOpen) {
            const draft: PageDraft = {
                form,
                editingId,
                formOpen,
            };

            localStorage.setItem(
                PAGE_DRAFT_KEY,
                JSON.stringify(draft)
            );
        } else {
            localStorage.removeItem(PAGE_DRAFT_KEY);
        }
    }, [form, editingId, formOpen]);



    function updateField(
        field: keyof PageForm,
        value: string | boolean | number
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
            ...(field === "title" && !editingId
                ? { slug: createSlug(String(value)) }
                : {}),
        }));
    }

    function openCreateForm(destinationId = "") {
        setEditingId(null);
        setSelectedImageFile(null);
        setSelectedOverlayFile(null);
        setForm({
            ...emptyForm,
            destination_id: destinationId,
        });
        setError("");
        setSuccess("");
        setFormOpen(true);
    }

    function openEditForm(page: Page) {
        const content = page.content ?? {};

        setEditingId(page.id);
        setSelectedOverlayFile(null);

        setForm({
            ...emptyForm,
            destination_id: page.destination_id ?? "",
            page_type: page.page_type,
            title: page.title,
            slug: page.slug,
            description: content.description?.join("\n\n") ?? "",
            image_url: content.image_url ?? "",
            alt: content.alt ?? "",
            caption: content.caption ?? "",
            video_url: content.video_url ?? "",
            is_published: page.is_published,
            overlay_enabled: page.content.overlay_enabled ?? false,
            overlay_url: page.content.overlay_url ?? "",
            overlay_opacity: page.content.overlay_opacity ?? 1,
            overlay_scale: page.content.overlay_scale ?? 1,
            overlay_position_x: page.content.overlay_position_x ?? 50,
            overlay_position_y: page.content.overlay_position_y ?? 50,
            
            heading_font_family: page.content.heading_font_family ?? "Georgia",
            heading_font_size: page.content.heading_font_size ?? 30,

            body_font_family: page.content.body_font_family ?? "Georgia",
            body_font_size: page.content.body_font_size ?? 15,
            body_text_align: page.content.body_text_align ?? "justify",
            body_line_height: page.content.body_line_height ?? 1.7,
        });

        setError("");
        setSuccess("");
        setFormOpen(true);
    }

    function closeForm() {
        setFormOpen(false);
        setEditingId(null);
        setForm(emptyForm);
        setSelectedImageFile(null);
        setSelectedOverlayFile(null);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setSaving(true);
        setError("");
        setSuccess("");

        let content = getPageContent(form);

        if (form.page_type === "image") {
            if (!selectedImageFile && !form.image_url.trim()) {
                setError("Please upload an image or provide an image URL.");
                setSaving(false);
                return;
            }

            if (selectedImageFile) {
                if (!selectedImageFile.type.startsWith("image/")) {
                    setError("Please select a valid image file.");
                    setSaving(false);
                    return;
                }

                if (selectedImageFile.size > 100 * 1024 * 1024) {
                    setError("Image size must not exceed 100 MB.");
                    setSaving(false);
                    return;
                }

                try {
                    const imageUrl = await uploadMediaFile(
                        selectedImageFile,
                        "images"
                    );

                    content = {
                        image_url: imageUrl,
                        alt: form.alt.trim(),
                        caption: form.caption.trim(),
                    };
                } catch (uploadError) {
                    setError(
                        uploadError instanceof Error
                            ? uploadError.message
                            : "Image upload failed."
                    );
                    setSaving(false);
                    return;
                }
            }
            if (selectedOverlayFile) {
                const overlayUrl = await uploadMediaFile(
                    selectedOverlayFile,
                    "overlays"
                );

                content = {
                    ...content,
                    overlay_url: overlayUrl,
                };
            }
        }

        if (form.page_type === "video" && !form.video_url.trim()) {
            setError("Please provide a video URL.");
            setSaving(false);
            return;
        }


        const payload = {
            destination_id: form.destination_id || null,
            title: form.title.trim(),
            slug: form.slug.trim(),
            page_type: form.page_type,
            content,
            is_published: form.is_published,
        };

        if (editingId) {
            const { error } = await supabase
                .from("pages")
                .update(payload)
                .eq("id", editingId);

            if (error) {
                setError(error.message);
                setSaving(false);
                return;
            }

            setSuccess("Page updated successfully.");
        } else {
            // New pages are appended to the global book order.
            const { data: lastPage, error: orderError } = await supabase
                .from("pages")
                .select("display_order")
                .order("display_order", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (orderError) {
                setError(orderError.message);
                setSaving(false);
                return;
            }

            const nextOrder = lastPage
                ? lastPage.display_order + 1
                : 0;

            const { error } = await supabase
                .from("pages")
                .insert({
                    ...payload,
                    display_order: nextOrder,
                });

            if (error) {
                setError(error.message);
                setSaving(false);
                return;
            }

            setSuccess("Page created successfully.");
        }

        await loadData();
        setSaving(false);
        closeForm();
    }

    async function handleDelete(page: Page) {
        const confirmed = window.confirm(
            `Delete "${page.title}"? This cannot be undone.`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        const { error } = await supabase
            .from("pages")
            .delete()
            .eq("id", page.id);

        if (error) {
            setError(error.message);
            return;
        }

        setPages((current) =>
            current.filter((item) => item.id !== page.id)
        );

        setSuccess(`"${page.title}" was deleted.`);
    }


    async function handleReorder(orderedPages: Page[]) {
        setError("");
        setSuccess("");

        // Update the displayed order immediately.
        setPages(orderedPages);

        const { error } = await supabase.rpc("reorder_pages", {
            p_page_ids: orderedPages.map((page) => page.id),
        });

        if (error) {
            await loadData();
            setError(`Failed to save page order: ${error.message}`);
            return;
        }

        setSuccess("Page order updated successfully.");
    }


    async function togglePublished(page: Page) {
        setError("");
        setSuccess("");

        const { error } = await supabase
            .from("pages")
            .update({ is_published: !page.is_published })
            .eq("id", page.id);

        if (error) {
            setError(error.message);
            return;
        }

        setPages((current) =>
            current.map((item) =>
                item.id === page.id
                    ? { ...item, is_published: !page.is_published }
                    : item
            )
        );

        setSuccess(
            page.is_published
                ? "Page unpublished."
                : "Page published."
        );
    }


    return (
        <div className="admin-content">
            <header className="admin-page-header admin-header-row">
                <div>
                    <p className="admin-eyebrow">CONTENT MANAGEMENT</p>
                    <h1>Pages</h1>
                    <p>Create and organize the pages inside your digital book.</p>
                </div>

                <button
                    className="admin-primary-button"
                    onClick={() => openCreateForm()}
                >
                    <Plus size={18} />
                    Add page
                </button>
            </header>

            {error && <div className="admin-alert error">{error}</div>}
            {success && <div className="admin-alert success">{success}</div>}

            {formOpen && (
                <PageFormPanel
                    form={form}
                    editingId={editingId}
                    saving={saving}
                    destinations={destinations}
                    selectedImageFile={selectedImageFile}
                    selectedOverlayFile={selectedOverlayFile}
                    onOverlayFileChange={setSelectedOverlayFile}
                    onFieldChange={updateField}
                    onImageFileChange={setSelectedImageFile}
                    onSubmit={handleSubmit}
                    onClose={closeForm}
                />
            )}

            <PageList
                pages={pages}
                destinations={destinations}
                loading={loading}
                onEdit={openEditForm}
                onDelete={handleDelete}
                onTogglePublished={togglePublished}
                onReorder={handleReorder}
            />
        </div>
    );
}