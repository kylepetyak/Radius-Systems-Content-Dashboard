import { createClient } from "@/lib/supabase/server";
import { createProjectFolder, isDriveConfigured } from "@/lib/google-drive";
import { NextResponse } from "next/server";

/**
 * POST /api/google-drive
 * Creates a Google Drive folder for a content piece and saves the link.
 *
 * Body: { piece_id, client_name, content_title, date? }
 */
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

  if (!isDriveConfigured()) {
    return NextResponse.json(
      { error: "Google Drive integration not configured. Add service account credentials to your environment variables." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { piece_id, client_name, content_title, date } = body;

  if (!piece_id || !client_name || !content_title) {
    return NextResponse.json(
      { error: "piece_id, client_name, and content_title are required" },
      { status: 400 }
    );
  }

  const folderDate = date || new Date().toISOString().split("T")[0];

  try {
    const { folderUrl } = await createProjectFolder(
      client_name,
      content_title,
      folderDate
    );

    // Save the folder URL back to the content piece
    const { error: updateError } = await supabase
      .from("content_pieces")
      .update({ drive_folder_url: folderUrl })
      .eq("id", piece_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, drive_folder_url: folderUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create Drive folder";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/google-drive
 * Returns whether Google Drive integration is configured.
 */
export async function GET() {
  return NextResponse.json({ configured: isDriveConfigured() });
}
