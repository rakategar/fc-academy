import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth/admin-token";

// Halaman login masing-masing peran: /admin, /coach, / (pemain)
const isAdminArea = createRouteMatcher(["/admin/(.*)"]);
const isCoachArea = createRouteMatcher(["/coach/(.*)"]);
const isPlayerArea = createRouteMatcher(["/pemain(.*)", "/daftar", "/menunggu"]);

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;
  // Rute lama
  if (path === "/login" || path.startsWith("/login/")) return NextResponse.redirect(new URL("/", req.url));
  if (path === "/coach/login") return NextResponse.redirect(new URL("/coach", req.url));
  if (path === "/lengkapi-data") return NextResponse.redirect(new URL("/daftar", req.url));

  if (isAdminArea(req)) {
    const session = await verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
    if (!session) return NextResponse.redirect(new URL("/admin", req.url));
  }
  if (isCoachArea(req)) {
    const { userId } = await auth();
    if (!userId) return NextResponse.redirect(new URL("/coach", req.url));
  }
  if (isPlayerArea(req)) {
    const { userId } = await auth();
    if (!userId) return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|sw\\.js|manifest\\.webmanifest|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
