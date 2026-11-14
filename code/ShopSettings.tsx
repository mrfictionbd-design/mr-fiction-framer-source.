// Shopify Settings: the one place where the shop is connected. It sits on the
// Home page, above the Desktop frame. On the canvas it is a small card that
// says whether the shop answers; on the site it is invisible and hands the two
// values to the bag, the prices and the size pickers on every page (the other
// pages read them from the published Home page). Keep it on the Home page.
import * as React from "react"
import { useEffect, useState } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { setShop, T, FONT, fontLink } from "./OmbrineStore.tsx"

interface ShopSettingsProps {
    shopifyDomain: string
    storefrontToken: string
    sizeOption: string
    style?: React.CSSProperties
}

type Check = { state: "empty" | "checking" | "ok" | "error"; name?: string; currency?: string }
const clean = (d: string) => d.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "")

/**
 * Shopify Settings (a card on the canvas, invisible on the site)
 *
 * @framerIntrinsicWidth 340
 * @framerIntrinsicHeight 190
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ShopSettings(props: ShopSettingsProps) {
    const { shopifyDomain = "", storefrontToken = "", sizeOption = "Size", style } = props
    const isStatic = useIsStaticRenderer()
    const domain = clean(shopifyDomain)
    const token = storefrontToken.trim()
    const [check, setCheck] = useState<Check>({ state: "empty" })

    // the site: hand the shop to every Ombrine component
    useEffect(() => {
        if (isStatic) return
        setShop({ domain, token, sizeOption })
    }, [isStatic, domain, token, sizeOption])

    // the canvas: ask the shop for its name, so a wrong address or token shows at once
    useEffect(() => {
        if (!isStatic) return
        if (!domain || !token) return setCheck({ state: "empty" })
        let alive = true
        setCheck({ state: "checking" })
        const timer = setTimeout(() => {
            fetch(`https://${domain}/api/2026-07/graphql.json`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
                body: JSON.stringify({ query: "{ shop { name paymentSettings { currencyCode } } }" }),
            })
                .then((r) => r.json())
                .then((j) => {
                    if (!alive) return
                    const s = j?.data?.shop
                    setCheck(s?.name ? { state: "ok", name: s.name, currency: s.paymentSettings?.currencyCode } : { state: "error" })
                })
                .catch(() => alive && setCheck({ state: "error" }))
        }, 600)
        return () => {
            alive = false
            clearTimeout(timer)
        }
    }, [isStatic, domain, token])

    // the site: nothing to see; the shop is printed as an attribute so the other pages can read it from Home
    if (!isStatic) return <div aria-hidden data-ombrine-shop={JSON.stringify(domain && token ? { domain, token, sizeOption } : {})} style={{ ...style, width: 1, height: 1, opacity: 0, overflow: "hidden", pointerEvents: "none" }} />

    const dot = check.state === "ok" ? "#2E7D4F" : check.state === "error" ? T.oxblood : check.state === "checking" ? "#B98A2E" : T.outline
    const status =
        check.state === "ok"
            ? `Connected to ${check.name}${check.currency ? ` · ${check.currency}` : ""}`
            : check.state === "error"
              ? "Could not connect. Check the address and token."
              : check.state === "checking"
                ? "Checking the shop…"
                : "Not connected yet"
    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                background: T.surface,
                border: `1px solid ${T.hairline}`,
                borderRadius: 2,
                color: T.ink,
                fontFamily: FONT.sans,
                fontSize: 13,
                lineHeight: 1.5,
            }}
        >
            {fontLink("en")}
            <div style={{ fontSize: 12, letterSpacing: "0.006em", color: T.inkSoft }}>Shopify</div>
            <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontWeight: 300, fontSize: 30, lineHeight: 1.1, marginTop: 10 }}>Select me and set up</div>
            <div style={{ color: T.inkSoft, marginTop: 12 }}>Click this card, then add your store and token in the right sidebar.</div>
            <div style={{ marginTop: "auto", paddingTop: 14, borderTop: `1px solid ${T.hairline}`, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: dot, flex: "0 0 auto" }} />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{status}</span>
            </div>
        </div>
    )
}

addPropertyControls(ShopSettings as any, {
    shopifyDomain: {
        type: ControlType.String,
        title: "Shopify store",
        placeholder: "your-shop.myshopify.com",
        defaultValue: "",
        preventLocalization: true,
        description: "Shopify → Settings → Domains. The myshopify.com address works best.",
    },
    storefrontToken: {
        type: ControlType.String,
        title: "Storefront token",
        placeholder: "Public access token",
        defaultValue: "",
        preventLocalization: true,
        description: "Shopify → Headless app → Storefront API → Public access token. It is meant to be public.",
    },
    sizeOption: {
        type: ControlType.String,
        title: "Size option",
        defaultValue: "Size",
        preventLocalization: true,
        description: "The name of the Shopify product option that holds the size.",
    },
})
