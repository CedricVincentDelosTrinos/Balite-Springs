import { supabase } from "../lib/supabase";
import type {
    Destination,
    DestinationInput,
} from "../types/destination";

export async function getDestinations(): Promise<Destination[]> {
    const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) throw error;

    return data as Destination[];
}

export async function createDestination(
    destination: DestinationInput
): Promise<Destination> {
    const { data, error } = await supabase
        .from("destinations")
        .insert(destination)
        .select()
        .single();

    if (error) throw error;

    return data as Destination;
}

export async function updateDestination(
    id: string,
    destination: DestinationInput
): Promise<Destination> {
    const { data, error } = await supabase
        .from("destinations")
        .update(destination)
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;

    return data as Destination;
}

export async function deleteDestination(id: string): Promise<void> {
    const { error } = await supabase
        .from("destinations")
        .delete()
        .eq("id", id);

    if (error) throw error;
}