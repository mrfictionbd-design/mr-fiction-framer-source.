"use client";
import { motion, useReducedMotion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;
export function Reveal({ children, className = "", delay = 0, image = false }: {
  children: React.ReactNode; className?: string; delay?: number; image?: boolean;
}) {
  const reduced = useReducedMotion();
  return <motion.div
    className={className}
    initial={reduced ? { opacity: 0 } : image ? { opacity: 0, scale: 1.03, filter: "blur(14px)" } : { opacity: 0, y: 20, filter: "blur(8px)" }}
    whileInView={image || !reduced ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" } : { opacity: 1 }}
    viewport={{ once: true, amount: 0.12 }}
    transition={{ duration: reduced ? 0.4 : image ? 1.1 : 0.9, ease, delay: reduced ? 0 : delay }}
  >{children}</motion.div>;
}
