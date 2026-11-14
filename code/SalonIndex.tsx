// Salon Index — an invisible helper that tells the site which products make up
// which look. One "Look" row sits in each item of the hidden "Salon looks"
// list; inside that same item a nested list of the look's Shop Pieces holds one
// "Piece" row per product. Bind each property to the field in its description.
import * as React from "react"
import { useEffect, useRef } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { registerLook, registerPiece } from "./OmbrineStore.tsx"

interface SalonIndexProps {
    kind: "look" | "piece"
    code: string
    title: string
    intro: string
    image?: { src: string } | string
    order: number
    slug: string
    look: string
}

/**
 * Salon Index (invisible)
 *
 * @framerIntrinsicWidth 1
 * @framerIntrinsicHeight 1
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function SalonIndex(props: SalonIndexProps) {
    const isStatic = useIsStaticRenderer()
    const { kind = "look", code = "", title = "", intro = "", image, order = 0, slug = "", look = "" } = props
    const src = typeof image === "string" ? image : image?.src || ""
    const isLookRow = String(kind).toLowerCase() === "look"
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (isLookRow) return registerLook({ code, slug, title, intro, image: src, order: Number(order) || 0 })
        // the look's code normally arrives bound; if it does not, take it from the Look row this piece sits beside
        let lookCode = look
        for (let el = ref.current?.parentElement; !lookCode && el && el !== document.body; el = el.parentElement) {
            lookCode = el.querySelector("[data-ombrine-look]")?.getAttribute("data-ombrine-look") || ""
        }
        registerPiece({ slug, look: lookCode, order: Number(order) || 0 })
    }, [isLookRow, code, title, intro, src, order, slug, look])
    if (isStatic) return <div style={{ width: 1, height: 1, fontSize: 9, overflow: "hidden", opacity: 0.4 }}>{title || slug}</div>
    return <div ref={ref} aria-hidden data-ombrine-look={isLookRow ? code : undefined} style={{ width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }} />
}

const isLook = (p: Partial<SalonIndexProps>) => String(p.kind || "look").toLowerCase() === "look"
addPropertyControls(SalonIndex as any, {
    kind: { type: ControlType.Enum, title: "Row", options: ["look", "piece"], optionTitles: ["Look", "Piece"], defaultValue: "look", displaySegmentedControl: true },
    code: { type: ControlType.String, title: "Code", defaultValue: "", preventLocalization: true, description: "Bind to Looks → Code.", hidden: (p: any) => !isLook(p) },
    slug: { type: ControlType.String, title: "Slug", defaultValue: "", preventLocalization: true, description: "Bind to Slug (the look's, or the product's)." },
    look: { type: ControlType.String, title: "Look code", defaultValue: "", preventLocalization: true, description: "Bind to Looks → Code of the look this piece is listed in.", hidden: (p: any) => isLook(p) },
    title: { type: ControlType.String, title: "Title", defaultValue: "", description: "Bind to Looks → Title.", hidden: (p: any) => !isLook(p) },
    intro: { type: ControlType.String, title: "Intro", defaultValue: "", description: "Bind to Looks → Intro.", hidden: (p: any) => !isLook(p) },
    image: { type: ControlType.ResponsiveImage, title: "Image", description: "Bind to Looks → Image (transparent PNG cut-out).", hidden: (p: any) => !isLook(p) },
    order: { type: ControlType.Number, title: "Order", defaultValue: 0, description: "Look: bind to Order. Piece: bind to the list's Item Index." },
})
