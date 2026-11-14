// Page Transition — a curtain between pages. On an internal link click the
// curtain rises from the floor in the ground colour (a plain shape, no name),
// the router changes page underneath, and the curtain lifts off the top.
// Place one on every page (it is in the Main layout, Home and 404).
import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import * as Framer from "framer"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { T, useNavigate, prefersReducedMotion } from "./OmbrineStore.tsx"

interface PageTransitionProps {
    effect: "curtain" | "fade"
    color?: string
    duration: number
    onFirstLoad: boolean
}

// survives the page change, so the next page's instance mounts covered
const shared = { covering: false, firstDone: false }
// the anchor whose click we re-send to Framer once the curtain is down
let passThrough: Element | null = null

// Site-wide scrollbars (this component is on every page): the page's own bar is
// thin and in the house ink; every inner scroller (chip rows, drawers) shows none.
const SCROLLBAR_CSS = `
html{scrollbar-width:thin;scrollbar-color:rgba(22,19,15,.28) transparent}
html[data-ombrine-theme="dark"]{scrollbar-color:rgba(240,235,224,.28) transparent}
@media (prefers-color-scheme:dark){html:not([data-ombrine-theme="light"]){scrollbar-color:rgba(240,235,224,.28) transparent}}
body *{scrollbar-width:none;-ms-overflow-style:none}
body *::-webkit-scrollbar{display:none;width:0;height:0}
[data-framercommerce-widget]{display:none !important}
/* Arabic keeps the English layout (also in Preview, where the site's custom code may not run): nothing is mirrored, words still read right to left inside each text box. */
html[dir="rtl"],html[dir="rtl"] body,[dir="rtl"]:not(.framer-text){direction:ltr !important}
html[lang|="ar"] .framer-text,html[lang|="ar"] input,html[lang|="ar"] textarea{unicode-bidi:plaintext}
`

type Phase = "idle" | "cover" | "covered" | "reveal"

