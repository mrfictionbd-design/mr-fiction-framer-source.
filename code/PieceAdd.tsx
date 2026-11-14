// Piece add — "Add · 38" under each piece on the Look page. Adds that one piece
// in the size chosen above (shared with Look purchase by pieces that have the
// same size run) and opens the bag. Sizes and stock come from Shopify through
// the slug.
import * as React from "react"
import { useState } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { T, ff, bag, openBag, useLookSizes, useLive, useProduct, useShop, optionValues, livePrice, liveSold, liveSizes, liveMissing } from "./OmbrineStore.tsx"

interface PieceAddProps {
    slug: string
    name: string
    price: number
    image?: { src: string } | string
    addLabel: string
    addedLabel: string
    soldOutLabel: string
    style?: React.CSSProperties
}

/**
 * Piece add
 *
 * @framerIntrinsicWidth 70
 * @framerIntrinsicHeight 20
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function PieceAdd(props: PieceAddProps) {
    const { slug = "", name = "Piece", price: cmsPrice = 0, image, addLabel = "Add", addedLabel = "Added", soldOutLabel = "Sold out in", style } = props
    const isStatic = useIsStaticRenderer()
    const chosen = useLookSizes()
    const [added, setAdded] = useState("")
    const live = useLive(slug)
    const row = useProduct(slug)
    const shop = useShop()
    const price = livePrice(live, cmsPrice)
    const own = liveSizes(live, optionValues(row?.options || "", shop.sizeOption || "Size"))
    const sold = liveSold(live, own, [])
    const avail = own.filter((s) => !sold.includes(s))
    const pick = chosen[own.join(",") || "Size"]
    const size = pick && own.includes(pick) ? pick : avail[Math.floor((avail.length - 1) / 2)] || own[0] || ""
    const isSold = liveMissing(live) || (!!size && sold.includes(size))
    const src = typeof image === "string" ? image : image?.src || ""
    const add = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (isStatic || isSold || !slug) return
        bag.add({ slug, name, colour: live?.meta?.shortLine || live?.meta?.colour || "", size: size || "One size", price, image: src })
        setAdded(size || "✓")
        openBag()
    }
    const label = isSold ? `${soldOutLabel} ${size}` : `${added && added === (size || "✓") ? addedLabel : addLabel}${size ? ` · ${size}` : ""}`
    return (
        <button
            onClick={add}
            disabled={isSold}
            style={{
                ...style,
                position: "relative",
                appearance: "none",
                background: "none",
                border: "none",
                padding: "4px 0",
                margin: 0,
                font: "inherit",
                fontFamily: ff.sans(),
                fontSize: 13,
                whiteSpace: "nowrap",
                width: "max-content",
                color: T.inkSoft,
                textDecoration: isSold ? "line-through" : "none",
                cursor: isSold ? "default" : "pointer",
                transition: "color .35s cubic-bezier(.22,1,.36,1)",
            }}
            onMouseEnter={(e) => !isSold && ((e.currentTarget as HTMLElement).style.color = T.ink)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = T.inkSoft)}
        >
            {label}
        </button>
    )
}

addPropertyControls(PieceAdd as any, {
    slug: { type: ControlType.String, title: "Slug", defaultValue: "", preventLocalization: true, description: "Bind to the product's Slug. Sizes and stock follow from it." },
    name: { type: ControlType.String, title: "Name", defaultValue: "Piece", description: "Bind to Title." },
    price: { type: ControlType.Number, title: "Price", defaultValue: 0, description: "Bind to Price (min)." },
    image: { type: ControlType.ResponsiveImage, title: "Image", description: "Bind to Featured Image." },
    addLabel: { type: ControlType.String, title: "Add", defaultValue: "Add" },
    addedLabel: { type: ControlType.String, title: "Added", defaultValue: "Added" },
    soldOutLabel: { type: ControlType.String, title: "Sold out", defaultValue: "Sold out in" },
})
