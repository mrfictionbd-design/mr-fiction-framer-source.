"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const tick = () => setScrolled(window.scrollY > 28);
    tick(); window.addEventListener("scroll", tick, { passive: true });
    return () => window.removeEventListener("scroll", tick);
  }, []);
  return <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
    <Link href="/" className="wordmark" aria-label="MR. FICTION home">MR. <span>FICTION</span><b>®</b></Link>
    <nav><Link href="/collection">Shop</Link><a href="#story">Our story</a><Link href="/compare" className="compare-nav">Motion test <span>↗</span></Link></nav>
    <span className="header-location">DHAKA · BD</span>
  </header>;
}
