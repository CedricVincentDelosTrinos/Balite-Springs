
export interface Destination {
    id: string;
    slug: string;
    name: string;
    location: string | null;
    maps_url: string | null;
    image_url: string | null;
    created_at: string;
    updated_at: string | null;
}

export interface DestinationInput {
    slug: string;
    name: string;
    location: string | null;
    maps_url: string | null;
    image_url: string | null;
}
