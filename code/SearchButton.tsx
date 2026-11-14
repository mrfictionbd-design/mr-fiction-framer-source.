// Search — the header trigger and the full-screen search overlay.
// Searches the Products CMS only (through the hidden Product Index list in the
// layout). The "/" key opens it from anywhere.
import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion, AnimatePresence } from "framer-motion"
import { T, ff, fontLink, studioTile, useUI, useProducts, openSearch, closeSearch, useLang, formatPrice, useNavigate } from "./OmbrineStore.tsx"

interface SearchLabels {
    placeholder: string
    clear: string
    pieces: string
    noResults: string
}
interface SearchButtonProps {
    label: string
    closeLabel: string
    size: "nav" | "menu"
    suggestions: string[]
    labels: SearchLabels
    textColor?: string
    style?: React.CSSProperties
}

const plain: React.CSSProperties = { appearance: "none", background: "none", border: "none", padding: 0, margin: 0, font: "inherit", color: "inherit", cursor: "pointer" }
const sized = (url: string, px: number) => (url && url.includes("framerusercontent.com/images/") && !url.includes("?") ? `${url}?scale-down-to=${px}` : url)

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

/**
 * Search
 *
 * @framerIntrinsicWidth 46
 * @framerIntrinsicHeight 14
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function SearchButton(props: SearchButtonProps) {
    const { label = "Search", closeLabel = "Close", size = "nav", suggestions = ["cashmere", "loafer", "wide trousers"], textColor, style } = props
    const labels: SearchLabels = { ...DEFAULT_LABELS, ...(props.labels || {}) }
    const isStatic = useIsStaticRenderer()
    const ui = useUI()
    const owner = useIsOwner()
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    useEffect(() => {
        if (isStatic || !owner) return
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement
            const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
            if (e.key === "/" && !typing) {
                e.preventDefault()
                openSearch()
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [isStatic, owner])
    const color = textColor || T.ink
    const open = !isStatic && ui.searchOpen
    return (
        <>
            <button
                onClick={() => (open ? closeSearch() : openSearch())}
                aria-expanded={open}
                style={{
                    ...style,
                    ...plain,
                    color,
                    fontFamily: `"Manrope", sans-serif`,
                    fontSize: size === "menu" ? 16 : 14,
                    letterSpacing: "0.002em",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    minHeight: size === "menu" ? 32 : undefined,
                    textAlign: "left",
                }}
            >
                {open && size === "nav" ? closeLabel : label}
            </button>
            {!isStatic && mounted && owner && createPortal(<Overlay open={ui.searchOpen} labels={labels} suggestions={suggestions} />, document.body)}
        </>
    )
}

function Overlay({ open, labels, suggestions }: { open: boolean; labels: SearchLabels; suggestions: string[] }) {
    const products = useProducts()
    const lang = useLang()
    const navigate = useNavigate()
    const [q, setQ] = useState("")
    const input = useRef<HTMLInputElement>(null)
    const [mobile, setMobile] = useState(false)
    useEffect(() => {
        const m = () => setMobile(window.innerWidth < 810)
        m()
        window.addEventListener("resize", m)
        return () => window.removeEventListener("resize", m)
    }, [])
    useEffect(() => {
        if (!open) return
        const t = setTimeout(() => input.current?.focus(), 350)
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeSearch()
        window.addEventListener("keydown", onKey)
        return () => {
            clearTimeout(t)
            window.removeEventListener("keydown", onKey)
        }
    }, [open])
    const results = useMemo(() => {
        const s = q.trim().toLowerCase()
        if (!s) return []
        const words = s.split(/\s+/)
        return products
            .filter((p) => {
                const hay = `${p.title} ${p.colour} ${p.category} ${p.short} ${p.look}`.toLowerCase()
                return words.every((w) => hay.includes(w) || (w.endsWith("s") && hay.includes(w.slice(0, -1))))
            })
            .slice(0, 8)
    }, [q, products])
    const go = (slug: string, e: any) => {
        closeSearch()
        navigate(`/products/${slug}`, e)
    }
    const top = mobile ? 64 : 92
    const pad = mobile ? 20 : 40
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="search"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Search"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        position: "fixed",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        top,
                        zIndex: 900,
                        background: `color-mix(in srgb, ${T.ground} 96%, transparent)`,
                        backdropFilter: "blur(40px)",
                        WebkitBackdropFilter: "blur(40px)",
                        overflowY: "auto",
                        color: T.ink,
                        fontFamily: ff.sans(),
                    }}
                >
                    {fontLink(lang)}
                    <div style={{ maxWidth: 1440, margin: "0 auto", padding: `${mobile ? 24 : 56}px ${pad}px 80px`, boxSizing: "border-box" }}>
                        <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} style={{ display: "flex", alignItems: "flex-end", gap: 16, borderBottom: `1px solid ${T.ink}`, paddingBottom: mobile ? 12 : 22 }}>
                            <input
                                ref={input}
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder={labels.placeholder}
                                aria-label={labels.placeholder}
                                dir="auto"
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    border: "none",
                                    outline: "none",
                                    background: "transparent",
                                    color: T.ink,
                                    fontFamily: ff.serif(),
                                    fontStyle: ff.italic(),
                                    fontWeight: ff.light(),
                                    fontSize: mobile ? 48 : 96,
                                    lineHeight: 1.1,
                                    padding: 0,
                                    caretColor: T.ink,
                                }}
                            />
                            {q && (
                                <button onClick={() => (setQ(""), input.current?.focus())} style={{ ...plain, fontSize: 14, color: T.inkSoft, marginBottom: 12 }}>
                                    {labels.clear}
                                </button>
                            )}
                        </motion.div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, margin: mobile ? "20px 0 28px" : "48px 0 64px" }}>
                            <span style={{ fontSize: 14 }}>{q ? (results.length ? `${results.length} ${labels.pieces}` : labels.noResults) : " "}</span>
                            <div style={{ display: "flex", gap: 8, flexWrap: mobile ? "nowrap" : "wrap", overflowX: mobile ? "auto" : undefined }}>
                                {suggestions.map((s) => (
                                    <button key={s} onClick={() => setQ(s)} style={{ ...plain, height: 34, padding: "0 13px", border: `1px solid ${T.outline}`, borderRadius: 17, fontSize: 14, whiteSpace: "nowrap", background: q === s ? T.ink : "transparent", color: q === s ? T.onInk : T.ink }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: `repeat(${mobile ? 2 : 4}, minmax(0, 1fr))`, gap: mobile ? "24px 10px" : "36px 16px" }}>
                            <AnimatePresence>
                                {results.map((p, i) => (
                                    <motion.a
                                        key={p.slug}
                                        href={`/products/${p.slug}`}
                                        onClick={(e) => go(p.slug, e)}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                                        style={{ color: T.ink, textDecoration: "none", display: "flex", flexDirection: "column", gap: 12 }}
                                    >
                                        <span style={{ aspectRatio: "328 / 420", background: studioTile, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <img src={sized(p.image, 768)} alt={p.title} style={{ maxWidth: "70%", maxHeight: "80%", objectFit: "contain" }} />
                                        </span>
                                        <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                            <span>
                                                <span style={{ display: "block", fontFamily: ff.serif(), fontWeight: ff.medium(), fontSize: mobile ? 16 : 20, lineHeight: 1.2 }}>{p.title}</span>
                                                <span style={{ display: "block", fontSize: 13, color: T.inkSoft, marginTop: 4 }}>{p.colour}</span>
                                            </span>
                                            <span style={{ fontSize: 15, whiteSpace: "nowrap" }}>{formatPrice(p.price, lang)}</span>
                                        </span>
                                    </motion.a>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

const DEFAULT_LABELS: SearchLabels = {
    placeholder: "Search the collection",
    clear: "Clear",
    pieces: "pieces",
    noResults: "Nothing yet — try another word.",
}

addPropertyControls(SearchButton as any, {
    label: { type: ControlType.String, title: "Label", defaultValue: "Search", description: "Header label." },
    closeLabel: { type: ControlType.String, title: "Close label", defaultValue: "Close", description: "Shown in the header while search is open." },
    size: { type: ControlType.Enum, title: "Size", options: ["nav", "menu"], optionTitles: ["Header", "Mobile menu"], defaultValue: "nav", displaySegmentedControl: true },
    suggestions: { type: ControlType.Array, title: "Suggestions", control: { type: ControlType.String }, defaultValue: ["cashmere", "loafer", "wide trousers"], maxCount: 4, description: "Chips that fill the search with one tap." },
    textColor: { type: ControlType.Color, title: "Text", optional: true, description: "Leave empty to follow the Ink colour style." },
    labels: {
        type: ControlType.Object,
        title: "Labels",
        controls: Object.fromEntries(Object.entries(DEFAULT_LABELS).map(([k, v]) => [k, { type: ControlType.String, title: k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()), defaultValue: v }])) as any,
    },
})
