import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "./admin-dashboard-client";

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get all clients
  const { data: clients } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  // Get all content plans with piece counts
  const { data: plans } = await supabase
    .from("content_plans")
    .select("*")
    .order("created_at", { ascending: false });

  // Get all content pieces for status overview
  const { data: pieces } = await supabase
    .from("content_pieces")
    .select("*");

  return (
    <AdminDashboardClient
      clients={clients || []}
      plans={plans || []}
      pieces={pieces || []}
    />
  );
}
