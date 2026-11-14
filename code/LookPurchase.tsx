// Look purchase — the right-hand column of the Look page: the three pieces as
// rows, one row of size chips per size system (clothing, shoes), and
// "Add the full look", which adds every piece in its chosen size and opens the
// bag. Bind "Look code" to Looks → Code; the pieces come from the CMS through
// the hidden Salon Index lists on the page. On phones the button docks as a
// glass bar at the bottom once the inline one has scrolled away.
import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { T, ff, bag, openBag, useLang, formatPrice, useSalonIndex, useNavigate, useLookSizes, setLookSize, useLiveMap, livePrice, liveSold, liveSizes, liveMissing } from "./OmbrineStore.tsx"

interface LookPurchaseProps {
    lookCode: string
    addLabel: string
    addedLabel: string
    note: string
    sizeWord: string
    style?: React.CSSProperties
}

interface PieceRow {
    slug: string
    name: string
    material: string
    price: number
    image: string
    sizes: string
    soldOut: string
    sizeLabel: string
    category?: string
    order: number
}

const plain: React.CSSProperties = { appearance: "none", background: "none", border: "none", padding: 0, margin: 0, font: "inherit", color: "inherit", cursor: "pointer" }
const list = (s: string) => (s || "").split(",").map((x) => x.trim()).filter(Boolean)
const sized = (url: string, px: number) => (url && url.includes("framerusercontent.com/images/") && !url.includes("?") ? `${url}?scale-down-to=${px}` : url)

const SAMPLE: PieceRow[] = [
    { slug: "double-face-wrap-coat-camel", name: "Double-face wrap coat", material: "Camel wool and cashmere", price: 2890, image: "https://framerusercontent.com/images/W6FEbq5iFIoQLOx5HvNrd05YCk.png", sizes: "34, 36, 38, 40, 42, 44", soldOut: "44", sizeLabel: "Clothing, French", order: 1 },
    { slug: "wide-wool-trousers-ivory", name: "Wide wool trousers", material: "Ivory virgin wool", price: 890, image: "https://framerusercontent.com/images/TJsia5VG0GDOQESYUhqMOTJZYfY.png", sizes: "34, 36, 38, 40, 42, 44", soldOut: "", sizeLabel: "Clothing, French", order: 2 },
    { slug: "suede-slingback-tan", name: "Suede slingback", material: "Tan calf suede, 70 mm", price: 720, image: "https://framerusercontent.com/images/Js6aZMmkLrgYj5JXn6hx9gD3bz0.png", sizes: "36, 37, 38, 39, 40, 41", soldOut: "", sizeLabel: "Shoes, EU", order: 3 },
]

