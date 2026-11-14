// Language menu — switches Framer locales. Languages are listed by their own names.
// Add the locales in Framer (Site Settings → Localization) and they appear here.
import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import * as Framer from "framer"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion, AnimatePresence } from "framer-motion"
import { T, ff, useLang } from "./OmbrineStore.tsx"

const LANGS = [
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
    { code: "ru", name: "Русский" },
    { code: "zh", name: "中文" },
    { code: "ar", name: "العربية" },
]

interface LanguageMenuProps {
    layout: "dropdown" | "row"
    title: string
    textColor: string
    style?: React.CSSProperties
}

function useLocales() {
    const info = ((Framer as any).useLocaleInfo || (() => null))()
    const active: string = (info?.activeLocale?.code || "en").slice(0, 2).toLowerCase()
    const pick = (code: string) => {
        const list: any[] = info?.locales || []
        const loc = list.find((l) => String(l.code || "").toLowerCase().startsWith(code))
        if (loc && info?.setLocale) info.setLocale(loc)
    }
    return { active, pick }
}

const plain: React.CSSProperties = { appearance: "none", background: "none", border: "none", padding: 0, margin: 0, font: "inherit", color: "inherit", cursor: "pointer" }

function Rows({ active, onPick }: { active: string; onPick: (c: string) => void }) {
    return (
        <div role="listbox">
            {LANGS.map((l, i) => (
                <motion.button
                    key={l.code}
                    role="option"
                    aria-selected={l.code === active}
                    lang={l.code}
                    onClick={() => onPick(l.code)}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 + i * 0.03 }}
                    style={{ ...plain, width: "100%", minHeight: 38, display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${T.hairline}`, fontFamily: l.code === "zh" ? `"Noto Sans SC", sans-serif` : l.code === "ar" ? `"Readex Pro", sans-serif` : `"Manrope", sans-serif`, fontSize: 15 }}
                >
                    <span dir="auto">{l.name}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: T.inkSoft, fontFamily: `"Manrope", sans-serif` }}>
                        {l.code.toUpperCase()}
                        <span aria-hidden style={{ width: 5, height: 5, borderRadius: 3, background: l.code === active ? T.oxblood : "transparent" }} />
                    </span>
                </motion.button>
            ))}
        </div>
    )
}

/**
 * Language menu
 *
 * @framerIntrinsicWidth 40
 * @framerIntrinsicHeight 22
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function LanguageMenu(props: LanguageMenuProps) {
    const { layout = "dropdown", title = "Language", textColor, style } = props
    const isStatic = useIsStaticRenderer()
    const lang = useLang()
    const { active, pick } = useLocales()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLButtonElement>(null)
    const [rect, setRect] = useState<DOMRect | null>(null)
    const color = textColor || T.ink

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
        const onResize = () => ref.current && setRect(ref.current.getBoundingClientRect())
        window.addEventListener("keydown", onKey)
        window.addEventListener("resize", onResize)
        return () => {
            window.removeEventListener("keydown", onKey)
            window.removeEventListener("resize", onResize)
        }
    }, [open])

    const choose = (c: string) => {
        pick(c)
        if (layout === "dropdown") setTimeout(() => setOpen(false), 250)
    }
    const current = LANGS.find((l) => l.code === active) || LANGS[0]

    if (layout === "row") {
        return (
            <div style={{ ...style, width: "100%", color }}>
                <button onClick={() => setOpen((o) => !o)} aria-expanded={open} style={{ ...plain, width: "100%", minHeight: 44, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: ff.serif(), fontStyle: ff.italic(), fontSize: 24 }}>{title}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: T.inkSoft }}>
                        {current.name}
                        <svg width="7" height="11" viewBox="0 0 7 11" aria-hidden style={{ transform: `rotate(${open ? 90 : 0}deg)`, transition: "transform .3s" }}>
                            <path d="M1 1l4.5 4.5L1 10" stroke="currentColor" fill="none" strokeWidth="1.2" />
                        </svg>
                    </span>
                </button>
                <AnimatePresence initial={false}>
                    {open && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: "hidden" }}>
                            <Rows active={active} onPick={choose} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    return (
        <>
            <button
                ref={ref}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={`${title}: ${current.name}`}
                onClick={() => {
                    if (ref.current) setRect(ref.current.getBoundingClientRect())
                    setOpen((o) => !o)
                }}
                style={{ ...style, ...plain, display: "flex", alignItems: "center", gap: 6, padding: "4px 0", color, fontFamily: `"Manrope", sans-serif`, fontSize: 14, letterSpacing: "0.002em", lineHeight: 1, whiteSpace: "nowrap", borderBottom: `1px solid ${open ? color : "transparent"}`, transition: "border-color .3s" }}
            >
                {current.code.toUpperCase()}
                <svg width="9" height="6" viewBox="0 0 9 6" aria-hidden style={{ transform: `rotate(${open ? 180 : 0}deg)`, transition: "transform .3s" }}>
                    <path d="M1 1l3.5 3.5L8 1" stroke="currentColor" fill="none" strokeWidth="1.1" />
                </svg>
            </button>
            {!isStatic &&
                typeof document !== "undefined" &&
                createPortal(
                    <AnimatePresence>
                        {open && rect && (
                            <motion.div key="lang" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} style={{ position: "fixed", inset: 0, zIndex: 1000 }}>
                                <div onClick={() => setOpen(false)} style={{ position: "absolute", inset: 0, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", background: `color-mix(in srgb, ${T.ground} 30%, transparent)` }} />
                                <motion.div
                                    role="dialog"
                                    aria-label={title}
                                    initial={{ y: -8, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -8, opacity: 0 }}
                                    transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                                    style={{
                                        position: "absolute",
                                        top: rect.bottom + 14,
                                        left: Math.max(16, Math.min(window.innerWidth - 316, rect.left + rect.width / 2 - 150)),
                                        width: 300,
                                        boxSizing: "border-box",
                                        padding: "22px 24px",
                                        background: T.glass,
                                        backdropFilter: "blur(24px)",
                                        WebkitBackdropFilter: "blur(24px)",
                                        border: `1px solid color-mix(in srgb, ${T.surface} 70%, transparent)`,
                                        borderRadius: 4,
                                        boxShadow: "0 30px 40px rgba(22,19,15,0.12)",
                                        color: T.ink,
                                        fontFamily: `"Manrope", sans-serif`,
                                    }}
                                >
                                    <div style={{ fontFamily: ff.serif(), fontStyle: ff.italic(), fontSize: 22, marginBottom: 14 }}>{title}</div>
                                    <Rows active={active} onPick={choose} />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
            {void lang}
        </>
    )
}

addPropertyControls(LanguageMenu as any, {
    layout: { type: ControlType.Enum, title: "Layout", options: ["dropdown", "row"], optionTitles: ["Dropdown", "Row (mobile menu)"], defaultValue: "dropdown", displaySegmentedControl: true, description: "Dropdown for the desktop header, Row inside the mobile menu." },
    title: { type: ControlType.String, title: "Title", defaultValue: "Language", description: "Heading of the menu." },
    textColor: { type: ControlType.Color, title: "Text", optional: true, description: "Leave empty to follow the Ink colour style." },
})
