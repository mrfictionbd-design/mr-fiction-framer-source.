// Product Index — an invisible helper. It sits inside a hidden collection list
// of the synced Shopify collection (in the site layout, on Home and on 404) and
// hands every product to the rest of the site: search, the bag, the size
// pickers and the looks all find a product by its slug through it.
// Bind each property to the collection field named in its description.
import * as React from "react"
import { useEffect } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { registerProduct } from "./OmbrineStore.tsx"

interface ProductIndexProps {
    title: string
    slug: string
    price: number
    image?: { src: string } | string
    category: string
    options: string
}

/**
 * Product Index (invisible)
 *
 * @framerIntrinsicWidth 1
 * @framerIntrinsicHeight 1
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ProductIndex(props: ProductIndexProps) {
    const isStatic = useIsStaticRenderer()
    const { title = "", slug = "", price = 0, image, category = "", options = "" } = props
    const src = typeof image === "string" ? image : image?.src || ""
    useEffect(() => {
        if (isStatic || !slug) return
        registerProduct({ slug, title, price: Number(price) || 0, image: src, category, options })
    }, [isStatic, slug, title, price, src, category, options])
    if (isStatic) return <div style={{ width: 1, height: 1, fontSize: 9, overflow: "hidden", opacity: 0.4 }}>{title}</div>
    return <div aria-hidden style={{ width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }} />
}

addPropertyControls(ProductIndex as any, {
    title: { type: ControlType.String, title: "Title", defaultValue: "", description: "Bind to Title." },
    slug: { type: ControlType.String, title: "Slug", defaultValue: "", preventLocalization: true, description: "Bind to Slug." },
    price: { type: ControlType.Number, title: "Price", defaultValue: 0, description: "Bind to Price (min)." },
    image: { type: ControlType.ResponsiveImage, title: "Image", description: "Bind to Featured Image." },
    category: { type: ControlType.String, title: "Category", defaultValue: "", description: "Bind to Product Type." },
    options: { type: ControlType.String, title: "Options", defaultValue: "", preventLocalization: true, description: "Bind to Options (JSON): the sizes shown before Shopify answers." },
})
