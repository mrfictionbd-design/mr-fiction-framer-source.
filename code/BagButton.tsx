// Bag — the header trigger with a live count, and the bag drawer it opens.
// Reads and writes the shared Ombrine bag, so it stays in sync with the Salon,
// the product page and every other page, also across reloads.
// Checkout: with a Shopify store set, the bag becomes a real Shopify cart
// (Storefront API) and the visitor lands on Shopify's checkout. Products are
// matched by handle = CMS slug, sizes by the "Size" option. Without Shopify the
// bag is handed to a checkout URL as ?items=slug:size:qty,…
import * as React from "react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion, AnimatePresence, useAnimationControls } from "framer-motion"
import { T, ff, fontLink, studioTile, bag, useBag, useUI, useProducts, openBag, closeBag, useLang, formatPrice, useNavigate, checkoutHref, shopReady, shopifyCheckout, useShop, useLiveMap, livePrice } from "./OmbrineStore.tsx"

interface BagLabels {
    title: string
    pieces: string
    close: string
    remove: string
    complete: string
    add: string
    subtotal: string
    taxes: string
    checkout: string
    checkingOut: string
    unavailable: string
    checkoutError: string
    continueShopping: string
    empty: string
    emptyLink: string
}
interface BagButtonProps {
    label: string
    checkoutUrl: string
    shopLink: string
    labels: BagLabels
    textColor?: string
    style?: React.CSSProperties
}

// Only one drawer is rendered, even when several Bag buttons exist (desktop and mobile headers).
let nextId = 1
const alive = new Set<number>()
const ownerListeners = new Set<() => void>()
function useIsOwner() {
    const [id] = useState(() => nextId++)
    const [, force] = useState(0)
    useEffect(() => {
        alive.add(id)
        const l = () => force((n) => n + 1)
        ownerListeners.add(l)
        ownerListeners.forEach((f) => f())
        return () => {
            alive.delete(id)
            ownerListeners.delete(l)
            ownerListeners.forEach((f) => f())
        }
    }, [])
    return alive.size > 0 && Math.min(...Array.from(alive)) === id
}

const plain: React.CSSProperties = { appearance: "none", background: "none", border: "none", padding: 0, margin: 0, font: "inherit", color: "inherit", cursor: "pointer" }
const sized = (url: string, px: number) => (url && url.includes("framerusercontent.com/images/") && !url.includes("?") ? `${url}?scale-down-to=${px}` : url)

