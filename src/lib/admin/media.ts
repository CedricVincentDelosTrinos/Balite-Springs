import { supabase } from "../supabase";

export async function uploadMediaFile(
    file: File,
    folder: string
): Promise<string> {
    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safeExtension = extension.replace(/[^a-z0-9]/g, "");
    const filePath = `${folder}/${crypto.randomUUID()}.${safeExtension}`;

    const { data, error } = await supabase.storage
        .from("media")
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
        });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
        .from("media")
        .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
}