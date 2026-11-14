// Quick add — the glass bar on a product card. Pick a size and the piece goes
// straight into the bag. Sizes and stock come from Shopify through the slug;
// a piece with more options (colour…) is added in its first colour.
import * as React from "react"
import { useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { T, bag, ff, useLive, useProduct, useShop, optionValues, livePrice, liveSold, liveSizes, liveMissing } from "./OmbrineStore.tsx"

interface QuickAddProps {
    label: string
    addedLabel: string
    slug: string
    name: string
    price: number
    image?: { src: string } | string
    style?: React.CSSProperties
}

const plain: React.CSSProperties = { appearance: "none", background: "none", border: "none", padding: 0, margin: 0, font: "inherit", color: "inherit", cursor: "pointer" }

/**
 * Quick add
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 36
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function QuickAdd(props: QuickAddProps) {
    const { label = "Quick add", addedLabel = "Added ✓", slug = "", name = "", price: cmsPrice = 0, image, style } = props
    const live = useLive(slug)
    const row = useProduct(slug)
    const shop = useShop()
    const price = livePrice(live, cmsPrice)
    const list = liveSizes(live, optionValues(row?.options || "", shop.sizeOption || "Size"))
    const sold = liveSold(live, list, [])
    const missing = liveMissing(live)
    const [added, setAdded] = useState<string | null>(null)
    const src = typeof image === "string" ? image : image?.src || ""
    const add = (e: React.MouseEvent, s: string) => {
        e.preventDefault()
        e.stopPropagation()
        if (missing || (s && sold.includes(s))) return
        bag.add({ slug, name, colour: live?.meta?.colour || "", size: s || "One size", price, image: src })
        setAdded(s || "✓")
        setTimeout(() => setAdded(null), 1800)
    }
    return (
        <div
            onClick={(e) => (list.length ? (e.preventDefault(), e.stopPropagation()) : add(e, ""))}
            style={{
                ...style,
                width: "100%",
                height: 36,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "0 8px 0 12px",
                background: T.glass,
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderRadius: 2,
                fontFamily: ff.sans(),
                fontSize: 12,
                color: added ? T.oxblood : T.ink,
                whiteSpace: "nowrap",
                cursor: list.length || missing ? "default" : "pointer",
            }}
        >
            <span>{added ? `${addedLabel} ${added === "✓" ? "" : added}` : label}</span>
            <span style={{ display: "flex", gap: 2, overflow: "hidden" }}>
                {list.map((s) => (
                    <button
                        key={s}
                        onClick={(e) => add(e, s)}
                        aria-label={`${label} ${s}`}
                        disabled={sold.includes(s)}
                        style={{ ...plain, minWidth: 26, height: 28, padding: "0 4px", fontSize: 12, color: sold.includes(s) ? T.inkSoft : T.ink, textDecoration: sold.includes(s) ? "line-through" : "none", cursor: sold.includes(s) ? "default" : "pointer" }}
                    >
                        {s}
                    </button>
                ))}
            </span>
        </div>
    )
}

addPropertyControls(QuickAdd as any, {
    label: { type: ControlType.String, title: "Label", defaultValue: "Quick add" },
    addedLabel: { type: ControlType.String, title: "Added label", defaultValue: "Added ✓" },
    slug: { type: ControlType.String, title: "Slug", defaultValue: "", preventLocalization: true, description: "Bind to the product's Slug. Sizes and stock follow from it." },
    name: { type: ControlType.String, title: "Name", defaultValue: "", description: "Bind to Title." },
    price: { type: ControlType.Number, title: "Price", defaultValue: 0, description: "Bind to Price (min)." },
    image: { type: ControlType.ResponsiveImage, title: "Image", description: "Bind to Featured Image." },
})
