"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "cover" | "reveal">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPath = useRef(pathname);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (anchor.target && anchor.target !== "_self") return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname && url.hash) return;
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      event.preventDefault();
      if (timer.current) clearTimeout(timer.current);
      if (reduced) { router.push(url.pathname + url.search + url.hash); return; }
      setPhase("cover");
      timer.current = setTimeout(() => router.push(url.pathname + url.search + url.hash), 700);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router, reduced]);

  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      if (reduced) return;
      setPhase("reveal");
      timer.current = setTimeout(() => setPhase("idle"), 760);
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [pathname, reduced]);

  return <>
    {children}
    {!reduced && <AnimatePresence>
      {phase !== "idle" && <motion.div
        key="mf-curtain"
        className="page-curtain"
        initial={{ clipPath: phase === "cover" ? "inset(100% 0 0 0)" : "inset(0 0 0 0)" }}
        animate={{ clipPath: phase === "cover" ? "inset(0% 0 0 0)" : "inset(0 0 100% 0)" }}
        exit={{ clipPath: "inset(0 0 100% 0)" }}
        transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
      ><span className="curtain-mark">MR. <i>FICTION</i></span><span className="curtain-line" /></motion.div>}
    </AnimatePresence>}
  </>;
}
