"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const looks = [
  { id: "no-future", title: "NO FUTURE", label: "DROP 001", image: "https://raw.githubusercontent.com/mrfictionbd-design/mrfiction-assets/main/tee-1.webp", line: "Built for the ones who move differently." },
  { id: "underground", title: "UNDERGROUND", label: "DROP 002", image: "https://raw.githubusercontent.com/mrfictionbd-design/mrfiction-assets/main/tee-19.webp", line: "Street uniform. No permission required." },
  { id: "samurai", title: "SAMURAI", label: "DROP 003", image: "https://raw.githubusercontent.com/mrfictionbd-design/mrfiction-assets/main/tee-24.webp", line: "Quiet presence. Heavy impact." },
];
const rows = [
  { key: "far", spacing: 174, y: 76, height: 112, blur: 4.5, opacity: .32, parallax: .34, seed: 1 },
  { key: "back", spacing: 202, y: 138, height: 178, blur: 2.3, opacity: .56, parallax: .58, seed: 2 },
  { key: "mid", spacing: 236, y: 300, height: 292, blur: 0, opacity: 1, parallax: 1, seed: 0 },
  { key: "front", spacing: 328, y: 350, height: 438, blur: 1.2, opacity: .88, parallax: 1.42, seed: 1 },
];
const HOME_REL = [2, 1, 0, -1];
const mod = (n: number, m: number) => ((n % m) + m) % m;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const wrapRel = (n: number) => mod(n + 1.5, 4) - 1.5;
const profile = {
  height: [[-2, 520], [-1, 438], [0, 292], [1, 178], [2, 112], [3, 78]],
  spacing: [[-2, 360], [-1, 328], [0, 236], [1, 202], [2, 174], [3, 150]],
  y: [[-2, 380], [-1, 350], [0, 300], [1, 138], [2, 76], [3, 40]],
  blur: [[-2, 5], [-1, 1.2], [0, 0], [1, 2.3], [2, 4.5], [3, 6]],
  opacity: [[-1.5, 0], [-1, .88], [0, 1], [1, .56], [2, .32], [2.5, 0]],
  parallax: [[-2, 1.8], [-1, 1.42], [0, 1], [1, .58], [2, .34], [3, .22]],
};
function at(keys: number[][], x: number) {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (x <= keys[i][0]) {
      const t = (x - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]);
      return lerp(keys[i - 1][1], keys[i][1], t);
    }
  }
  return keys[keys.length - 1][1];
}
const slotIndices = Array.from({ length: 23 }, (_, i) => i - 11);

