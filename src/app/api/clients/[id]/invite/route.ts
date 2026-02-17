import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
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

  const adminClient = createAdminClient();

  // Get the client's email from their profile
  const { data: clientProfile, error: profileError } = await adminClient
    .from("profiles")
    .select("email")
    .eq("id", params.id)
    .single();

  if (profileError || !clientProfile) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Send invite email via Supabase (generates a magic link email)
  const { error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(clientProfile.email);

  if (inviteError) {
    // If user already confirmed, send a magic link instead
    if (inviteError.message.includes("already been registered")) {
      const { error: linkError } =
        await adminClient.auth.admin.generateLink({
          type: "magiclink",
          email: clientProfile.email,
        });

      if (linkError) {
        return NextResponse.json({ error: linkError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, method: "magiclink" });
    }

    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, method: "invite" });
}
