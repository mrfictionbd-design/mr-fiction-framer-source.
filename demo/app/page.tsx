import Link from "next/link";
import { SiteHeader } from "../components/SiteHeader";
import { InteractiveGallery } from "../components/InteractiveGallery";
import { Reveal } from "../components/Reveal";

const drops = [
  {name:"NO FUTURE",code:"MF / 001",image:"/images/no-future.webp",note:"INDUSTRIAL / GRAPHIC"},
  {name:"UNDERGROUND",code:"MF / 002",image:"/images/underground.webp",note:"GARAGE / CULTURE"},
  {name:"SAMURAI",code:"MF / 003",image:"/images/samurai.webp",note:"ART / ATTITUDE"},
];
export default function HomePage(){
  return <main className="home-page">
    <SiteHeader/>
    <section className="hero">
      <div className="hero-noise"/>
      <div className="hero-meta"><span>INDEPENDENT STREETWEAR</span><span>DHAKA, BANGLADESH · EST. 2026</span></div>
      <div className="hero-content">
        <Reveal><p className="eyebrow red-dot">NOT MADE TO BLEND IN</p></Reveal>
        <Reveal delay={.08}><h1>MADE<br/><em>TO MOVE.</em></h1></Reveal>
        <Reveal delay={.16}><div className="hero-bottom"><p>Premium streetwear.<br/>A different point of view.</p><Link className="circle-link" href="/collection"><span>EXPLORE<br/>THE DROP</span><b>↗</b></Link></div></Reveal>
      </div>
      <div className="hero-image-wrap"><img src="/images/underground.webp" alt="MR. FICTION oversized streetwear display"/></div>
      <div className="hero-side-note">VOLUME 001&nbsp; / &nbsp;THE EVERYDAY UNIFORM</div>
      <div className="hero-bottom-index"><span>SCROLL TO EXPLORE</span><span>01 — 03</span></div>
    </section>
    <InteractiveGallery/>
    <section className="drop-section" id="story">
      <div className="section-topline"><span>02 / SELECTED PIECES</span><span>NO SEASON. NO RULES.</span></div>
      <div className="drop-title"><Reveal><p className="eyebrow">THE FIRST IMPRESSION</p><h2>THE NEW<br/><em>DROP.</em></h2></Reveal><Reveal delay={.12}><p className="drop-intro">Built around oversized silhouettes, bold graphics and details that speak without asking for attention.</p><Link href="/collection" className="text-link">VIEW ALL PIECES <span>↗</span></Link></Reveal></div>
      <div className="product-grid">
        {drops.map((item,i)=><Reveal key={item.code} image delay={i*.07} className="product-card">
          <Link href="/collection" className="product-image"><img src={item.image} alt={item.name}/><span className="product-arrow">↗</span></Link>
          <div className="product-meta"><span>{item.code}</span><span>{item.note}</span></div><h3>{item.name}</h3>
        </Reveal>)}
      </div>
      <div className="drop-bottom"><span>DESIGNED IN DHAKA</span><span>MADE FOR EVERYWHERE</span></div>
    </section>
    <section className="manifesto">
      <Reveal><span className="eyebrow">03 / THE FICTION</span><h2>REAL ON<br/>YOUR <em>TERMS.</em></h2></Reveal>
      <Reveal delay={.12}><p>Clothes are a language. Wear yours loud, quiet, or somewhere in between. MR. FICTION is a space for the ones writing their own version.</p><Link href="/compare" className="text-link">TEST THE MOTION <span>↗</span></Link></Reveal>
      <span className="manifesto-watermark">MF®</span>
    </section>
    <footer className="site-footer"><Link href="/" className="wordmark">MR. <span>FICTION</span><b>®</b></Link><span>PREMIUM STREETWEAR FROM DHAKA</span><div><Link href="/collection">SHOP</Link><Link href="/compare">MOTION TEST</Link></div><small>© 2026 MR. FICTION. MOTION STUDY / PREVIEW BUILD.</small></footer>
  </main>;
}
