// Reveal — the house appear motion, taken from the Salon hero: content
// develops out of blur as it comes into view, on the house easing.
// Layers that enter the view together reveal one after another, in page order.
// After a page change it waits (briefly) for the curtain of Page Transition.
// Fail-safe: whatever happens, a layer is never left hidden.
import * as React from "react"
import { useState, useRef, useEffect, useCallback, type ComponentType } from "react"
import { useIsStaticRenderer, RenderTarget } from "framer"

const EASE = [0.22, 1, 0.36, 1]

// layers entering within the same moment form one batch and stagger in order
let batchStart = 0
let batchCount = 0
function nextStagger(step: number) {
    const now = performance.now()
    if (now - batchStart > 140) {
        batchStart = now
        batchCount = 0
    }
    return Math.min(batchCount++, 6) * step
}
// ms until the page curtain is out of the way (set by Page Transition), never more than 1.2 s
function curtainWait() {
    const at = (window as any).__ombrineRevealAt || 0
    return Math.min(1200, Math.max(0, at - performance.now()))
}
function reducedMotion() {
    return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
}

function makeReveal(hidden: Record<string, any>, shown: Record<string, any>, duration: number) {
    return (Component: ComponentType<any>): ComponentType<any> => {
        return function Revealed(props: any) {
            const [isShown, setShown] = useState(false)
            const delay = useRef(0)
            const started = useRef(false)
            const timers = useRef<number[]>([])
            const io = useRef<IntersectionObserver | null>(null)

            const start = useCallback(() => {
                if (started.current) return
                started.current = true
                io.current?.disconnect()
                delay.current = nextStagger(0.07)
                timers.current.push(window.setTimeout(() => setShown(true), curtainWait()))
            }, [])

            // our own observer on the rendered element (any pixel in view counts)
            const elRef = useRef<Element | null>(null)
            const outerRef = props.ref
            const ref = useCallback(
                (el: Element | null) => {
                    elRef.current = el
                    if (typeof outerRef === "function") outerRef(el)
                    else if (outerRef && typeof outerRef === "object") outerRef.current = el
                    io.current?.disconnect()
                    io.current = null
                    if (!el || started.current || typeof IntersectionObserver === "undefined") return
                    io.current = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && start(), { rootMargin: "0px 0px -6% 0px" })
                    io.current.observe(el)
                },
                [start, outerRef]
            )

            useEffect(() => {
                // fail-safe: never leave a layer hidden
                timers.current.push(
                    window.setTimeout(() => {
                        if (started.current) return
                        const el = elRef.current
                        if (!el) return setShown(true) // could not observe: just show it
                        const r = el.getBoundingClientRect()
                        if (r.bottom > 0 && r.top < window.innerHeight) start() // on screen but missed
                    }, 2500)
                )
                return () => {
                    timers.current.forEach((t) => window.clearTimeout(t))
                    io.current?.disconnect()
                }
            }, [])

            // canvas, thumbnails and exports always show the finished layout
            const isStatic = useIsStaticRenderer() || RenderTarget.current() !== RenderTarget.preview
            if (isStatic) return <Component {...props} />
            const reduced = reducedMotion()
            const from = reduced ? { opacity: 0 } : hidden
            const to = reduced ? { opacity: 1 } : shown
            return (
                <Component
                    {...props}
                    ref={ref}
                    initial={from}
                    animate={isShown ? to : from}
                    transition={{ duration: reduced ? 0.4 : duration, ease: EASE, delay: isShown ? delay.current : 0 }}
                    viewport={{ once: true, amount: "some" }}
                    onViewportEnter={start}
                />
            )
        }
    }
}

const textReveal = makeReveal({ opacity: 0, y: 20, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)" }, 0.9)
const imageReveal = makeReveal({ opacity: 0, scale: 1.03, filter: "blur(14px)" }, { opacity: 1, scale: 1, filter: "blur(0px)" }, 1.1)

/** Text, buttons, cards: rise 20 px out of an 8 px blur. */
export function withReveal(Component: ComponentType<any>): ComponentType<any> {
    return textReveal(Component)
}

/** Images: develop out of a 14 px blur and settle into place. */
export function withRevealImage(Component: ComponentType<any>): ComponentType<any> {
    return imageReveal(Component)
}
