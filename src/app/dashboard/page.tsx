import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";
import type { ContentPiece, ShotListItem, ProTip } from "@/lib/types/database";

export default async function DashboardPage() {
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

  if (!profile) {
    // Profile not found — DB may not be set up yet or trigger didn't fire
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#020617" }}>
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}
          >
            <span className="text-white text-xl font-black">R</span>
          </div>
          <h1 className="text-white text-xl font-bold mb-2">Setting up your account...</h1>
          <p className="text-slate-400 text-sm mb-6">
            Your profile is being created. Please refresh in a moment.
          </p>
          <a
            href="/login"
            className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
          >
            Back to login
          </a>
        </div>
      </div>
    );
  }
  if (profile.role === "admin") redirect("/admin/dashboard");

  // Get client's content plans
  const { data: plans } = await supabase
    .from("content_plans")
    .select("*")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  const currentPlan = plans?.[0];

  // Get content pieces for the current plan
  let pieces: ContentPiece[] = [];
  let shotItems: ShotListItem[] = [];
  let proTips: ProTip[] = [];

  if (currentPlan) {
    const { data: piecesData } = await supabase
      .from("content_pieces")
      .select("*")
      .eq("plan_id", currentPlan.id)
      .order("sort_order", { ascending: true });

    pieces = (piecesData || []) as ContentPiece[];

    if (pieces.length > 0) {
      const pieceIds = pieces.map((p) => p.id);

      const [shotsResult, tipsResult] = await Promise.all([
        supabase
          .from("shot_list_items")
          .select("*")
          .in("piece_id", pieceIds)
          .order("sort_order", { ascending: true }),
        supabase
          .from("pro_tips")
          .select("*")
          .in("piece_id", pieceIds)
          .order("sort_order", { ascending: true }),
      ]);

      shotItems = (shotsResult.data || []) as ShotListItem[];
      proTips = (tipsResult.data || []) as ProTip[];
    }
  }

  return (
    <DashboardClient
      profile={profile}
      plan={currentPlan || null}
      pieces={pieces}
      shotItems={shotItems}
      proTips={proTips}
    />
  );
}
