"use client";
import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/** Angka bergulir dari 0 saat pertama terlihat. */
export function CountUp({ value, decimals = 0, duration = 0.9 }: { value: number; decimals?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const reduce = useReducedMotion();
  const fmt = (n: number) => n.toLocaleString("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) { el.textContent = fmt(value); return; }
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.2, 0, 0, 1],
      onUpdate: (v) => { el.textContent = fmt(v); },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduce]);

  return <span ref={ref}>{fmt(reduce ? value : 0)}</span>;
}
