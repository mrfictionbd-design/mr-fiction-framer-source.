// Book a fitting — scrolls to the fitting form on the same page and
// pre-selects the house. Bind "House" to Stores → City.
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { T, ff } from "./OmbrineStore.tsx"

interface BookFittingProps {
    house: string
    label: string
    target: string
    style?: React.CSSProperties
}

/**
 * Book a fitting
 *
 * @framerIntrinsicWidth 120
 * @framerIntrinsicHeight 20
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function BookFitting(props: BookFittingProps) {
    const { house = "Paris", label = "Book a fitting", target = "contact", style } = props
    return (
        <a
            href={`#${target}`}
            onClick={(e) => {
                e.preventDefault()
                window.dispatchEvent(new CustomEvent("ombrine:house", { detail: house }))
                const el = document.getElementById(target)
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
            }}
            style={{ ...style, display: "inline-flex", gap: 8, alignItems: "center", fontFamily: ff.sans(), fontSize: 13, fontWeight: 500, letterSpacing: "0.004em", color: T.ink, textDecoration: "none", whiteSpace: "nowrap", minHeight: 28 }}
        >
            {label} <span aria-hidden>→</span>
        </a>
    )
}

addPropertyControls(BookFitting as any, {
    house: { type: ControlType.String, title: "House", defaultValue: "Paris", description: "Bind to Stores → City. Pre-selects the house in the form." },
    label: { type: ControlType.String, title: "Label", defaultValue: "Book a fitting" },
    target: { type: ControlType.String, title: "Form section ID", defaultValue: "contact", description: "The scroll-target ID of the section that holds the form." },
})
