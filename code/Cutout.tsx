// Cutout — a transparent PNG standing on its floor shadow. The image always
// fits inside the box (tall coats and wide shoes alike) and the shadow follows
// the real width of the piece. Bind "Image" to a CMS image field.
import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { T, useChosenImage } from "./OmbrineStore.tsx"

interface CutoutProps {
    image?: { src: string; srcSet?: string; alt?: string } | string
    slug?: string
    alt: string
    maxWidth: number
    maxHeight: number
    align: "floor" | "center"
    zoom: number
    zoomOrigin: number
    shadow: boolean
    style?: React.CSSProperties
}

/**
 * Cutout
 *
 * @framerIntrinsicWidth 260
 * @framerIntrinsicHeight 330
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Cutout(props: CutoutProps) {
    const { image, alt = "", maxWidth = 72, maxHeight = 100, align = "floor", zoom = 1, zoomOrigin = 4, shadow = true, style } = props
    const wantCentre = String(align).toLowerCase().startsWith("c")
    // on a product page, the picture follows the colour picked in the size and colour chooser
    const chosen = useChosenImage(props.slug || "")
    const src = chosen || (typeof image === "string" ? image : image?.src || "https://framerusercontent.com/images/W6FEbq5iFIoQLOx5HvNrd05YCk.png")
    const srcSet = chosen || typeof image === "string" ? undefined : image?.srcSet
    const [ratio, setRatio] = useState(0.6)
    // wide pieces (shoes, bags) never sit on the floor line: they would end up at the very bottom of a tall tile
    const centred = wantCentre || ratio > 1.15
    // Zoom: rests close on the upper body, pulls back to the full figure while
    // the card it sits in (the nearest link) is hovered
    const rootRef = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)
    useEffect(() => {
        if (zoom <= 1) return
        const host = (rootRef.current?.closest("a") as HTMLElement | null) || rootRef.current
        if (!host) return
        const on = () => setOpen(true)
        const off = () => setOpen(false)
        host.addEventListener("pointerenter", on)
        host.addEventListener("pointerleave", off)
        host.addEventListener("focusin", on)
        host.addEventListener("focusout", off)
        return () => {
            host.removeEventListener("pointerenter", on)
            host.removeEventListener("pointerleave", off)
            host.removeEventListener("focusin", on)
            host.removeEventListener("focusout", off)
        }
    }, [zoom])
    const zoomed = zoom > 1 && !open
    return (
        <div ref={rootRef} style={{ ...style, position: "relative", width: "100%", height: "100%", display: "flex", alignItems: centred ? "center" : "flex-end", justifyContent: "center", containerType: "size" } as any}>
            <div
                style={{
                    position: "relative",
                    height: `min(${maxHeight}cqh, ${maxWidth}cqw / ${ratio})`,
                    aspectRatio: String(ratio),
                    maxWidth: `${maxWidth}%`,
                    marginBottom: 0,
                    transformOrigin: `50% ${zoomOrigin}%`,
                    transform: zoom > 1 ? `scale(${zoomed ? zoom : 1})` : undefined,
                    transition: zoom > 1 ? "transform 1.1s cubic-bezier(.22,1,.36,1)" : undefined,
                } as any}
            >
                {shadow && (
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            left: "12%",
                            right: "12%",
                            bottom: -7,
                            height: 12,
                            borderRadius: "50%",
                            background: `radial-gradient(closest-side, ${T.shadow}, transparent)`,
                        }}
                    />
                )}
                <img
                    src={src}
                    srcSet={srcSet}
                    alt={alt || (typeof image === "string" ? "" : image?.alt || "")}
                    loading="lazy"
                    decoding="async"
                    onLoad={(e) => {
                        const i = e.currentTarget
                        if (i.naturalWidth && i.naturalHeight) setRatio(i.naturalWidth / i.naturalHeight)
                    }}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", objectPosition: "50% 100%" }}
                />
            </div>
        </div>
    )
}

addPropertyControls(Cutout as any, {
    image: { type: ControlType.ResponsiveImage, title: "Image", description: "Transparent PNG cut-out. Bind to a CMS image field." },
    slug: { type: ControlType.String, title: "Slug", defaultValue: "", preventLocalization: true, description: "Only for the main picture of a product page: bind to Slug and the picture follows the chosen colour." },
    alt: { type: ControlType.String, title: "Alt text", defaultValue: "", description: "Describe the piece for screen readers." },
    maxWidth: { type: ControlType.Number, title: "Max width", defaultValue: 72, min: 20, max: 100, unit: "%", description: "Wide pieces (shoes) stop at this share of the box." },
    maxHeight: { type: ControlType.Number, title: "Max height", defaultValue: 100, min: 30, max: 100, unit: "%", description: "Tall pieces (coats, long skirts) stop at this share of the box." },
    align: { type: ControlType.Enum, title: "Align", options: ["floor", "center"], optionTitles: ["Floor", "Centre"], defaultValue: "floor", displaySegmentedControl: true, description: "Floor: every piece stands on the same line. Centre: each piece sits in the middle of its tile." },
    zoom: { type: ControlType.Number, title: "Zoom", defaultValue: 1, min: 1, max: 3, step: 0.05, description: "Above 1: rests close on the upper body and shows the full figure while its card is hovered." },
    zoomOrigin: { type: ControlType.Number, title: "Zoom anchor", defaultValue: 4, min: 0, max: 60, unit: "%", description: "Which part stays in view when zoomed: 0% the head, higher values move down the figure.", hidden: (p: any) => !(p.zoom > 1) },
    shadow: { type: ControlType.Boolean, title: "Floor shadow", defaultValue: true },
})
