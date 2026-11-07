export type CMSPageType = "text" | "image" | "video" | "gallery";

export interface BookDestination {
    id: string;
    slug: string;
    name: string;
    location: string;
    mapsUrl: string;
    image: string | null;
    description: string[];
}

export interface CMSDestination {
    id: string;
    slug: string;
    name: string;
    location: string | null;
    maps_url: string | null;
    image_url: string | null;
}

export interface CMSGalleryImage {
    url: string;
    alt: string;
    caption: string;
}

export interface CMSPageContent {
    description?: string[];
    image_url?: string;
    alt?: string;
    caption?: string;
    video_url?: string;
    images?: CMSGalleryImage[];
    overlay_enabled?: boolean;
    overlay_url?: string;
    overlay_opacity?: number;
    overlay_scale?: number;
    overlay_position_x?: number;
    overlay_position_y?: number;
    heading_font_family?: string;
    heading_font_size?: number;

    body_font_family?: string;
    body_font_size?: number;
    body_text_align?: "left" | "center" | "right" | "justify";
    body_line_height?: number;
}

export interface CMSPage {
    id: string;
    destination_id: string | null;
    title: string;
    slug: string;
    page_type: CMSPageType;
    content: CMSPageContent;
    display_order: number;
    is_published: boolean;
}

export interface BookSettingsContent {
    title: string;
    description: string;
    button_label: string;
}

export interface CMSBookSettings {
    id: boolean;
    back_cover_content: BookSettingsContent;
}