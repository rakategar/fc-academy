"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Clock, MapPin, UserRound } from "lucide-react";
import { checkIn } from "@/app/pemain/actions";

type Phase = "idle" | "kick" | "goal";

const CONFETTI = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2;
  const r = 70 + (i % 3) * 22;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.7, c: ["#e0a526", "#1e6bff", "#ffffff", "#1f9d55"][i % 4], rot: i * 37 };
});

/** Lapangan, gawang, kiper, dan bola. Bola ditendang ke pojok atas gawang saat `phase` berubah ke "kick". */
function GoalScene({ phase, reduce }: { phase: Phase; reduce: boolean }) {
  const kicked = phase !== "idle";
  const t = (d: number) => (reduce ? { duration: 0 } : { duration: d, ease: [0.2, 0.7, 0.3, 1] as const });
  return (
    <svg viewBox="0 0 360 260" className="h-auto w-full" role="img" aria-label={kicked ? "Bola masuk ke gawang" : "Bola siap ditendang ke gawang"}>
      <defs>
        <pattern id="net" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0 V10 M0 0 H10" stroke="rgba(255,255,255,.35)" strokeWidth="1" />
        </pattern>
        <linearGradient id="pitch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f7a45" />
          <stop offset="1" stopColor="#14562f" />
        </linearGradient>
      </defs>

      {/* lapangan */}
      <path d="M0 120 H360 V260 H0 Z" fill="url(#pitch)" />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M0 ${140 + i * 32} H360 V${156 + i * 32} H0 Z`} fill="rgba(255,255,255,.04)" />)}
      <path d="M40 130 H320 L350 250 H10 Z" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2" />
      <path d="M110 130 H250 L262 172 H98 Z" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2" />
      <circle cx="180" cy="222" r="3" fill="rgba(255,255,255,.7)" />

      {/* gawang */}
      <motion.g
        style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
        animate={phase === "goal" && !reduce ? { scaleY: [1, 1.07, 0.98, 1.02, 1], scaleX: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.6 }}
      >
        <path d="M82 44 L96 30 H264 L278 44 V130 H82 Z" fill="url(#net)" />
        <path d="M82 130 V44 H278 V130" fill="none" stroke="#fff" strokeWidth="5" strokeLinejoin="round" />
        <path d="M82 44 L96 30 H264 L278 44" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2" />
      </motion.g>

      {/* kiper: melompat ke arah yang salah */}
      <motion.g
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
        initial={false}
        animate={kicked ? { x: -52, y: 6, rotate: -70 } : { x: [0, -8, 8, 0], rotate: 0, y: 0 }}
        transition={kicked ? t(0.45) : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="171" y="96" width="18" height="30" rx="6" fill="#e0a526" />
        <circle cx="180" cy="88" r="7.5" fill="#f2c9a0" />
        <path d="M171 102 L158 92 M189 102 L202 92" stroke="#e0a526" strokeWidth="5" strokeLinecap="round" />
        <circle cx="157" cy="91" r="3.5" fill="#fff" />
        <circle cx="203" cy="91" r="3.5" fill="#fff" />
        <path d="M175 126 V132 M185 126 V132" stroke="#0a1b47" strokeWidth="5" strokeLinecap="round" />
      </motion.g>

      {/* lintasan bidikan */}
      {!kicked && (
        <motion.path
          d="M180 214 Q 222 150 236 78"
          fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2" strokeDasharray="4 6"
          animate={reduce ? {} : { strokeDashoffset: [0, -20] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* bola */}
      <motion.g
        initial={false}
        animate={kicked ? { x: [0, 34, 56], y: [0, -92, -144], scale: [1, 0.72, 0.5], rotate: 540 } : { x: 0, y: [0, -7, 0], scale: 1, rotate: 0 }}
        transition={kicked ? t(0.55) : { duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      >
        <ellipse cx="180" cy="236" rx="13" ry="3.5" fill="rgba(0,0,0,.25)" />
        <circle cx="180" cy="220" r="15" fill="#fff" stroke="#0a1b47" strokeWidth="1.5" />
        <path d="M180 213 L186.7 217.9 L184.1 225.7 H175.9 L173.3 217.9 Z" fill="#0a1b47" />
        <path d="M180 205.5 V213 M186.7 217.9 L194 215 M184.1 225.7 L189 232 M175.9 225.7 L171 232 M173.3 217.9 L166 215" stroke="#0a1b47" strokeWidth="1.5" />
      </motion.g>

      {/* GOL! */}
      <AnimatePresence>
        {phase === "goal" && (
          <motion.g key="goal" initial={reduce ? false : { opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 14 }} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            {CONFETTI.map((p, i) => (
              <motion.rect key={i} x="177" y="80" width="6" height="10" rx="1.5" fill={p.c}
                initial={reduce ? false : { x: 0, y: 0, rotate: 0, opacity: 1 }}
                animate={{ x: p.x, y: p.y + 30, rotate: p.rot, opacity: reduce ? 1 : [1, 1, 0] }}
                transition={{ duration: 1.2, ease: "easeOut" }} />
            ))}
            <text x="180" y="186" textAnchor="middle" fontSize="54" fontWeight="800" fill="#e0a526" stroke="#0a1b47" strokeWidth="3" paintOrder="stroke" style={{ letterSpacing: "2px" }}>GOL!</text>
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}

/** Layar penuh yang menutupi dashboard pemain selama jam latihan sampai pemain absen. */
export function CheckInGate(props: { sessionId: string; firstName: string; kind: string; time: string; location: string; coach: string | null; isKeeper: boolean; more: number }) {
  const reduce = !!useReducedMotion();
  const router = useRouter();
  const { signOut } = useClerk();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [doneAt, setDoneAt] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (closed) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [closed]);

  const onAbsen = () => {
    setError(null);
    setPhase("kick");
    start(async () => {
      const [res] = await Promise.all([checkIn(props.sessionId), new Promise((r) => setTimeout(r, reduce ? 0 : 560))]);
      if (res.error) { setPhase("idle"); setError(res.error); return; }
      setDoneAt(res.time ?? null);
      setPhase("goal");
    });
  };

  const finish = () => { setClosed(true); router.refresh(); };

  useEffect(() => {
    if (phase !== "goal") return;
    const id = setTimeout(finish, 3200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <AnimatePresence>
      {!closed && (
        <motion.div
          key="gate"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkin-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-nav/95 p-4 backdrop-blur-md"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <motion.div
            initial={reduce ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="w-full max-w-[420px] text-center text-white"
          >
            <p className="text-sm font-medium tracking-wide text-gold uppercase">{phase === "goal" ? "Absen tercatat" : "Waktunya latihan"}</p>
            <h2 id="checkin-title" className="mt-1 text-[26px] leading-tight font-bold">
              {phase === "goal" ? `Mantap, ${props.firstName}!` : `Ayo absen, ${props.firstName}!`}
            </h2>

            <div className="mx-auto mt-4 overflow-hidden rounded-[16px] bg-[#0f2a66] shadow-2xl ring-1 ring-white/10">
              <GoalScene phase={phase} reduce={reduce} />
            </div>

            <div className="mt-4 rounded-[12px] bg-white/8 px-4 py-3 text-left text-sm ring-1 ring-white/10">
              <p className="font-semibold">{props.kind}{props.isKeeper ? " · kiper" : ""}</p>
              <p className="mt-1 flex items-center gap-1.5 text-nav-ink"><Clock size={14} /><span className="num">{props.time}</span> WIB</p>
              <p className="flex items-center gap-1.5 text-nav-ink"><MapPin size={14} />{props.location}</p>
              {props.coach && <p className="flex items-center gap-1.5 text-nav-ink"><UserRound size={14} />{props.coach}</p>}
              {props.more > 0 && <p className="mt-1.5 text-xs text-gold">+{props.more} sesi lain di jam yang sama ikut tercatat sekaligus</p>}
            </div>

            {phase === "goal" ? (
              <>
                <p className="mt-4 text-sm text-nav-ink">Kamu tercatat <b className="text-white">hadir</b>{doneAt ? <> pukul <b className="num text-white">{doneAt}</b> WIB</> : null}. Selamat berlatih!</p>
                <button type="button" onClick={finish} className="mt-4 h-12 w-full rounded-[10px] bg-white text-[15px] font-semibold text-nav">Lanjut ke beranda</button>
              </>
            ) : (
              <>
                {error && <p role="alert" className="mt-4 rounded-[8px] bg-alpa/20 px-3 py-2 text-sm text-white">⚠ {error}</p>}
                <motion.button
                  type="button"
                  onClick={onAbsen}
                  disabled={pending || phase === "kick"}
                  whileTap={reduce ? undefined : { scale: 0.97 }}
                  animate={reduce || phase !== "idle" ? {} : { boxShadow: ["0 0 0 0 rgba(224,165,38,.6)", "0 0 0 14px rgba(224,165,38,0)"] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="mt-4 h-14 w-full rounded-[12px] bg-gold text-[17px] font-bold text-nav disabled:opacity-80"
                >
                  {phase === "kick" ? "Menendang…" : "⚽  Absen sekarang"}
                </motion.button>
                <p className="mt-3 text-xs leading-relaxed text-nav-ink">
                  Berhalangan hadir? Kabari coach-mu. Coach yang mencatat izin atau sakit.{" "}
                  <button type="button" onClick={() => signOut({ redirectUrl: "/" })} className="underline underline-offset-2">Keluar</button>
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