/**
 * Look purchase
 *
 * @framerIntrinsicWidth 436
 * @framerIntrinsicHeight 420
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function LookPurchase(props: LookPurchaseProps) {
    const { lookCode = "", addLabel = "Add the full look", addedLabel = "Added to your bag", note = "Or choose pieces one by one below.", sizeWord = "Size", style } = props
    const isStatic = useIsStaticRenderer()
    const lang = useLang()
    const navigate = useNavigate()
    const index = useSalonIndex() as unknown as { pieces: Record<string, PieceRow & { look: string }> }
    const fromCms = Object.values(index.pieces)
        .filter((p) => p.look === lookCode)
        .sort((a, b) => a.order - b.order)
        .slice(0, 3)
    const base: PieceRow[] = fromCms.length ? fromCms : SAMPLE
    // Shopify, when connected, decides each piece's price and sold-out sizes
    const live = useLiveMap(fromCms.map((p) => p.slug))
    const pieces: PieceRow[] = base.map((p) => {
        const l = fromCms.length ? live[p.slug] : undefined
        const own = liveSizes(l, list(p.sizes))
        return { ...p, price: livePrice(l, p.price), sizes: own.join(", "), soldOut: liveSold(l, own, list(p.soldOut)).join(", ") }
    })
    // pieces the connected shop does not carry are left out of "Add the full look"
    const buyable = pieces.filter((p) => !(fromCms.length && liveMissing(live[p.slug])))

    // one size system per size run (pieces with the same sizes share one choice), in the order the pieces come
    const systems: { label: string; title: string; sizes: string[]; sold: string[] }[] = []
    pieces.forEach((p) => {
        if (!list(p.sizes).length) return
        const label = p.sizeLabel || "Size"
        let sys = systems.find((s) => s.label === label)
        if (!sys) systems.push((sys = { label, title: "", sizes: [], sold: [] }))
        list(p.sizes).forEach((s) => !sys!.sizes.includes(s) && sys!.sizes.push(s))
    })
    // what the visitor reads above each row: "Size", or the kinds of piece when there are several rows
    systems.forEach((sys) => {
        const kinds = Array.from(new Set(pieces.filter((p) => (p.sizeLabel || "Size") === sys.label).map((p) => p.category || "").filter(Boolean)))
        sys.title = systems.length > 1 && kinds.length ? kinds.join(" · ") : sizeWord
    })
    // a size is sold out for a system only when every piece in it is sold out in that size
    systems.forEach((sys) => {
        const inSys = pieces.filter((p) => (p.sizeLabel || "Size") === sys.label)
        sys.sold = sys.sizes.filter((s) => inSys.every((p) => list(p.soldOut).includes(s) || !list(p.sizes).includes(s)))
    })
    const [added, setAdded] = useState(false)
    const chosen = useLookSizes()
    const sizeOf = (label: string) => {
        const sys = systems.find((s) => s.label === label)
        if (!sys) return ""
        const pick = chosen[label]
        if (pick && sys.sizes.includes(pick) && !sys.sold.includes(pick)) return pick
        const avail = sys.sizes.filter((s) => !sys.sold.includes(s))
        return avail[Math.floor((avail.length - 1) / 2)] || avail[0] || ""
    }
    const pickSize = (label: string, s: string) => {
        setLookSize(label, s)
        setAdded(false)
    }
    // publish the sizes in effect, so each piece's own Add button shows the same size
    const effective = systems.map((sys) => `${sys.label}=${sizeOf(sys.label)}`).join("|")
    useEffect(() => {
        systems.forEach((sys) => {
            const s = sizeOf(sys.label)
            if (s && chosen[sys.label] !== s) setLookSize(sys.label, s)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effective])

    // phones: dock the button once the inline one has scrolled above the view
    const btnRef = useRef<HTMLButtonElement>(null)
    const [docked, setDocked] = useState(false)
    const [phone, setPhone] = useState(false)
    useEffect(() => {
        if (isStatic) return
        const m = () => setPhone(window.innerWidth < 810)
        m()
        window.addEventListener("resize", m)
        const el = btnRef.current
        let io: IntersectionObserver | null = null
        if (el && typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(([e]) => setDocked(!e.isIntersecting && e.boundingClientRect.top < 0))
            io.observe(el)
        }
        return () => {
            window.removeEventListener("resize", m)
            io?.disconnect()
        }
    }, [isStatic])
    const total = buyable.reduce((n, p) => n + (Number(p.price) || 0), 0)

    const addAll = () => {
        if (isStatic) return
        buyable.forEach((p) => {
            const size = sizeOf(p.sizeLabel || "Size") || "One size"
            bag.add({ slug: p.slug, name: p.name, colour: p.material, size, price: Number(p.price) || 0, image: p.image })
        })
        setAdded(true)
        openBag()
    }

    const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderTop: `1px solid ${T.hairline}`, textDecoration: "none", color: T.ink }
    return (
        <div style={{ ...style, position: "relative", display: "flex", flexDirection: "column", gap: 28, fontFamily: ff.sans(), color: T.ink, width: "100%" }}>
            {/* the pieces */}
            <div style={{ display: "flex", flexDirection: "column", borderBottom: `1px solid ${T.hairline}` }}>
                {pieces.map((p) => (
                    <a key={p.slug} href={`/products/${p.slug}`} onClick={(e) => navigate(`/products/${p.slug}`, e)} style={rowStyle}>
                        <span style={{ width: 36, height: 44, flex: "0 0 auto", background: `radial-gradient(75% 70% at 50% 53%, var(--token-f6086245-9051-4ca8-b2fd-3025088ea0a2, #f6f3ee) 0%, var(--token-db1c8fdd-df02-4b51-a8ba-c824ff9d3ab5, #e2ddd5) 100%)`, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2 }}>
                            {p.image && <img src={sized(p.image, 128)} alt="" style={{ maxWidth: "78%", maxHeight: "82%", objectFit: "contain" }} />}
                        </span>
                        <span style={{ flex: 1, fontFamily: ff.serif(), fontSize: 18, lineHeight: 1.25 }}>{p.name}</span>
                        <span style={{ fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{formatPrice(Number(p.price) || 0, lang)}</span>
                    </a>
                ))}
            </div>

            {/* sizes, one row per size system */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 28px" }}>
                {systems.map((sys) => {
                    const current = sizeOf(sys.label)
                    return (
                        <div key={sys.label} role="radiogroup" aria-label={sys.title} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <span style={{ fontSize: 12, color: T.inkSoft, letterSpacing: "0.006em" }}>{sys.title}</span>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {sys.sizes.map((s) => {
                                    const sold = sys.sold.includes(s)
                                    const on = s === current
                                    return (
                                        <button
                                            key={s}
                                            role="radio"
                                            aria-checked={on}
                                            disabled={sold}
                                            onClick={() => pickSize(sys.label, s)}
                                            style={{
                                                ...plain,
                                                minWidth: 36,
                                                height: 36,
                                                padding: "0 8px",
                                                fontSize: 12,
                                                border: `1px solid ${on ? T.ink : T.outline}`,
                                                background: on ? T.ink : "transparent",
                                                color: on ? T.onInk : sold ? T.inkSoft : T.ink,
                                                textDecoration: sold ? "line-through" : "none",
                                                opacity: sold ? 0.5 : 1,
                                                cursor: sold ? "default" : "pointer",
                                                transition: "background .35s cubic-bezier(.22,1,.36,1), color .35s, border-color .35s",
                                            }}
                                        >
                                            {s}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* add the whole look */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <button
                    ref={btnRef}
                    onClick={addAll}
                    style={{ ...plain, height: 52, padding: "0 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: T.ink, color: T.onInk, fontSize: 14, fontWeight: 500, borderRadius: 2 }}
                >
                    <span>{added ? addedLabel : addLabel}</span>
                    <span style={{ opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>{formatPrice(total, lang)}</span>
                </button>
                <span style={{ fontSize: 13, color: T.inkSoft }}>{note}</span>
            </div>
            {!isStatic && phone && typeof document !== "undefined" &&
                createPortal(
                    <div
                        aria-hidden={!docked}
                        style={{
                            position: "fixed",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 900,
                            padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
                            background: "var(--token-5110053d-cf94-4e11-8a73-dece4e5d1c6a, rgba(245,242,237,0.6))",
                            backdropFilter: "blur(20px) saturate(140%)",
                            WebkitBackdropFilter: "blur(20px) saturate(140%)",
                            borderTop: `1px solid ${T.hairline}`,
                            transform: docked ? "translateY(0%)" : "translateY(110%)",
                            transition: "transform .6s cubic-bezier(.22,1,.36,1)",
                            fontFamily: ff.sans(),
                        }}
                    >
                        <button
                            onClick={addAll}
                            tabIndex={docked ? 0 : -1}
                            style={{ ...plain, width: "100%", height: 50, padding: "0 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: T.ink, color: T.onInk, fontSize: 14, fontWeight: 500, borderRadius: 2 }}
                        >
                            <span>{added ? addedLabel : addLabel}</span>
                            <span style={{ opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>{formatPrice(total, lang)}</span>
                        </button>
                    </div>,
                    document.body
                )}
        </div>
    )
}

addPropertyControls(LookPurchase as any, {
    lookCode: { type: ControlType.String, title: "Look code", defaultValue: "", description: "Bind to Looks → Code. The pieces come from the Products whose Look has this code." },
    addLabel: { type: ControlType.String, title: "Button", defaultValue: "Add the full look" },
    addedLabel: { type: ControlType.String, title: "Added", defaultValue: "Added to your bag" },
    note: { type: ControlType.String, title: "Note", defaultValue: "Or choose pieces one by one below." },
    sizeWord: { type: ControlType.String, title: "Size word", defaultValue: "Size", description: "Shown above the sizes when every piece shares one size run." },
})
