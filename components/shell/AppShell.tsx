"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity, BarChart3, CalendarDays, ClipboardCheck, FileText, History, Home, LayoutDashboard, LogOut,
  Menu, Settings, Trophy, User, Users, X, type LucideIcon,
} from "lucide-react";

type Role = "coach" | "pemain";
interface NavItem { href: string; label: string; icon: LucideIcon; badge?: number }
interface NavGroup { title?: string; items: NavItem[] }

function coachNav(pending: number): NavGroup[] {
  return [
    { title: "Utama", items: [{ href: "/coach", label: "Dashboard", icon: LayoutDashboard }] },
    {
      title: "Aksi lapangan",
      items: [
        { href: "/coach/absensi", label: "Absensi Latihan", icon: ClipboardCheck },
        { href: "/coach/performa", label: "Input Performa", icon: Activity },
        { href: "/coach/jadwal", label: "Jadwal Latihan", icon: CalendarDays },
      ],
    },
    {
      title: "Data & analisis",
      items: [
        { href: "/coach/pemain", label: "Data Pemain", icon: Users, badge: pending },
        { href: "/coach/rekap", label: "Rekap & Monitoring", icon: BarChart3 },
        { href: "/coach/seleksi", label: "Seleksi Pemain", icon: Trophy },
        { href: "/coach/laporan", label: "Laporan", icon: FileText },
      ],
    },
    {
      title: "Sistem",
      items: [
        { href: "/coach/jejak", label: "Jejak Perubahan", icon: History },
        { href: "/coach/pengaturan", label: "Pengaturan", icon: Settings },
      ],
    },
  ];
}
const COACH_TABS = ["/coach", "/coach/absensi", "/coach/pemain", "/coach/performa"];

const PLAYER_NAV: NavGroup[] = [
  {
    items: [
      { href: "/pemain", label: "Beranda", icon: Home },
      { href: "/pemain/riwayat", label: "Riwayat Absensi", icon: ClipboardCheck },
      { href: "/pemain/performa", label: "Performa Saya", icon: Activity },
      { href: "/pemain/profil", label: "Profil", icon: User },
    ],
  },
];

function isActive(path: string, href: string) {
  if (href === "/coach" || href === "/pemain") return path === href;
  return path === href || path.startsWith(href + "/");
}

const TAB_LABEL: Record<string, string> = {
  "/coach": "Dashboard",
  "/coach/absensi": "Absensi",
  "/coach/pemain": "Pemain",
  "/coach/performa": "Performa",
  "/pemain": "Beranda",
  "/pemain/riwayat": "Riwayat",
  "/pemain/performa": "Performa",
  "/pemain/profil": "Profil",
};

