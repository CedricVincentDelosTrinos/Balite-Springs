export type PageType = "text" | "image" | "video";
export interface Destination {
    id: string;
    name: string;
    slug: string;
}

export interface GalleryImage {
    url: string;
    alt: string;
    caption: string;
}

export interface PageContent {
    description?: string[];
    image_url?: string;
    alt?: string;
    caption?: string;

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

    video_url?: string;
    images?: GalleryImage[];
}

export interface Page {
    id: string;
    destination_id: string | null;
    title: string;
    slug: string;
    page_type: PageType;
    content: PageContent;
    display_order: number;
    is_published: boolean;
}

export interface PageForm {
    destination_id: string;
    page_type: PageType;
    title: string;
    slug: string;
    description: string;
    image_url: string;
    alt: string;
    caption: string;
    video_url: string;
    is_published: boolean;

    overlay_enabled: boolean;
    overlay_url: string;
    overlay_opacity: number;
    overlay_scale: number;
    overlay_position_x: number;
    overlay_position_y: number;

    heading_font_family: string;
    heading_font_size: number;

    body_font_family: string;
    body_font_size: number;
    body_text_align: "left" | "center" | "right" | "justify";
    body_line_height: number;
}