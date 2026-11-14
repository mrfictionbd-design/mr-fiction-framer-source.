// Shop field — one line of text that Shopify holds and the CMS does not: the
// product's colour, its short line, where it is made, and so on (the custom.*
// metafields). Bind "Slug" to the product's slug and pick the field. When the
// product has no value for it, nothing is shown.
import * as React from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { T, ff, useLive } from "./OmbrineStore.tsx"

type Field = "colour" | "swatch" | "colourAndSwatch" | "shortLine" | "composition" | "care" | "madeIn"
interface ShopFieldProps {
    slug: string
    field: Field
    look: "body" | "caption"
    color?: string
    sample: string
    style?: React.CSSProperties
}

/**
 * Shop field
 *
 * @framerIntrinsicWidth 80
 * @framerIntrinsicHeight 19
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function ShopField(props: ShopFieldProps) {
    const { slug = "", field = "colour", look = "body", color, sample = "", style } = props
    const isStatic = useIsStaticRenderer()
    const live = useLive(slug)
    const meta = live?.meta
    const withSwatch = field === "swatch" || field === "colourAndSwatch"
    const key = withSwatch ? "colour" : field
    // on the canvas there is no shop to ask, so the sample stands in
    const text = field === "swatch" ? "" : (meta && (meta as any)[key]) || (isStatic ? sample : "")
    const hex = withSwatch ? meta?.colourHex || (isStatic ? "#B0875F" : "") : ""
    const fixedWidth = style?.width === "100%"
    if (!text && !hex) return <span aria-hidden style={{ ...style, display: "block", width: fixedWidth ? "100%" : 0, height: 0 }} />
    return (
        <span
            style={{
                ...style,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                width: fixedWidth ? "100%" : "max-content",
                maxWidth: "100%",
                fontFamily: ff.sans(),
                fontSize: look === "caption" ? 12 : 13,
                lineHeight: look === "caption" ? 1.3 : 1.45,
                letterSpacing: look === "caption" ? "0.006em" : "0.002em",
                color: color || T.inkSoft,
                whiteSpace: fixedWidth ? "normal" : "nowrap",
            }}
        >
            {hex && <span aria-hidden style={{ width: 12, height: 12, borderRadius: 6, background: hex, flex: "0 0 auto" }} />}
            {text}
        </span>
    )
}

addPropertyControls(ShopField as any, {
    slug: { type: ControlType.String, title: "Slug", defaultValue: "", preventLocalization: true, description: "Bind to the product's Slug." },
    field: {
        type: ControlType.Enum,
        title: "Field",
        options: ["colour", "colourAndSwatch", "swatch", "shortLine", "composition", "care", "madeIn"],
        optionTitles: ["Colour", "Colour with swatch", "Swatch only", "Short line", "Composition", "Care", "Made in"],
        defaultValue: "colour",
        description: "A Shopify product metafield (custom.colour, custom.colour_hex, custom.short_line, custom.composition, custom.care, custom.made_in).",
    },
    look: { type: ControlType.Enum, title: "Text", options: ["body", "caption"], optionTitles: ["Body S", "Caption"], defaultValue: "body", displaySegmentedControl: true },
    color: { type: ControlType.Color, title: "Colour", optional: true, description: "Leave empty to follow the Ink Soft colour style." },
    sample: { type: ControlType.String, title: "Canvas sample", defaultValue: "", description: "Shown on the canvas only, where there is no shop to ask." },
})
