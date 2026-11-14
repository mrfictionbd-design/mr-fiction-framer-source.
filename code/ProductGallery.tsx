// Product gallery — the product's further pictures (every image after the
// first), each on a studio tile. Bind "Images" to the synced collection's
// Images (JSON) field. A grid on desktop and tablet, a row on phones (set
// Layout per breakpoint). A product with one picture shows nothing.
import * as React from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { studioTile, useLive } from "./OmbrineStore.tsx"

interface ProductGalleryProps {
    slug: string
    images: string
    layout: "grid" | "row"
    columns: number
    tileHeight: number
    tileWidth: number
    gap: number
    alt: string
    style?: React.CSSProperties
}

function parse(json: string): string[] {
    if (!json) return []
    try {
        const list = JSON.parse(json)
        return Array.isArray(list) ? list.map((i: any) => (typeof i === "string" ? i : i?.url)).filter(Boolean) : []
    } catch (e) {
        return []
    }
}
// Shopify's CDN resizes on request
const sized = (url: string, px: number) => (url.includes("cdn.shopify.com") ? `${url}${url.includes("?") ? "&" : "?"}width=${px}` : url)

/**
 * Product gallery
 *
 * @framerIntrinsicWidth 856
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ProductGallery(props: ProductGalleryProps) {
    const { slug = "", images = "", layout = "grid", columns = 2, tileHeight = 600, tileWidth = 300, gap = 16, alt = "", style } = props
    const isStatic = useIsStaticRenderer()
    const live = useLive(slug)
    // the collection's list first (it is in the page from the start), Shopify's own once it answers
    const all = live?.found && live.images.length ? live.images : parse(images)
    const rest = all.slice(1)
    const row = layout === "row"
    if (!rest.length) {
        if (!isStatic) return <div aria-hidden style={{ ...style, width: row ? 0 : "100%", height: 0 }} />
        // the canvas keeps a visible stand-in, so the layer can be found and selected
        return <div style={{ ...style, width: row ? tileWidth : "100%", height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", fontSize: 11, color: "#999", border: "1px dashed rgba(128,128,128,0.4)", boxSizing: "border-box" }}>Product gallery — further pictures appear here</div>
    }
    return (
        <div style={{ ...style, display: row ? "flex" : "grid", gridTemplateColumns: row ? undefined : `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`, gap, width: row ? "max-content" : "100%" }}>
            {rest.map((url, i) => (
                <div key={url + i} style={{ width: row ? tileWidth : "100%", height: tileHeight, flex: row ? "0 0 auto" : undefined, background: studioTile, borderRadius: 2, overflow: "hidden", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <img src={sized(url, 1200)} alt={alt} loading="lazy" decoding="async" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "50% 100%", display: "block" }} />
                </div>
            ))}
        </div>
    )
}

addPropertyControls(ProductGallery as any, {
    images: { type: ControlType.String, title: "Images", defaultValue: "", preventLocalization: true, description: "Bind to Images (JSON)." },
    slug: { type: ControlType.String, title: "Slug", defaultValue: "", preventLocalization: true, description: "Bind to Slug." },
    alt: { type: ControlType.String, title: "Alt text", defaultValue: "", description: "Bind to Title." },
    layout: { type: ControlType.Enum, title: "Layout", options: ["grid", "row"], optionTitles: ["Grid", "Row"], defaultValue: "grid", displaySegmentedControl: true },
    columns: { type: ControlType.Number, title: "Columns", defaultValue: 2, min: 1, max: 4, step: 1, displayStepper: true, hidden: (p: any) => p.layout === "row" },
    tileWidth: { type: ControlType.Number, title: "Tile width", defaultValue: 300, min: 120, max: 800, unit: "px", hidden: (p: any) => p.layout !== "row" },
    tileHeight: { type: ControlType.Number, title: "Tile height", defaultValue: 600, min: 120, max: 1200, unit: "px" },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 16, min: 0, max: 60, unit: "px" },
})
