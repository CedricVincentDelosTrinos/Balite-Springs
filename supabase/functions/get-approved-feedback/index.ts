
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: corsHeaders,
        });
    }

    if (req.method !== "GET") {
        return new Response("Method not allowed", {
            status: 405,
            headers: corsHeaders,
        });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
        return Response.json(
            { error: "Missing Supabase configuration." },
            {
                status: 500,
                headers: corsHeaders,
            }
        );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });

    try {
        const url = new URL(req.url);
        const page = Math.max(
            0,
            Number(url.searchParams.get("page") ?? 0) || 0
        );

        const pageSize = 10;
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data: feedback, error } = await supabase
            .from("feedback")
            .select("id, display_name, message, created_at")
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .range(from, to);

        if (error) throw error;

        if (!feedback || feedback.length === 0) {
            return Response.json(
                { feedback: [], page, hasMore: false },
                { headers: corsHeaders }
            );
        }

        const feedbackIds = feedback.map((item) => item.id);

        const { data: images, error: imageError } = await supabase
            .from("feedback_images")
            .select(
                "feedback_id, storage_path, thumbnail_path, alt_text, display_order"
            )
            .in("feedback_id", feedbackIds)
            .order("display_order", { ascending: true });

        if (imageError) throw imageError;

        const imageResults = await Promise.all(
            (images ?? []).map(async (image) => {
                const [mainResult, thumbnailResult] = await Promise.all([
                    supabase.storage
                        .from("feedback-images")
                        .createSignedUrl(image.storage_path, 3600),
                    supabase.storage
                        .from("feedback-images")
                        .createSignedUrl(image.thumbnail_path, 3600),
                ]);

                return {
                    feedback_id: image.feedback_id,
                    alt_text: image.alt_text,
                    display_order: image.display_order,
                    image_url: mainResult.data?.signedUrl ?? null,
                    thumbnail_url:
                        thumbnailResult.data?.signedUrl ?? null,
                };
            })
        );

        const results = feedback.map((item) => ({
            ...item,
            images: imageResults
                .filter((image) => image.feedback_id === item.id)
                .map(({ feedback_id, ...image }) => image),
        }));

        return Response.json(
            {
                feedback: results,
                page,
                hasMore: feedback.length === pageSize,
            },
            { headers: corsHeaders }
        );
    } catch (error) {
        console.error("Could not retrieve approved feedback:", error);

        return Response.json(
            { error: "Could not retrieve feedback." },
            {
                status: 500,
                headers: corsHeaders,
            }
        );
    }
});
