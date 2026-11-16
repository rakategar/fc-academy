import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

// Dipanggil Vercel Cron tiap hari agar project Supabase (free tier) tidak di-pause
// karena tidak aktif. Wajib query ke DB, bukan sekadar membuka halaman.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const { error } = await db().from("seasons").select("id").limit(1);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
