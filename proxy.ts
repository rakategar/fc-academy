import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { COACH_COOKIE, verifyCoachToken } from "@/lib/auth/coach-token";

const isCoachArea = createRouteMatcher(["/coach(.*)"]);
const isCoachLogin = createRouteMatcher(["/coach/login"]);
const isPlayerArea = createRouteMatcher(["/pemain(.*)", "/lengkapi-data", "/menunggu"]);

export default clerkMiddleware(async (auth, req) => {
  if (isCoachArea(req) && !isCoachLogin(req)) {
    const session = await verifyCoachToken(req.cookies.get(COACH_COOKIE)?.value);
    if (!session) return NextResponse.redirect(new URL("/coach/login", req.url));
  }
  if (isPlayerArea(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|sw\\.js|manifest\\.webmanifest|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
