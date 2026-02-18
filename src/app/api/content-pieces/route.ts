import { createClient } from "@/lib/supabase/server";
import { createProjectFolder, isDriveConfigured } from "@/lib/google-drive";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const planId = searchParams.get("plan_id");

  let query = supabase
    .from("content_pieces")
    .select("*")
    .order("sort_order", { ascending: true });

  if (planId) {
    query = query.eq("plan_id", planId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

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

  const { data, error } = await supabase
    .from("content_pieces")
    .insert({
      plan_id: body.plan_id,
      title: body.title,
      platform: body.platform,
      content_type: body.content_type || null,
      due_date: body.due_date || null,
      duration: body.duration || null,
      hook: body.hook,
      script: body.script || null,
      sort_order: body.sort_order || 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-create Google Drive folder if configured
  if (isDriveConfigured()) {
    try {
      // Look up the client name from the plan
      const { data: plan } = await supabase
        .from("content_plans")
        .select("client_id")
        .eq("id", body.plan_id)
        .single();

      if (plan) {
        const { data: client } = await supabase
          .from("profiles")
          .select("company_name, full_name")
          .eq("id", plan.client_id)
          .single();

        const clientName = client?.company_name || client?.full_name || "Client";
        const folderDate = body.due_date || new Date().toISOString().split("T")[0];

        const { folderUrl } = await createProjectFolder(
          clientName,
          body.title,
          folderDate
        );

        // Save the folder URL to the piece
        await supabase
          .from("content_pieces")
          .update({ drive_folder_url: folderUrl })
          .eq("id", data.id);

        data.drive_folder_url = folderUrl;
      }
    } catch (driveErr) {
      // Don't fail the piece creation if Drive folder fails
      console.error("Google Drive folder creation failed:", driveErr);
    }
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing piece id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("content_pieces")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing piece id" }, { status: 400 });
  }

  const { error } = await supabase.from("content_pieces").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
