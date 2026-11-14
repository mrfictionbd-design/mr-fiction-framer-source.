import Link from "next/link";
import { SiteHeader } from "../../components/SiteHeader";
import { Reveal } from "../../components/Reveal";
const original="https://high-celery-988969.framer.app";
export default function ComparePage(){
 return <main className="compare-page"><SiteHeader/><section className="compare-intro">
   <div className="section-topline"><span>MR. FICTION / MOTION LAB</span><span>ORIGINAL VS REBUILD</span></div>
   <Reveal><p className="eyebrow">SIDE-BY-SIDE REVIEW</p><h1>FEEL THE<br/><em>DIFFERENCE.</em></h1></Reveal>
   <Reveal delay={.12}><p>Compare the published Framer original with this independent Next.js motion study. Both previews are separate; the original Framer project has not been modified.</p></Reveal>
 </section>
 <section className="compare-panels">
  <div className="compare-panel"><div className="compare-panel-head"><span>01 / ORIGINAL</span><span>FRAMER</span></div><div className="compare-frame"><iframe src={original} title="Original MR. FICTION Framer website" loading="lazy"/></div><a className="compare-open" href={original} target="_blank" rel="noreferrer">OPEN ORIGINAL IN A NEW TAB ↗</a></div>
  <div className="compare-panel"><div className="compare-panel-head"><span>02 / NEW BUILD</span><span>NEXT.JS + FRAMER MOTION</span></div><div className="compare-frame"><iframe src="/" title="New MR. FICTION motion demo" loading="lazy"/></div><a className="compare-open" href="/" target="_blank">OPEN NEW DEMO IN A NEW TAB ↗</a></div>
 </section>
 <section className="motion-checks"><div><p className="eyebrow">WHAT TO TEST</p><h2>THE DETAILS<br/><em>MATTER.</em></h2></div><div className="check-list">
 {["Drag horizontally to pan the four layered rows with momentum and subtle cursor parallax.","Scroll over the gallery to move one depth plane forward or back; on mobile, swipe vertically.","Hover the focused row to see the neighbouring pieces react and the selected look respond.","Click a look in the focused plane to open the cinematic detail panel; use Previous / Next or Escape.","Scroll down to compare blurred, staggered content reveals.","Navigate between Home and Collection to test the 0.7s curtain transition.","Try the same actions on your phone as well as desktop."].map((t,i)=><div className="check-row" key={i}><span>0{i+1}</span><p>{t}</p></div>)}
 </div></section>
 <section className="compare-disclaimer"><span>IMPORTANT</span><p>Version 2 now follows the original four-plane camera model more closely: depth stepping, independent row parallax, inertial horizontal panning, idle breathing, hover response and a focused look overlay. It remains a custom Next.js translation, not Framer’s original runtime; we still need a live visual pass against the original on desktop and mobile.</p></section>
 <footer className="site-footer"><Link href="/" className="wordmark">MR. <span>FICTION</span><b>®</b></Link><span>MOTION STUDY / PREVIEW BUILD</span><div><Link href="/">HOME</Link><Link href="/collection">COLLECTION</Link></div><small>© 2026 MR. FICTION. NOT A PRODUCTION STORE.</small></footer>
 </main>;
}
