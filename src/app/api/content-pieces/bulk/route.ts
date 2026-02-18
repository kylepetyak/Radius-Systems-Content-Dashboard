import { createClient } from "@/lib/supabase/server";
import { createProjectFolder, isDriveConfigured } from "@/lib/google-drive";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { plan_id, pieces } = body;

  if (!plan_id || !Array.isArray(pieces) || pieces.length === 0) {
    return NextResponse.json(
      { error: "plan_id and a non-empty pieces array are required" },
      { status: 400 }
    );
  }

  // Get current max sort_order for this plan
  const { data: existing } = await supabase
    .from("content_pieces")
    .select("sort_order")
    .eq("plan_id", plan_id)
    .order("sort_order", { ascending: false })
    .limit(1);

  let nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const rows = pieces.map((p: Record<string, string>) => ({
    plan_id,
    title: p.title || "Untitled",
    platform: p.platform || "Instagram Reels",
    content_type: p.content_type || null,
    due_date: p.due_date || null,
    duration: p.duration || null,
    hook: p.hook || p.title || "—",
    script: p.script || null,
    sort_order: nextOrder++,
  }));

  const { data, error } = await supabase
    .from("content_pieces")
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert shot_list_items and pro_tips for each piece
  const shotRows: { piece_id: string; shot_number: number; shot_desc: string; sort_order: number }[] = [];
  const tipRows: { piece_id: string; tip_text: string; sort_order: number }[] = [];

  data.forEach((createdPiece: { id: string }, index: number) => {
    const original = pieces[index];

    // Parse shot list — each line becomes a shot item
    if (original.shot_list) {
      const shots = original.shot_list
        .split(/\n|[;|]/)
        .map((s: string) => s.trim())
        .filter((s: string) => s);
      shots.forEach((desc: string, i: number) => {
        shotRows.push({
          piece_id: createdPiece.id,
          shot_number: i + 1,
          shot_desc: desc,
          sort_order: i,
        });
      });
    }

    // Parse pro tips — each line becomes a tip
    if (original.pro_tips) {
      const tips = original.pro_tips
        .split(/\n|[;|]/)
        .map((s: string) => s.trim())
        .filter((s: string) => s);
      tips.forEach((text: string, i: number) => {
        tipRows.push({
          piece_id: createdPiece.id,
          tip_text: text,
          sort_order: i,
        });
      });
    }
  });

  if (shotRows.length > 0) {
    await supabase.from("shot_list_items").insert(shotRows);
  }

  if (tipRows.length > 0) {
    await supabase.from("pro_tips").insert(tipRows);
  }

  // Auto-create Google Drive folders if configured
  if (isDriveConfigured()) {
    try {
      const { data: planData } = await supabase
        .from("content_plans")
        .select("client_id")
        .eq("id", plan_id)
        .single();

      if (planData) {
        const { data: client } = await supabase
          .from("profiles")
          .select("company_name, full_name, email")
          .eq("id", planData.client_id)
          .single();

        const clientName = client?.company_name || client?.full_name || "Client";

        await Promise.all(
          data.map(async (piece: { id: string; title: string; due_date?: string }) => {
            try {
              const folderDate = piece.due_date || new Date().toISOString().split("T")[0];
              const { folderUrl } = await createProjectFolder(
                clientName,
                piece.title,
                folderDate,
                client?.email
              );
              await supabase
                .from("content_pieces")
                .update({ drive_folder_url: folderUrl })
                .eq("id", piece.id);
            } catch {
              // Skip individual failures
            }
          })
        );
      }
    } catch {
      // Don't fail bulk import if Drive folder creation fails
    }
  }

  return NextResponse.json({ success: true, count: data.length, pieces: data });
}
