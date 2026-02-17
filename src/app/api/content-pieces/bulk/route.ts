import { createClient } from "@/lib/supabase/server";
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

  return NextResponse.json({ success: true, count: data.length, pieces: data });
}