/**
 * Page Transition (invisible until a link is clicked)
 *
 * @framerIntrinsicWidth 1
 * @framerIntrinsicHeight 1
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function PageTransition(props: PageTransitionProps) {
    const { effect: kind = "curtain", color, duration = 0.7, onFirstLoad = false } = props
    const isStatic = useIsStaticRenderer()
    const navigate = useNavigate()
    const navRef = useRef(navigate)
    navRef.current = navigate
    // the current route, to notice a page change when this instance outlives it
    const router = ((Framer as any).useRouter || (() => undefined))()
    const routeKey = `${router?.currentRouteId ?? ""}|${JSON.stringify(router?.currentPathVariables ?? {})}`
    const routeRef = useRef(routeKey)
    routeRef.current = routeKey
    const startCovered = !isStatic && (shared.covering || (onFirstLoad && !shared.firstDone))
    const [phase, setPhase] = useState<Phase>(startCovered ? "covered" : "idle")
    const phaseRef = useRef(phase)
    phaseRef.current = phase
    const [mounted, setMounted] = useState(false)
    const reduced = typeof window !== "undefined" && prefersReducedMotion()
    const dur = Math.max(0.2, duration) * (reduced ? 0.5 : 1)

    // reveal once the new page has painted
    const reveal = () => {
        if (phaseRef.current !== "covered") return
        phaseRef.current = "reveal"
        let n = 0
        const tick = () => {
            if (++n < 3) return requestAnimationFrame(tick)
            window.setTimeout(() => {
                shared.covering = false
                ;(window as any).__ombrineRevealAt = performance.now() + dur * 1000 * 0.3
                setPhase("reveal")
                window.setTimeout(() => setPhase((p) => (p === "reveal" ? "idle" : p)), dur * 1000 + 50)
            }, 120)
        }
        requestAnimationFrame(tick)
    }

    useEffect(() => {
        if (isStatic) return
        setMounted(true)
        shared.firstDone = true
        if (startCovered) reveal()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic])

    // intercept internal link clicks
    useEffect(() => {
        if (isStatic) return
        let alive = true
        const onClick = (e: MouseEvent) => {
            const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null
            // our own re-sent click: hand it to Framer's link untouched
            if (a && passThrough === a) {
                passThrough = null
                return
            }
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
            if (phaseRef.current !== "idle") return
            if (!a || a.hasAttribute("download") || (a.target && a.target !== "_self")) return
            const raw = a.getAttribute("href") || ""
            if (!raw || raw.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(raw)) return
            let url: URL
            try {
                url = new URL(a.href, window.location.href)
            } catch (err) {
                return
            }
            if (url.origin !== window.location.origin) return
            const strip = (p: string) => p.replace(/\/+$/, "") || "/"
            if (strip(url.pathname) === strip(window.location.pathname)) return // same page: section links stay Framer's
            e.preventDefault()
            e.stopPropagation()
            shared.covering = true
            // page reveals hold until the curtain lifts (see Reveal.tsx)
            ;(window as any).__ombrineRevealAt = performance.now() + 60000
            setPhase("cover")
            window.setTimeout(() => {
                if (!alive) return
                phaseRef.current = "covered"
                setPhase("covered")
                const hrefBefore = window.location.href
                const routeBefore = routeRef.current
                // Framer's own link does the navigation, so it works the same in Preview and live
                if (a.isConnected) {
                    passThrough = a
                    a.click()
                    passThrough = null
                } else navRef.current(url.pathname + url.hash)
                // a new page's instance reveals itself on mount; if this one stays, it reveals on the change
                const t0 = performance.now()
                const watch = () => {
                    if (!alive) return
                    if (window.location.href !== hrefBefore || routeRef.current !== routeBefore || performance.now() - t0 > 1500) return reveal()
                    requestAnimationFrame(watch)
                }
                requestAnimationFrame(watch)
            }, dur * 1000)
        }
        document.addEventListener("click", onClick, true)
        return () => {
            alive = false
            document.removeEventListener("click", onClick, true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, dur])

    if (isStatic) return <div aria-hidden style={{ width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />

    const fill = color || T.ground
    const inOut = "cubic-bezier(0.65, 0, 0.35, 1)"
    const out = "cubic-bezier(0.22, 1, 0.36, 1)"
    const curtain = kind === "curtain" && !reduced
    // curtain: rises from the floor, leaves through the ceiling
    const clip = !curtain ? "inset(0 0 0 0)" : phase === "idle" ? "inset(100% 0 0 0)" : phase === "reveal" ? "inset(0 0 100% 0)" : "inset(0 0 0 0)"
    const opacity = curtain ? (phase === "idle" ? 0 : 1) : phase === "cover" || phase === "covered" ? 1 : 0
    const moving = phase === "cover" || phase === "reveal"
    const transition = moving ? (curtain ? `clip-path ${dur}s ${phase === "cover" ? inOut : out}` : `opacity ${dur}s ${inOut}`) : "none"

    const overlay = (
        <div
            aria-hidden
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483000,
                background: fill,
                clipPath: clip,
                WebkitClipPath: clip,
                opacity,
                transition,
                pointerEvents: phase === "idle" ? "none" : "auto",
            }}
        >
        </div>
    )
    return (
        <div aria-hidden style={{ width: 1, height: 1, opacity: 0, pointerEvents: "none" }}>
            <style dangerouslySetInnerHTML={{ __html: SCROLLBAR_CSS }} />
            {(mounted || startCovered) && typeof document !== "undefined" ? createPortal(overlay, document.body) : null}
        </div>
    )
}

addPropertyControls(PageTransition as any, {
    effect: { type: ControlType.Enum, title: "Style", options: ["curtain", "fade"], optionTitles: ["Curtain", "Fade"], defaultValue: "curtain", displaySegmentedControl: true },
    duration: { type: ControlType.Number, title: "Duration", defaultValue: 0.7, min: 0.3, max: 1.6, step: 0.05, unit: "s", description: "Each half: cover, then reveal." },
    color: { type: ControlType.Color, title: "Colour", optional: true, description: "Empty follows the site ground colour, light or dark." },
    onFirstLoad: { type: ControlType.Boolean, title: "On first load", defaultValue: false, description: "Also lift the curtain when the site first opens." },
})
