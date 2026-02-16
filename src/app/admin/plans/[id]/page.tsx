import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PlanEditorClient } from "./plan-editor-client";

export default async function PlanEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: plan } = await supabase
    .from("content_plans")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!plan) notFound();

  const { data: client } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", plan.client_id)
    .single();

  const { data: pieces } = await supabase
    .from("content_pieces")
    .select("*")
    .eq("plan_id", plan.id)
    .order("sort_order", { ascending: true });

  return (
    <PlanEditorClient
      plan={plan}
      client={client!}
      pieces={pieces || []}
    />
  );
}
