import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientsPageClient } from "./clients-page-client";

export default async function ClientsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: clients } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  return <ClientsPageClient clients={clients || []} />;
}
