import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ContentDetailClient } from "./content-detail-client";

export default async function ContentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Get the content piece
  const { data: piece } = await supabase
    .from("content_pieces")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!piece) notFound();

  // Get shot list items
  const { data: shotItems } = await supabase
    .from("shot_list_items")
    .select("*")
    .eq("piece_id", piece.id)
    .order("sort_order", { ascending: true });

  // Get pro tips
  const { data: proTips } = await supabase
    .from("pro_tips")
    .select("*")
    .eq("piece_id", piece.id)
    .order("sort_order", { ascending: true });

  return (
    <ContentDetailClient
      piece={piece}
      shotItems={shotItems || []}
      proTips={proTips || []}
      isAdmin={profile.role === "admin"}
    />
  );
}