/**
 * Bag
 *
 * @framerIntrinsicWidth 53
 * @framerIntrinsicHeight 20
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function BagButton(props: BagButtonProps) {
    const { label = "Bag", checkoutUrl = "", shopLink = "/collection", textColor, style } = props
    const labels: BagLabels = { ...DEFAULT_LABELS, ...(props.labels || {}) }
    const isStatic = useIsStaticRenderer()
    const items = useBag()
    const ui = useUI()
    const count = isStatic ? 0 : items.reduce((n, i) => n + i.qty, 0)
    const pop = useAnimationControls()
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    const owner = useIsOwner()
    useEffect(() => {
        if (!ui.pop || isStatic) return
        pop.start({ scale: [0.6, 1.12, 1], transition: { type: "spring", stiffness: 300, damping: 22 } })
    }, [ui.pop])
    const color = textColor || T.ink
    const filled = count > 0
    return (
        <>
            <button
                onClick={openBag}
                aria-label={`${label}, ${count}`}
                style={{ ...style, ...plain, display: "flex", alignItems: "center", gap: 8, color, fontFamily: `"Manrope", sans-serif`, fontSize: 14, letterSpacing: "0.002em", lineHeight: 1, whiteSpace: "nowrap", minHeight: 20 }}
            >
                {label}
                <motion.span
                    animate={pop}
                    style={{
                        width: 20,
                        height: 20,
                        boxSizing: "border-box",
                        borderRadius: 10,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        border: `1px solid ${filled ? T.oxblood : `color-mix(in srgb, ${color} 35%, transparent)`}`,
                        background: filled ? T.oxblood : "transparent",
                        color: filled ? "#EEE7DC" : color,
                        fontVariantNumeric: "tabular-nums",
                        transition: "background-color .3s, border-color .3s",
                    }}
                >
                    {mounted ? count : 0}
                </motion.span>
            </button>
            {!isStatic && mounted && owner && createPortal(<Drawer open={ui.bagOpen} labels={labels} checkoutUrl={checkoutUrl} shopLink={shopLink} />, document.body)}
        </>
    )
}

function Drawer({ open, labels, checkoutUrl, shopLink }: { open: boolean; labels: BagLabels; checkoutUrl: string; shopLink: string }) {
    const [busy, setBusy] = useState(false)
    const [problem, setProblem] = useState("")
    const stored = useBag()
    const products = useProducts()
    const shop = useShop()
    // with a shop connected the bag shows Shopify's prices, the ones checkout will charge
    const live = useLiveMap(open ? stored.map((i) => i.slug) : [])
    const items = stored.map((i) => ({ ...i, price: livePrice(live[i.slug], i.price) }))
    const lang = useLang()
    const navigate = useNavigate()
    const [mobile, setMobile] = useState(false)
    useEffect(() => {
        const m = () => setMobile(window.innerWidth < 810)
        m()
        window.addEventListener("resize", m)
        return () => window.removeEventListener("resize", m)
    }, [])
    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeBag()
        window.addEventListener("keydown", onKey)
        const prev = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            window.removeEventListener("keydown", onKey)
            document.body.style.overflow = prev
        }
    }, [open])

    const count = items.reduce((n, i) => n + i.qty, 0)
    const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0)

    // "Complete the look": a piece from the same look that is not in the bag yet
    let suggestion: { look: string; p: any; size: string } | null = null
    for (const it of items) {
        const prod = products.find((p) => p.slug === it.slug)
        if (!prod || !prod.look) continue
        const other = products.find((p) => p.look === prod.look && !items.some((i) => i.slug === p.slug))
        if (other) {
            const sizes = (other.sizes || "").split(",").map((s) => s.trim()).filter(Boolean)
            const size = sizes.includes(it.size) ? it.size : sizes[Math.floor((sizes.length - 1) / 2)] || "One size"
            suggestion = { look: prod.look, p: other, size }
            break
        }
    }

    const go = (href: string, e?: any) => {
        closeBag()
        navigate(href, e)
    }
    const checkout = async () => {
        setProblem("")
        if (shopReady(shop)) {
            setBusy(true)
            try {
                const res = await shopifyCheckout(items, lang)
                if (res.url && !res.missing.length) {
                    window.location.href = res.url
                    return
                }
                setProblem(res.missing.length ? `${labels.unavailable} ${res.missing.join(", ")}` : labels.checkoutError)
            } catch (e) {
                setProblem(labels.checkoutError)
            }
            setBusy(false)
            return
        }
        const href = checkoutHref(checkoutUrl, items)
        if (href) window.location.href = href
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div key="bag" style={{ position: "fixed", inset: 0, zIndex: 1000, fontFamily: ff.sans(), color: T.ink }} initial={{ opacity: 1 }} exit={{ opacity: 1, transition: { duration: 0.5 } }}>
                    {fontLink(lang)}
                    <motion.div
                        onClick={closeBag}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{ position: "absolute", inset: 0, background: "rgba(22,19,15,0.22)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
                    />
                    <motion.aside
                        role="dialog"
                        aria-modal="true"
                        aria-label={labels.title}
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: mobile ? "100%" : 480, background: T.surface, display: "flex", flexDirection: "column", boxShadow: "-20px 0 60px rgba(22,19,15,0.12)" }}
                    >
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: mobile ? "22px 20px 18px" : "32px 36px 20px", borderBottom: `1px solid ${T.hairline}` }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                                <span style={{ fontFamily: ff.serif(), fontStyle: ff.italic(), fontWeight: ff.light(), fontSize: mobile ? 32 : 40, lineHeight: 1 }}>{labels.title}</span>
                                <span style={{ fontSize: 13, color: T.inkSoft }}>
                                    {count} {labels.pieces}
                                </span>
                            </div>
                            <button onClick={closeBag} style={{ ...plain, fontSize: 14, minHeight: 44 }}>
                                {labels.close}
                            </button>
                        </div>
                        <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "0 20px" : "0 36px" }}>
                            {items.length === 0 && (
                                <div style={{ padding: "48px 0", display: "flex", flexDirection: "column", gap: 16 }}>
                                    <span style={{ fontFamily: ff.serif(), fontStyle: ff.italic(), fontSize: 22 }}>{labels.empty}</span>
                                    <a href={shopLink} onClick={(e) => go(shopLink, e)} style={{ fontSize: 14, color: T.ink }}>
                                        {labels.emptyLink} →
                                    </a>
                                </div>
                            )}
                            <AnimatePresence initial={false}>
                                {items.map((it) => (
                                    <motion.div
                                        key={it.key}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                        style={{ display: "flex", gap: 20, padding: "22px 0", borderBottom: `1px solid ${T.hairline}`, overflow: "hidden" }}
                                    >
                                        <a href={`/products/${it.slug}`} onClick={(e) => go(`/products/${it.slug}`, e)} style={{ width: mobile ? 92 : 112, height: mobile ? 118 : 144, flex: "0 0 auto", background: studioTile, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {it.image && <img src={sized(it.image, 512)} alt={it.name} style={{ maxWidth: "78%", maxHeight: "86%", objectFit: "contain" }} />}
                                        </a>
                                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                                <div>
                                                    <div style={{ fontFamily: ff.serif(), fontWeight: ff.medium(), fontSize: 20, lineHeight: 1.2 }}>{it.name}</div>
                                                    <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 6 }}>
                                                        {it.colour} · {it.size}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: 15, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{formatPrice(it.price * it.qty, lang)}</div>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div style={{ display: "flex", alignItems: "center", border: `1px solid ${T.outline}`, borderRadius: 16, height: 32 }}>
                                                    <button aria-label="Fewer" onClick={() => bag.setQty(it.key, it.qty - 1)} style={{ ...plain, width: 32, height: 32 }}>
                                                        –
                                                    </button>
                                                    <span style={{ fontSize: 13, minWidth: 14, textAlign: "center" }}>{it.qty}</span>
                                                    <button aria-label="More" onClick={() => bag.setQty(it.key, it.qty + 1)} style={{ ...plain, width: 32, height: 32 }}>
                                                        +
                                                    </button>
                                                </div>
                                                <button onClick={() => bag.remove(it.key)} style={{ ...plain, fontSize: 13, color: T.inkSoft, minHeight: 44 }}>
                                                    {labels.remove}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {suggestion && (
                                <div style={{ padding: "28px 0" }}>
                                    <div style={{ fontFamily: ff.serif(), fontStyle: ff.italic(), fontSize: 19, marginBottom: 16 }}>
                                        {labels.complete}{" "}
                                        {suggestion.p.lookSlug ? (
                                            <a href={`/looks/${suggestion.p.lookSlug}`} onClick={(e) => go(`/looks/${suggestion!.p.lookSlug}`, e)} style={{ color: T.ink, textDecoration: "none", borderBottom: `1px solid ${T.outline}` }}>
                                                {suggestion.look}
                                            </a>
                                        ) : (
                                            suggestion.look
                                        )}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                        <span style={{ width: 64, height: 76, background: studioTile, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
                                            <img src={sized(suggestion.p.image, 256)} alt="" style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain" }} />
                                        </span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontFamily: ff.serif(), fontWeight: ff.medium(), fontSize: 17 }}>{suggestion.p.title}</div>
                                            <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 4 }}>
                                                {suggestion.p.colour} · {formatPrice(suggestion.p.price, lang)}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => bag.add({ slug: suggestion!.p.slug, name: suggestion!.p.title, colour: suggestion!.p.colour, size: suggestion!.size, price: suggestion!.p.price, image: suggestion!.p.image })}
                                            style={{ ...plain, border: `1px solid ${T.outline}`, borderRadius: 18, height: 36, padding: "0 14px", fontSize: 13, whiteSpace: "nowrap" }}
                                        >
                                            {labels.add} · {suggestion.size}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ borderTop: `1px solid ${T.hairline}`, padding: mobile ? "20px 20px calc(16px + env(safe-area-inset-bottom))" : "28px 36px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                <span style={{ fontFamily: ff.serif(), fontStyle: ff.italic(), fontSize: 22 }}>{labels.subtotal}</span>
                                <span style={{ fontSize: 18, fontVariantNumeric: "tabular-nums" }}>{formatPrice(subtotal, lang)}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 13, color: T.inkSoft, lineHeight: 1.45 }}>{labels.taxes}</p>
                            <button
                                onClick={checkout}
                                disabled={!items.length || busy}
                                style={{ ...plain, height: 52, background: T.ink, color: T.onInk, fontSize: 14, fontWeight: 500, letterSpacing: "0.004em", borderRadius: 2, opacity: items.length ? 1 : 0.4, cursor: items.length ? "pointer" : "default" }}
                            >
                                {busy ? labels.checkingOut : labels.checkout}
                            </button>
                            {problem && (
                                <p role="alert" style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: T.ink }}>
                                    {problem}
                                </p>
                            )}
                            <button onClick={closeBag} style={{ ...plain, fontSize: 14, color: T.inkSoft, minHeight: 44 }}>
                                {labels.continueShopping}
                            </button>
                        </div>
                    </motion.aside>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

const DEFAULT_LABELS: BagLabels = {
    title: "Your bag",
    pieces: "pieces",
    close: "Close",
    remove: "Remove",
    complete: "Complete",
    add: "Add",
    subtotal: "Subtotal",
    taxes: "Taxes included. Delivery is free and arrives in a cotton garment bag.",
    checkout: "Checkout",
    checkingOut: "Opening checkout…",
    unavailable: "Not available online in this size:",
    checkoutError: "Checkout could not open. Please try again in a moment.",
    continueShopping: "Continue shopping",
    empty: "Your bag is empty for now.",
    emptyLink: "See the collection",
}

addPropertyControls(BagButton as any, {
    label: { type: ControlType.String, title: "Label", defaultValue: "Bag", description: "Text before the count." },
    checkoutUrl: {
        type: ControlType.Link,
        title: "Checkout URL",
        description: "Only without Shopify (see the Shopify Settings card by the Home page): where Checkout sends the visitor, with the bag appended as ?items=slug:size:qty,…",
    },
    shopLink: { type: ControlType.Link, title: "Shop link", defaultValue: "/collection", description: "Shown when the bag is empty." },
    textColor: { type: ControlType.Color, title: "Text", optional: true, description: "Leave empty to follow the Ink colour style." },
    labels: {
        type: ControlType.Object,
        title: "Labels",
        description: "Every word in the bag drawer. Translate them with Framer Localization.",
        controls: Object.fromEntries(Object.entries(DEFAULT_LABELS).map(([k, v]) => [k, { type: ControlType.String, title: k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()), defaultValue: v }])) as any,
    },
})
