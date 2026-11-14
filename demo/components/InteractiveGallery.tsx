"use client";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

const looks = [
  { id:"no-future", title:"NO FUTURE", label:"DROP 001", image:"/images/no-future.webp", line:"Built for the ones who move differently." },
  { id:"underground", title:"UNDERGROUND", label:"DROP 002", image:"/images/underground.webp", line:"Street uniform. No permission required." },
  { id:"samurai", title:"SAMURAI", label:"DROP 003", image:"/images/samurai.webp", line:"Quiet presence. Heavy impact." },
];
const slots = [
  {x:5,y:5,z:0,look:0},{x:29,y:-5,z:1,look:1},{x:53,y:8,z:2,look:2},{x:77,y:-4,z:0,look:1},
  {x:-2,y:34,z:1,look:2},{x:24,y:43,z:2,look:0},{x:50,y:33,z:3,look:1},{x:76,y:42,z:1,look:2},
  {x:7,y:70,z:0,look:1},{x:33,y:77,z:2,look:2},{x:59,y:69,z:1,look:0},{x:83,y:78,z:3,look:1},
];
const depth = [
  {scale:.65,blur:4,opacity:.36,z:-420},
  {scale:.78,blur:2.4,opacity:.58,z:-240},
  {scale:.91,blur:1,opacity:.8,z:-90},
  {scale:1,blur:0,opacity:1,z:45},
];
export function InteractiveGallery() {
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const didDrag = useRef(false);
  const last = useRef({x:0,y:0});
  const base = useRef({x:0,y:0});
  const rawX = useMotionValue(0), rawY = useMotionValue(0), rawZoom = useMotionValue(1);
  const x = useSpring(rawX,{stiffness:85,damping:22,mass:.85});
  const y = useSpring(rawY,{stiffness:85,damping:22,mass:.85});
  const zoom = useSpring(rawZoom,{stiffness:100,damping:24});
  const tiltX = useSpring(0,{stiffness:90,damping:24}), tiltY = useSpring(0,{stiffness:90,damping:24});
  const [active,setActive] = useState<number|null>(null);
  const [hint,setHint] = useState(true);
  const items = useMemo(()=>slots.map((slot,index)=>({...slot,look:looks[slot.look],index})),[]);
  useAnimationFrame((time)=>{
    if (reduced || isDragging.current || active !== null) return;
    rawY.set(base.current.y + Math.sin(time/1900)*5.5);
    rawX.set(base.current.x + Math.cos(time/2700)*3.5);
  });
  const onDown = (e:React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    isDragging.current=true; didDrag.current=false; last.current={x:e.clientX,y:e.clientY};
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    setHint(false);
  };
  const onMove = (e:React.PointerEvent<HTMLDivElement>) => {
    const rect=stageRef.current?.getBoundingClientRect(); if(!rect) return;
    if(isDragging.current){
      const dx=e.clientX-last.current.x, dy=e.clientY-last.current.y;
      if(Math.abs(dx)+Math.abs(dy)>2) didDrag.current=true;
      base.current={x:base.current.x+dx*.72,y:base.current.y+dy*.72};
      rawX.set(base.current.x); rawY.set(base.current.y); last.current={x:e.clientX,y:e.clientY};
    } else if(!reduced){
      tiltY.set(((e.clientX-rect.left)/rect.width-.5)*5);
      tiltX.set(-((e.clientY-rect.top)/rect.height-.5)*4);
    }
  };
  const onUp = () => {isDragging.current=false; setTimeout(()=>{didDrag.current=false;},60);};
  const onWheel = (e:React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault(); setHint(false);
    rawZoom.set(Math.max(.72,Math.min(1.24,rawZoom.get()-e.deltaY*.00055)));
  };
  const reset = () => {base.current={x:0,y:0};rawX.set(0);rawY.set(0);rawZoom.set(1);setActive(null);};
  return <section className="gallery-section" aria-label="Interactive 3D streetwear gallery">
    <div className="section-topline"><span>01 / THE MOTION STUDY</span><span>MOVE THROUGH THE DROP</span></div>
    <div className="gallery-heading"><div><p className="eyebrow">A DIFFERENT POINT OF VIEW</p><h2>THE WORLD<br/><em>IN MOTION.</em></h2></div><p className="gallery-copy">A layered gallery with depth, drift and a little attitude. Drag to explore. Scroll to move closer. Tap a look to focus.</p></div>
    <div className="gallery-stage" ref={stageRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel}>
      <div className="gallery-gridlines" aria-hidden="true"/>
      <motion.div className="gallery-world" style={{x,y,scale:zoom,rotateX:tiltX,rotateY:tiltY}}>
        {items.map((item)=>{
          const d=depth[item.z];
          return <motion.button
            type="button" className={`look-tile depth-${item.z}`} key={item.index}
            style={{left:`${item.x}%`,top:`${item.y}%`,z:d.z,scale:d.scale,filter:`blur(${d.blur}px)`,opacity:d.opacity}}
            whileHover={reduced?{}:{scale:d.scale*1.045,filter:"blur(0px)",opacity:1}}
            transition={{duration:.45,ease:[.22,1,.36,1]}}
            onClick={()=>{if(!didDrag.current){setActive(looks.findIndex(l=>l.id===item.look.id));setHint(false);}}}
            aria-label={`Focus ${item.look.title} look`}
          >
            <img src={item.look.image} alt={item.look.title} draggable={false}/>
            <span className="tile-index">{String(item.index+1).padStart(2,"0")} <i>/ {item.look.label}</i></span>
            <span className="tile-title">{item.look.title}</span>
          </motion.button>;
        })}
      </motion.div>
      <div className="gallery-hud"><span>MRF / 001</span><span>{hint?"DRAG TO WANDER · SCROLL TO ZOOM":"INTERACTIVE FIELD"}</span><button type="button" onClick={reset}>RESET ↺</button></div>
      <div className="gallery-crosshair" aria-hidden="true">+</div>
      <AnimatePresence>
        {active!==null && <motion.div className="look-focus" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setActive(null)}>
          <motion.div className="focus-card" initial={{y:30,scale:.96}} animate={{y:0,scale:1}} exit={{y:20,scale:.98}} transition={{duration:.55,ease:[.22,1,.36,1]}} onClick={e=>e.stopPropagation()}>
            <button type="button" className="focus-close" onClick={()=>setActive(null)}>CLOSE ×</button>
            <img src={looks[active].image} alt={looks[active].title}/>
            <div className="focus-info"><span>{looks[active].label}</span><h3>{looks[active].title}</h3><p>{looks[active].line}</p><a href="/collection">EXPLORE THE DROP ↗</a></div>
          </motion.div>
        </motion.div>}
      </AnimatePresence>
    </div>
    <div className="gallery-foot"><span>12 LAYERS / 04 DEPTH PLANES / INFINITE PERSPECTIVE</span><span>POWERED BY MOTION, BUILT FOR MR. FICTION</span></div>
  </section>;
}