export function AppShell({
  role,
  user,
  pending = 0,
  logoutAction,
  children,
}: {
  role: Role;
  user: { name: string; subtitle: string };
  pending?: number;
  logoutAction?: () => Promise<void>;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const clerk = useClerk();
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [path]);

  const groups = role === "coach" ? coachNav(pending) : PLAYER_NAV;
  const all = groups.flatMap((g) => g.items);
  const tabs = role === "coach" ? all.filter((i) => COACH_TABS.includes(i.href)) : all;
  const rail = role === "coach" ? "bg-gold" : "bg-accent";

  const logout = async () => {
    if (role === "coach" && logoutAction) await logoutAction();
    else await clerk.signOut({ redirectUrl: "/" });
  };

  const UserBlock = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex items-center gap-3 border-t border-white/10 ${compact ? "justify-center p-3" : "p-4"}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-nav">
        {user.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
      </span>
      {!compact && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-nav-ink">{user.subtitle}</p>
        </div>
      )}
      {!compact && (
        <button onClick={logout} aria-label="Keluar" title="Keluar" className="grid h-10 w-10 place-items-center rounded-[6px] text-nav-ink hover:bg-white/10 hover:text-white">
          <LogOut size={20} />
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar: ikon di md, penuh di lg */}
      <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col bg-nav md:flex md:w-[76px] lg:w-[248px]">
        <span className={`absolute inset-y-0 left-0 w-[3px] ${rail}`} aria-hidden />
        <Link href={role === "coach" ? "/coach" : "/pemain"} className="flex items-center gap-3 px-4 pt-5 pb-6 lg:px-5">
          <img src="/brand/logo-96.png" alt="" className="h-11 w-11 shrink-0 object-contain" />
          <span className="hidden text-[19px] leading-[22px] font-extrabold tracking-tight text-white lg:block">
            UNESA FC<br />ACADEMY
          </span>
        </Link>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
          {groups.map((g, gi) => (
            <div key={gi}>
              {g.title && <p className="mb-1.5 hidden px-3 text-[11px] font-semibold tracking-wider text-nav-ink/60 uppercase lg:block">{g.title}</p>}
              <ul className="space-y-1">
                {g.items.map((item) => {
                  const active = isActive(path, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={item.label}
                        className={`relative flex h-11 items-center gap-3 rounded-[8px] px-3 text-[15px] transition-colors md:justify-center lg:justify-start ${
                          active ? "bg-accent font-semibold text-white" : "text-nav-ink hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        <Icon size={20} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
                        <span className="hidden lg:inline">{item.label}</span>
                        {!!item.badge && (
                          <span className="num absolute top-1.5 right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-nav lg:static lg:ml-auto">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="hidden lg:block"><UserBlock /></div>
        <div className="lg:hidden">
          <button onClick={logout} aria-label="Keluar" className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-[8px] text-nav-ink hover:bg-white/10">
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Bilah atas mobile */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-nav px-4 md:hidden">
          <span className={`absolute inset-x-0 bottom-0 h-[2px] ${rail}`} aria-hidden />
          <img src="/brand/logo-96.png" alt="" className="h-9 w-9 object-contain" />
          <p className="text-[15px] leading-4 font-extrabold text-white">UNESA FC<br /><span className="text-[11px] font-semibold tracking-wider text-gold">ACADEMY</span></p>
          <div className="ml-auto flex items-center gap-2 text-right">
            <div className="leading-tight">
              <p className="max-w-[140px] truncate text-[13px] font-semibold text-white">{user.name}</p>
              <p className="text-[11px] text-nav-ink">{user.subtitle}</p>
            </div>
            <button onClick={logout} aria-label="Keluar" className="grid h-10 w-10 place-items-center rounded-[6px] text-nav-ink">
              <LogOut size={19} />
            </button>
          </div>
        </header>

        <main className="pb-safe mx-auto w-full max-w-[1440px] px-4 pt-5 md:px-6 md:pt-7 lg:px-8">{children}</main>
      </div>

      {/* Bilah tab bawah (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length + (role === "coach" ? 1 : 0)}, minmax(0, 1fr))` }}>
          {tabs.map((t) => {
            const active = isActive(path, t.href);
            const Icon = t.icon;
            return (
              <li key={t.href}>
                <Link href={t.href} className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${active ? "text-accent" : "text-ink-muted"}`}>
                  {active && <motion.span layoutId="tab-dot" className="absolute top-0 h-[3px] w-10 rounded-b-full bg-accent" />}
                  <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                  {TAB_LABEL[t.href] ?? t.label}
                  {!!t.badge && <span className="num absolute top-2 right-[22%] grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-nav">{t.badge}</span>}
                </Link>
              </li>
            );
          })}
          {role === "coach" && (
            <li>
              <button onClick={() => setMore(true)} className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-ink-muted">
                <Menu size={22} strokeWidth={1.8} />
                Lainnya
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Lembar "Lainnya" */}
      <AnimatePresence>
        {more && (
          <motion.div className="fixed inset-0 z-50 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-ink/40" aria-label="Tutup menu" onClick={() => setMore(false)} />
            <motion.div
              className="absolute inset-x-0 bottom-0 rounded-t-[14px] bg-panel p-4"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="h2">Menu lainnya</p>
                <button onClick={() => setMore(false)} className="grid h-10 w-10 place-items-center rounded-[6px] hover:bg-sunken" aria-label="Tutup"><X size={20} /></button>
              </div>
              <ul className="grid grid-cols-3 gap-2">
                {all.filter((i) => !COACH_TABS.includes(i.href)).map((i) => {
                  const Icon = i.icon;
                  return (
                    <li key={i.href}>
                      <Link href={i.href} className={`flex h-20 flex-col items-center justify-center gap-1.5 rounded-[10px] border text-center text-xs font-medium ${isActive(path, i.href) ? "border-accent bg-accent-soft text-accent" : "border-line"}`}>
                        <Icon size={22} />
                        {i.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
