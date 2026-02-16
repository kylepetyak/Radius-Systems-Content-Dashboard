import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PieceEditorClient } from "./piece-editor-client";

export default async function PieceEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: piece } = await supabase
    .from("content_pieces")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!piece) notFound();

  const { data: plan } = await supabase
    .from("content_plans")
    .select("*")
    .eq("id", piece.plan_id)
    .single();

  const { data: shotItems } = await supabase
    .from("shot_list_items")
    .select("*")
    .eq("piece_id", piece.id)
    .order("sort_order", { ascending: true });

  const { data: proTips } = await supabase
    .from("pro_tips")
    .select("*")
    .eq("piece_id", piece.id)
    .order("sort_order", { ascending: true });

  return (
    <PieceEditorClient
      piece={piece}
      plan={plan!}
      shotItems={shotItems || []}
      proTips={proTips || []}
    />
  );
}
