// Product care — the "Composition and care" row of the product page, drawn like
// the Detail Row component (title, +/−, two lines), with its two lines taken
// from the Shopify product's custom.composition and custom.care metafields.
// A product with neither shows no row at all. Bind "Slug" to the product slug.
import * as React from "react"
import { useState } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { T, FONT, useLive } from "./OmbrineStore.tsx"

interface ProductCareProps {
    slug: string
    title: string
    open: boolean
    style?: React.CSSProperties
}

/**
 * Product care
 *
 * @framerIntrinsicWidth 432
 * @framerIntrinsicHeight 70
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ProductCare(props: ProductCareProps) {
    const { slug = "", title = "Composition and care", open: startOpen = false, style } = props
    const isStatic = useIsStaticRenderer()
    const meta = useLive(slug)?.meta
    const [open, setOpen] = useState(startOpen)
    const first = meta?.composition || (isStatic ? "90% virgin wool, 10% cashmere" : "")
    const second = meta?.care || (isStatic ? "Dry clean only. Hang on a wide shoulder." : "")
    if (!first && !second) return <div aria-hidden style={{ ...style, width: "100%", height: 0 }} />
    const body: React.CSSProperties = { margin: 0, fontFamily: FONT.sans, fontSize: 13, lineHeight: 1.45, letterSpacing: "0.002em", color: T.inkSoft }
    return (
        <div style={{ ...style, width: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 14, padding: "22px 0 26px", borderBottom: `1px solid ${T.hairline}` }}>
            <button
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                style={{ appearance: "none", background: "none", border: "none", padding: 0, margin: 0, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", color: T.ink, textAlign: "start" }}
            >
                <span style={{ fontFamily: FONT.serif, fontStyle: "italic", fontWeight: 400, fontSize: 18, lineHeight: 1.4, letterSpacing: "-0.02em" }}>{title}</span>
                <span aria-hidden style={{ fontFamily: FONT.sans, fontSize: 14, lineHeight: 1 }}>
                    {open ? "−" : "+"}
                </span>
            </button>
            {open && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {first && <p style={body}>{first}</p>}
                    {second && <p style={body}>{second}</p>}
                </div>
            )}
        </div>
    )
}

addPropertyControls(ProductCare as any, {
    slug: { type: ControlType.String, title: "Slug", defaultValue: "", preventLocalization: true, description: "Bind to the product's Slug." },
    title: { type: ControlType.String, title: "Title", defaultValue: "Composition and care" },
    open: { type: ControlType.Boolean, title: "Open", defaultValue: false, description: "Start open." },
})