export function InteractiveGallery() {
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tileRefs = useRef<(HTMLDivElement | null)[][]>([[], [], [], []]);
  const size = useRef({ w: 1200, h: 650 });
  const camera = useRef({ x: 0, y: 0, vx: 0, vy: 0, depth: 0, targetDepth: 0, depthVelocity: 0, breath: 0 });
  const pointer = useRef({ x: -9999, y: -9999, lastX: 0, lastY: 0, lastT: 0, startX: 0, startY: 0, down: false, moved: 0, axis: "" });
  const lastInput = useRef(0);
  const hoverRef = useRef<{ row: number; slot: number; look: number } | null>(null);
  const wheelRef = useRef({ sum: 0, last: 0, lockedUntil: 0 });
  const [active, setActive] = useState<number | null>(null);
  const [hovered, setHovered] = useState<{ row: number; slot: number; look: number } | null>(null);
  const [hint, setHint] = useState(true);
  const [depthLabel, setDepthLabel] = useState(0);
  const ordered = useMemo(() => rows.map((row, r) => slotIndices.map((slot) => ({
    slot,
    look: mod(slot + row.seed, looks.length),
  }))), []);

  const measure = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width && rect.height) size.current = { w: rect.width, h: rect.height };
  }, []);

  const stepDepth = useCallback((direction: number) => {
    if (active !== null) return;
    const cam = camera.current;
    cam.targetDepth = clamp(Math.round(cam.targetDepth) + direction, -8, 8);
    setDepthLabel(cam.targetDepth);
    setHint(false);
    lastInput.current = performance.now();
    cam.vx = cam.vy = 0;
  }, [active]);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (stageRef.current) observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(.04, Math.max(.001, (now - last) / 1000));
      last = now;
      const cam = camera.current;
      const p = pointer.current;
      const w = size.current.w;
      const h = size.current.h;
      const isOpen = active !== null;
      if (!p.down && !isOpen) {
        if (Math.abs(cam.vx) > 8 || Math.abs(cam.vy) > 8) {
          cam.x += cam.vx * dt;
          cam.y = clamp(cam.y + cam.vy * dt, -90, 90);
          const friction = Math.pow(.935, dt * 60);
          cam.vx *= friction;
          cam.vy *= friction;
        } else {
          cam.vx = cam.vy = 0;
        }
        if (!reduced && now - lastInput.current > 4200) {
          const t = (now - lastInput.current - 4200) / 12000 * Math.PI * 2;
          cam.breath = .006 * (1 - Math.cos(t));
        } else cam.breath = 0;
      }
      if (!reduced && !p.down && !isOpen && now - lastInput.current > 9000) {
        cam.x += Math.sin(now / 8500) * .08;
      }
      const omega = reduced ? 0 : 7.2;
      cam.depthVelocity += (omega * omega * (cam.targetDepth - cam.depth) - 2 * omega * cam.depthVelocity) * dt;
      cam.depth += cam.depthVelocity * dt;
      if (Math.abs(cam.targetDepth - cam.depth) < .0005 && Math.abs(cam.depthVelocity) < .002) {
        cam.depth = cam.targetDepth;
        cam.depthVelocity = 0;
      }

      const scale = h / 650;
      const globalScale = 1 + cam.breath;
      const world = stage.querySelector<HTMLElement>(".gallery-world");
      if (world) world.style.transform = `translate3d(0, ${cam.y * -.18}px, 0) scale(${globalScale})`;
      rows.forEach((row, r) => {
        const rel = wrapRel(HOME_REL[r] - cam.depth);
        const rowHeight = at(profile.height, rel) * scale;
        const spacing = at(profile.spacing, rel) * scale;
        const y = (h - 650 * scale) / 2 + at(profile.y, rel) * scale - cam.y * (r === 3 ? 1.35 : r === 0 ? .34 : r === 1 ? .58 : 1);
        const blur = at(profile.blur, rel) * scale;
        const opacity = at(profile.opacity, rel);
        const parallax = at(profile.parallax, rel);
        const wrap = rowRefs.current[r];
        if (wrap) {
          wrap.style.opacity = opacity.toFixed(3);
          wrap.style.filter = blur > .05 ? `blur(${blur.toFixed(2)}px)` : "none";
          wrap.style.zIndex = String(Math.round((3 - rel) * 10));
          wrap.style.visibility = opacity < .004 ? "hidden" : "visible";
        }
        const cardWidth = rowHeight * .72;
        const baseIndex = Math.floor(cam.x * parallax / spacing);
        ordered[r].forEach((item, j) => {
          const el = tileRefs.current[r][j];
          if (!el) return;
          const absoluteSlot = item.slot + baseIndex;
          const lookIndex = mod(absoluteSlot + row.seed, looks.length);
          const x = w / 2 + (absoluteSlot * spacing) - cam.x * parallax - cardWidth / 2;
          if (el.dataset.look !== String(lookIndex)) {
            el.dataset.look = String(lookIndex);
            const image = el.querySelector("img");
            if (image) { image.src = looks[lookIndex].image; image.alt = looks[lookIndex].title; }
            const labels = el.querySelectorAll("span");
            if (labels[0]) labels[0].textContent = `${String(mod(absoluteSlot, 99) + 1).padStart(2, "0")} / ${looks[lookIndex].label}`;
            if (labels[1]) labels[1].textContent = looks[lookIndex].title;
          }
          const yJitter = Math.sin((item.slot + row.seed * 17) * 1.73) * (r === 2 ? 9 : 6) * scale;
          const lean = (() => {
            const hv = hoverRef.current;
            if (!hv || hv.row !== r || hv.slot !== j || p.x < 0) return { x: 0, scale: 1 };
            const rect = el.getBoundingClientRect();
            const dx = rect.left + rect.width / 2 - p.x;
            const dy = rect.top + rect.height / 2 - p.y;
            const dist = Math.hypot(dx, dy);
            const influence = dist < 260 ? smooth(1 - dist / 260) : 0;
            return { x: Math.sign(dx || 1) * 5 * influence, scale: 1 + .035 * influence };
          })();
          const inFocus = Math.abs(rel) < .08;
          const hoverScale = hoverRef.current?.row === r && hoverRef.current?.slot === j ? 1.045 : 1;
          const transform = `translate3d(${x + lean.x}px, ${y + yJitter}px, 0) scale(${lean.scale * hoverScale})`;
          el.style.width = `${cardWidth}px`;
          el.style.height = `${rowHeight}px`;
          el.style.transform = transform;
          el.style.filter = "";
          el.style.pointerEvents = inFocus || Math.abs(rel + 1) < .08 ? "auto" : "none";
          el.style.cursor = inFocus ? "pointer" : "default";
          el.style.opacity = "1";
          el.style.zIndex = String(100 - Math.round(Math.abs(rel) * 10) + j);
        });
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, ordered, reduced]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (active !== null || (e.target as HTMLElement).closest("button")) return;
    const p = pointer.current;
    p.down = true; p.moved = 0; p.axis = "";
    p.startX = p.lastX = e.clientX; p.startY = p.lastY = e.clientY; p.lastT = performance.now();
    camera.current.vx = camera.current.vy = 0;
    lastInput.current = performance.now();
    setHint(false);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = pointer.current;
    p.x = e.clientX - rect.left; p.y = e.clientY - rect.top;
    if (!p.down) return;
    const dx = e.clientX - p.lastX;
    const dy = e.clientY - p.lastY;
    p.moved = Math.max(p.moved, Math.hypot(e.clientX - p.startX, e.clientY - p.startY));
    if (!p.axis && p.moved > 10) p.axis = Math.abs(e.clientY - p.startY) > Math.abs(e.clientX - p.startX) ? "y" : "x";
    const mobile = rect.width < 810;
    const moveX = mobile && p.axis === "y" ? 0 : dx;
    const moveY = mobile ? 0 : dy;
    if (p.moved > 5 && (moveX || moveY)) {
      const dt = Math.max(.008, (performance.now() - p.lastT) / 1000);
      camera.current.x -= moveX;
      camera.current.y -= moveY;
      camera.current.vx = -moveX / dt;
      camera.current.vy = -moveY / dt;
    }
    p.lastX = e.clientX; p.lastY = e.clientY; p.lastT = performance.now();
    lastInput.current = performance.now();
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const p = pointer.current;
    const wasDown = p.down;
    p.down = false;
    if (wasDown && stageRef.current && stageRef.current.hasPointerCapture(e.pointerId)) {
      try { stageRef.current.releasePointerCapture(e.pointerId); } catch {}
    }
    if (performance.now() - p.lastT > 90) camera.current.vx = camera.current.vy = 0;
    if (wasDown && stageRef.current && stageRef.current.clientWidth < 810 && p.axis === "y") {
      const dy = e.clientY - p.startY;
      if (Math.abs(dy) > 48) stepDepth(dy < 0 ? 1 : -1);
    }
  };
  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (active !== null) return;
    const now = performance.now();
    const state = wheelRef.current;
    if (now - state.last > 160) state.sum = 0;
    state.last = now;
    if (now < state.lockedUntil) return;
    state.sum += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    if (Math.abs(state.sum) > 42) {
      stepDepth(state.sum > 0 ? 1 : -1);
      state.sum = 0;
      state.lockedUntil = now + 820;
    }
  };
  const reset = () => {
    camera.current = { x: 0, y: 0, vx: 0, vy: 0, depth: 0, targetDepth: 0, depthVelocity: 0, breath: 0 };
    setDepthLabel(0); setActive(null); setHovered(null); hoverRef.current = null; setHint(true);
  };
  const focusLook = (look: number) => {
    if (pointer.current.moved > 6) return;
    setActive(look); setHint(false); lastInput.current = performance.now();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (active !== null) {
        if (e.key === "Escape") setActive(null);
        if (e.key === "ArrowRight") setActive((v) => v === null ? null : mod(v + 1, looks.length));
        if (e.key === "ArrowLeft") setActive((v) => v === null ? null : mod(v - 1, looks.length));
        return;
      }
      if (!stageRef.current?.contains(document.activeElement)) return;
      if (e.key === "ArrowLeft") { camera.current.vx = 650; e.preventDefault(); }
      if (e.key === "ArrowRight") { camera.current.vx = -650; e.preventDefault(); }
      if (e.key === "ArrowUp") { stepDepth(-1); e.preventDefault(); }
      if (e.key === "ArrowDown") { stepDepth(1); e.preventDefault(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, stepDepth]);

  const updateHover = (row: number, slot: number, look: number) => {
    const value = { row, slot, look };
    hoverRef.current = value; setHovered(value);
  };
  const clearHover = () => { hoverRef.current = null; setHovered(null); };

  return <section className="gallery-section" aria-label="Interactive four-plane streetwear gallery">
    <div className="section-topline"><span>01 / THE MOTION STUDY</span><span>FOUR PLANES · INFINITE WALL</span></div>
    <div className="gallery-heading"><div><p className="eyebrow">A DIFFERENT POINT OF VIEW</p><h2>THE WORLD<br/><em>IN MOTION.</em></h2></div><p className="gallery-copy">A wall of looks suspended in four layers of depth. Drag to wander, scroll to move between planes, and select a piece to step closer.</p></div>
    <motion.div ref={stageRef} className="gallery-stage gallery-stage-pro" tabIndex={0}
      initial={reduced ? false : { opacity: 0, scale: 1.025, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, amount: .15 }}
      transition={{ duration: reduced ? .2 : 1.35, ease: [.22, 1, .36, 1] }}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
      onPointerLeave={() => { if (!pointer.current.down) clearHover(); }}
      onWheel={onWheel}
    >
      <div className="gallery-gridlines" aria-hidden="true"/>
      <div className="gallery-world">
        {rows.map((row, r) => <div className="gallery-row" key={row.key} ref={(el) => { rowRefs.current[r] = el; }}>
          {ordered[r].map((item, j) => <div className="look-tile gallery-look" key={`${row.key}-${item.slot}`}
            ref={(el) => { tileRefs.current[r][j] = el; }}
            data-look={item.look}
            onPointerEnter={(e) => { const rel = wrapRel(HOME_REL[r] - camera.current.targetDepth); if (Math.abs(rel) < .08) updateHover(r, j, Number((e.currentTarget as HTMLDivElement).dataset.look || 0)); }}
            onPointerLeave={clearHover}
            onClick={(e) => focusLook(Number((e.currentTarget as HTMLDivElement).dataset.look || 0))}
            role="button" tabIndex={0} aria-label={`Focus ${looks[item.look].title}`}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); focusLook(Number((e.currentTarget as HTMLDivElement).dataset.look || 0)); } }}
          >
            <img src={looks[item.look].image} alt={looks[item.look].title} draggable={false} loading={Math.abs(HOME_REL[r]) < 1 ? "eager" : "lazy"}/>
            <span className="tile-index">{String(item.slot + 12).padStart(2, "0")} <i>/ {looks[item.look].label}</i></span>
            <span className="tile-title">{looks[item.look].title}</span>
          </div>)}
        </div>)}
      </div>
      <div className="gallery-grid-vignette" aria-hidden="true"/>
      <div className="gallery-crosshair" aria-hidden="true">+</div>
      <div className="gallery-hud"><span>MRF / 001</span><span>{hint ? "DRAG TO WANDER · SCROLL TO MOVE THROUGH" : `DEPTH PLANE / ${String(Math.abs(depthLabel) + 1).padStart(2, "0")}`}</span><button type="button" onClick={reset}>RESET ↺</button></div>
      <AnimatePresence>
        {hovered && <motion.div className="gallery-hover-label" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}><span>{looks[hovered.look].label}</span><b>{looks[hovered.look].title}</b><i>CLICK TO STEP CLOSER ↗</i></motion.div>}
      </AnimatePresence>
      <AnimatePresence>
        {active !== null && <motion.div className="look-focus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActive(null)}>
          <motion.div className="focus-card" initial={{ y: 45, scale: .9, filter: "blur(10px)" }} animate={{ y: 0, scale: 1, filter: "blur(0px)" }} exit={{ y: 24, scale: .96, filter: "blur(5px)" }} transition={{ duration: .72, ease: [.22, 1, .36, 1] }} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="focus-close" onClick={() => setActive(null)}>CLOSE ×</button>
            <img src={looks[active].image} alt={looks[active].title}/>
            <div className="focus-info"><span>{looks[active].label}</span><h3>{looks[active].title}</h3><p>{looks[active].line}</p><a href="/collection">EXPLORE THE DROP ↗</a><div className="focus-pager"><button onClick={() => setActive(mod(active - 1, looks.length))}>← PREV</button><button onClick={() => setActive(mod(active + 1, looks.length))}>NEXT →</button></div></div>
          </motion.div>
        </motion.div>}
      </AnimatePresence>
    </motion.div>
    <div className="gallery-foot"><span>04 DEPTH PLANES / 23 LOOK POSITIONS PER ROW / INERTIAL CAMERA</span><span>BUILT FOR MR. FICTION · MOTION STUDY V2</span></div>
  </section>;
}
