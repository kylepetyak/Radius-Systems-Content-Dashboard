import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Public routes that don't require auth
    const publicRoutes = ["/login", "/api/auth/callback"];
    const isPublicRoute = publicRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // Not logged in and trying to access protected route → go to login
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Logged in user on /login → try to redirect to dashboard
    // But ONLY if we can confirm they have a valid profile
    if (user && pathname === "/login") {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // If profile query fails (table missing, no row), stay on login
      if (error || !profile) {
        return supabaseResponse;
      }

      const url = request.nextUrl.clone();
      url.pathname = profile.role === "admin" ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(url);
    }

    // Protect admin routes — only redirect if we can confirm non-admin
    if (user && pathname.startsWith("/admin")) {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!error && profile && profile.role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
      // If profile query fails, let request through (page will handle it)
    }

    // Redirect root to appropriate dashboard
    if (user && pathname === "/") {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!error && profile) {
        const url = request.nextUrl.clone();
        url.pathname = profile.role === "admin" ? "/admin/dashboard" : "/dashboard";
        return NextResponse.redirect(url);
      }
      // If no profile, let them through to the page (which redirects to /dashboard)
    }

    return supabaseResponse;
  } catch (error) {
    console.error("Middleware error:", error);
    return supabaseResponse;
  }
}
