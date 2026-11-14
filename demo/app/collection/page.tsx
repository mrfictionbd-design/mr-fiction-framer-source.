import Link from "next/link";
import { SiteHeader } from "../../components/SiteHeader";
import { Reveal } from "../../components/Reveal";
const products=[
  {name:"NO FUTURE",code:"DROP 001",image:"https://raw.githubusercontent.com/mrfictionbd-design/mrfiction-assets/main/tee-1.webp",desc:"Industrial graphic / oversized silhouette"},
  {name:"UNDERGROUND",code:"DROP 002",image:"https://raw.githubusercontent.com/mrfictionbd-design/mrfiction-assets/main/tee-19.webp",desc:"Garage culture / daily uniform"},
  {name:"SAMURAI",code:"DROP 003",image:"https://raw.githubusercontent.com/mrfictionbd-design/mrfiction-assets/main/tee-24.webp",desc:"Illustrated graphic / street classic"},
];
export default function CollectionPage(){
  return <main className="collection-page"><SiteHeader/><section className="collection-hero">
    <div className="section-topline"><span>MR. FICTION / COLLECTION</span><span>DHaka · BANGLADESH</span></div>
    <Reveal><p className="eyebrow">THE FIRST CHAPTER</p><h1>THE<br/><em>ARCHIVE.</em></h1></Reveal>
    <Reveal delay={.12}><p className="collection-intro">A focused selection of the MR. FICTION visual direction. Product data, pricing and checkout are intentionally not enabled in this motion preview.</p></Reveal>
  </section>
  <section className="collection-grid">{products.map((p,i)=><Reveal key={p.code} image delay={i*.08} className="collection-product">
    <Link href="/compare" className="collection-image"><img src={p.image} alt={p.name}/><span>VIEW MOTION STUDY ↗</span></Link>
    <div className="product-meta"><span>{p.code}</span><span>MR. FICTION</span></div><h2>{p.name}</h2><p>{p.desc}</p>
  </Reveal>)}</section>
  <section className="collection-cta"><p className="eyebrow">A WORK IN PROGRESS</p><h2>THE MOTION<br/><em>IS THE MESSAGE.</em></h2><Link href="/compare" className="text-link">COMPARE WITH FRAMER <span>↗</span></Link></section>
  <footer className="site-footer"><Link href="/" className="wordmark">MR. <span>FICTION</span><b>®</b></Link><span>PREMIUM STREETWEAR FROM DHAKA</span><div><Link href="/">HOME</Link><Link href="/compare">MOTION TEST</Link></div><small>© 2026 MR. FICTION. PREVIEW BUILD.</small></footer></main>;
}
