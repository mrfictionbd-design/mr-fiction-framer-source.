// Ombrine overrides.
// withScrolledHeader: put on the Header instance in the layout. After 80 px of
// scroll the header turns to glass (Glass colour style + 24 px background blur
// and a hairline), the way the "Scrolled" variant is drawn.
import * as React from "react"
import { useEffect, useState } from "react"
import type { ComponentType } from "react"

const GLASS = "var(--token-5110053d-cf94-4e11-8a73-dece4e5d1c6a, rgba(255,255,255,0.55))"
const HAIRLINE = "var(--token-a3696bf5-592b-4330-9d03-b84ba65572bd, rgba(22,19,15,0.12))"

export function withScrolledHeader(Component: ComponentType<any>): ComponentType<any> {
    return (props: any) => {
        const [scrolled, setScrolled] = useState(false)
        useEffect(() => {
            const on = () => setScrolled(window.scrollY > 80)
            on()
            window.addEventListener("scroll", on, { passive: true })
            return () => window.removeEventListener("scroll", on)
        }, [])
        return (
            <div
                style={{
                    width: "100%",
                    backgroundColor: scrolled ? GLASS : "transparent",
                    backdropFilter: scrolled ? "blur(24px)" : "none",
                    WebkitBackdropFilter: scrolled ? "blur(24px)" : "none",
                    boxShadow: scrolled ? `inset 0 -1px 0 ${HAIRLINE}` : "none",
                    transition: "background-color .5s cubic-bezier(.22,1,.36,1), box-shadow .5s",
                }}
            >
                <Component {...props} />
            </div>
        )
    }
}
