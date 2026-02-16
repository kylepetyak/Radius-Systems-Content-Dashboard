import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ClientDetailClient } from "./client-detail-client";
import type { ContentPiece } from "@/lib/types/database";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!client) notFound();

  const { data: plans } = await supabase
    .from("content_plans")
    .select("*")
    .eq("client_id", params.id)
    .order("created_at", { ascending: false });

  // Get all pieces for these plans
  const allPlans = plans || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const planIds = allPlans.map((p: any) => p.id);
  let pieces: ContentPiece[] = [];

  if (planIds.length > 0) {
    const { data } = await supabase
      .from("content_pieces")
      .select("*")
      .in("plan_id", planIds)
      .order("sort_order", { ascending: true });
    pieces = (data || []) as ContentPiece[];
  }

  return (
    <ClientDetailClient
      client={client}
      plans={allPlans}
      pieces={pieces}
    />
  );
}
