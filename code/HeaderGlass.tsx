// Header glass — sits behind the header content. After 80 px of scroll it fades
// in the Glass colour style with a 24 px background blur and a hairline, the
// way the "Scrolled" header is drawn. Lives inside the Header component.
import * as React from "react"
import { useEffect, useState } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { T } from "./OmbrineStore.tsx"

interface HeaderGlassProps {
    threshold: number
    style?: React.CSSProperties
}

/**
 * Header glass
 *
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 92
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function HeaderGlass(props: HeaderGlassProps) {
    const { threshold = 80, style } = props
    const isStatic = useIsStaticRenderer()
    const [on, setOn] = useState(false)
    useEffect(() => {
        if (isStatic) return
        const f = () => setOn(window.scrollY > threshold)
        f()
        window.addEventListener("scroll", f, { passive: true })
        return () => window.removeEventListener("scroll", f)
    }, [isStatic, threshold])
    return (
        <div
            aria-hidden
            style={{
                ...style,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                backgroundColor: T.glass,
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: `inset 0 -1px 0 ${T.hairline}`,
                opacity: on ? 1 : 0,
                transition: "opacity .5s cubic-bezier(.22,1,.36,1)",
            }}
        />
    )
}

addPropertyControls(HeaderGlass as any, {
    threshold: { type: ControlType.Number, title: "Show after", defaultValue: 80, min: 0, max: 600, unit: "px", description: "Scroll distance before the glass appears." },
})
