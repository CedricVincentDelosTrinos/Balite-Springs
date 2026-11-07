import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
    if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    const cronSecret = Deno.env.get("CRON_SECRET");

    if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
        return new Response("Unauthorized", { status: 401 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
        return new Response("Missing Supabase configuration", {
            status: 500,
        });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });

    const { data: candidates, error: candidateError } = await supabase
        .from("feedback")
        .select("id, status")
        .in("status", ["pending", "rejected", "deleting"])
        .lte("expires_at", new Date().toISOString());

    if (candidateError) {
        return Response.json(
            { error: "Could not retrieve expired feedback." },
            { status: 500 },
        );
    }

    let deleted = 0;
    let failed = 0;
    let skipped = 0;

    for (const candidate of candidates ?? []) {
        const originalStatus = candidate.status;
        let claimed = originalStatus === "deleting";

        // Atomically claim the submission before deleting its files.
        if (!claimed) {
            const { data: claim, error: claimError } = await supabase
                .from("feedback")
                .update({ status: "deleting" })
                .eq("id", candidate.id)
                .eq("status", originalStatus)
                .lte("expires_at", new Date().toISOString())
                .select("id")
                .maybeSingle();

            if (claimError) {
                failed++;
                continue;
            }

            if (!claim) {
                skipped++;
                continue;
            }

            claimed = true;
        }

        const { data: images, error: imageError } = await supabase
            .from("feedback_images")
            .select("storage_path, thumbnail_path")
            .eq("feedback_id", candidate.id);

        if (imageError) {
            if (originalStatus !== "deleting") {
                await supabase
                    .from("feedback")
                    .update({ status: originalStatus })
                    .eq("id", candidate.id)
                    .eq("status", "deleting");
            }

            failed++;
            continue;
        }

        const paths = [
            ...new Set(
                (images ?? []).flatMap((image) => [
                    image.storage_path,
                    image.thumbnail_path,
                ]),
            ),
        ];

        // Remove actual files from Supabase Storage first.
        if (paths.length > 0) {
            const { error: storageError } = await supabase.storage
                .from("feedback-images")
                .remove(paths);

            if (storageError) {
                if (originalStatus !== "deleting") {
                    await supabase
                        .from("feedback")
                        .update({ status: originalStatus })
                        .eq("id", candidate.id)
                        .eq("status", "deleting");
                }

                failed++;
                continue;
            }
        }

        // Database records are removed only after Storage succeeds.
        const { error: deleteError } = await supabase
            .from("feedback")
            .delete()
            .eq("id", candidate.id)
            .eq("status", "deleting")
            .lte("expires_at", new Date().toISOString());

        if (deleteError) {
            failed++;
            continue;
        }

        deleted++;
    }

    return Response.json({
        success: true,
        checked: candidates?.length ?? 0,
        deleted,
        failed,
        skipped,
    });
});
