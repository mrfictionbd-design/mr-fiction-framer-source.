// Price — shows a EUR amount in the active language's number format:
// €2,890 (EN, ZH) · 2 890 € (FR, RU) · 2.890 € (ES) · 2,890 € (AR).
// Bind "Amount" to a CMS number field.
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { T, useLang, formatPrice, useLive, livePrice, useShopCurrency } from "./OmbrineStore.tsx"

interface PriceProps {
    amount: number
    slug: string
    size: number
    color?: string
    style?: React.CSSProperties
}

/**
 * Price
 *
 * @framerIntrinsicWidth 60
 * @framerIntrinsicHeight 15
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function Price(props: PriceProps) {
    const { amount = 2890, slug = "", size = 15, color, style } = props
    const lang = useLang()
    // with a Shopify shop connected and a slug bound, the price is Shopify's
    const live = useLive(slug)
    useShopCurrency()
    const value = livePrice(live, Number(amount) || 0)
    return (
        <span
            style={{
                ...style,
                display: "inline-block",
                whiteSpace: "nowrap",
                fontFamily: lang === "zh" ? `"Noto Sans SC", sans-serif` : lang === "ar" ? `"Readex Pro", sans-serif` : `"Manrope", sans-serif`,
                fontSize: size,
                lineHeight: 1,
                letterSpacing: "0.002em",
                fontVariantNumeric: "tabular-nums",
                color: color || T.ink,
            }}
        >
            {formatPrice(value, lang)}
        </span>
    )
}

addPropertyControls(Price as any, {
    amount: { type: ControlType.Number, title: "Amount", defaultValue: 2890, min: 0, max: 1000000, step: 10, description: "Euros. Bind to a CMS Price field." },
    slug: { type: ControlType.String, title: "Slug", defaultValue: "", preventLocalization: true, description: "Bind to Products → Slug to show the live Shopify price. Leave empty for look totals." },
    size: { type: ControlType.Number, title: "Size", defaultValue: 15, min: 10, max: 40, unit: "px" },
    color: { type: ControlType.Color, title: "Colour", optional: true, description: "Leave empty to follow the Ink colour style." },
})
