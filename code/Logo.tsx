// Logo — the Ombrine wordmark. Upload your own SVG or PNG (any colour); it is
// used as a mask, so it always takes the Ink colour style: ink on plaster,
// bone on Nuit. It is never live text and never translated.
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { T, useNavigate } from "./OmbrineStore.tsx"

interface LogoProps {
    image?: string
    color?: string
    link: string
    label: string
    style?: React.CSSProperties
}

const DEFAULT_LOGO = "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 1200 240%27%3E%3Ctext x=%27600%27 y=%27168%27 text-anchor=%27middle%27 font-family=%27Arial,sans-serif%27 font-size=%27146%27 font-weight=%27800%27 letter-spacing=%271.5%27 fill=%27white%27%3EMR. FICTION%3C/text%3E%3C/svg%3E"

/**
 * Logo
 *
 * @framerIntrinsicWidth 156
 * @framerIntrinsicHeight 34
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Logo(props: LogoProps) {
    const { image, color, link = "/", label = "Ombrine, home", style } = props
    const navigate = useNavigate()
    const src = image || DEFAULT_LOGO
    const mask = `url("${src}") center / contain no-repeat`
    return (
        <a
            href={link}
            aria-label={label}
            onClick={(e) => link && navigate(link, e)}
            style={{ ...style, position: "relative", display: "block", width: "100%", height: "100%" }}
        >
            <span aria-hidden style={{ position: "absolute", inset: 0, background: color || T.ink, WebkitMask: mask, mask } as any} />
        </a>
    )
}

addPropertyControls(Logo as any, {
    image: { type: ControlType.Image, title: "Logo file", description: "SVG or transparent PNG. Leave empty for the Ombrine wordmark." },
    color: { type: ControlType.Color, title: "Colour", optional: true, description: "Leave empty to follow the Ink colour style (switches with the theme)." },
    link: { type: ControlType.Link, title: "Link", defaultValue: "/" },
    label: { type: ControlType.String, title: "Label", defaultValue: "Ombrine, home", description: "Read by screen readers." },
})
