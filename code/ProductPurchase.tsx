// Product purchase — the option chips (size, and colour or any other option the
// Shopify product has) and Add to bag for the product page. Everything about
// the product comes from Shopify through the slug; bind Slug, Name, Price and
// Image to the synced collection. On phones the button docks as a glass bar at
// the bottom once the inline button scrolls away.
import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion, AnimatePresence } from "framer-motion"
import { T, ff, bag, openBag, useLang, formatPrice, useLive, useProduct, useShop, optionValues, livePrice, liveMissing, findVariant, setChosenImage } from "./OmbrineStore.tsx"

interface ProductPurchaseProps {
    slug: string
    name: string
    price: number
    image?: { src: string } | string
    sizeLabel: string
    fitNote: string
    addLabel: string
    sizeWord: string
    chooseLabel: string
    addedLabel: string
    viewBag: string
    soldOutLabel: string
    notifyMe: string
    notifyThanks: string
    unavailableLabel: string
    style?: React.CSSProperties
}

const plain: React.CSSProperties = { appearance: "none", background: "none", border: "none", padding: 0, margin: 0, font: "inherit", color: "inherit", cursor: "pointer" }
const low = (s: string) => String(s || "").trim().toLowerCase()
const isColour = (name: string) => /^(colou?r|couleur|farbe)$/i.test(name.trim())

/**
 * Product purchase
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 150
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ProductPurchase(props: ProductPurchaseProps) {
    const {
        slug = "",
        name = "Double-face wrap coat",
        price: cmsPrice = 2890,
        image,
        sizeLabel = "Size",
        fitNote = "Cut generous — take your usual size",
        addLabel = "Add to bag",
        sizeWord = "Size",
        chooseLabel = "Choose a size",
        addedLabel = "Added to bag",
        viewBag = "View bag",
        soldOutLabel = "sold out",
        notifyMe = "Notify me",
        notifyThanks = "We will write to you when it is back.",
        unavailableLabel = "Not available online",
        style,
    } = props
    const isStatic = useIsStaticRenderer()
    const lang = useLang()
    const shop = useShop()
    const live = useLive(slug)
    const row = useProduct(slug)
    const missing = liveMissing(live)
    const sizeName = low(shop.sizeOption || "Size")
    const found = !!live && live.found

    // every option but the size (colour, material…): a row of chips each, first value chosen
    const others = found ? live!.options.filter((o) => low(o.name) !== sizeName) : []
    const [picked, setPicked] = useState<Record<string, string>>({})
    const choice: Record<string, string> = {}
    others.forEach((o) => {
        const want = picked[low(o.name)]
        choice[low(o.name)] = o.values.some((v) => v.name === want) ? want : o.values[0]?.name || ""
    })
    const choiceKey = others.map((o) => choice[low(o.name)]).join("|")

    // the sizes for that choice, and which of them are sold out
    const sizeOpt = found ? live!.options.find((o) => low(o.name) === sizeName) : undefined
    const list = found ? (sizeOpt ? sizeOpt.values.map((v) => v.name) : []) : isStatic && !row ? ["34", "36", "38", "40", "42", "44"] : optionValues(row?.options || "", shop.sizeOption || "Size")
    const variantFor = (s: string | null) => (found ? findVariant(live, s ? { ...choice, [sizeName]: s } : choice) : undefined)
    const sold = found ? list.filter((s) => !variantFor(s)?.available) : isStatic && !row ? ["44"] : []
    const avail = list.filter((s) => !sold.includes(s))

    const [size, setSize] = useState<string | null>(isStatic ? avail[Math.floor((avail.length - 1) / 2)] || null : null)
    const [added, setAdded] = useState(false)
    const [ask, setAsk] = useState(0)
    const [notify, setNotify] = useState<string | null>(null)
    const [notified, setNotified] = useState(false)
    const btnRef = useRef<HTMLButtonElement>(null)
    const [dock, setDock] = useState(false)
    const [mobile, setMobile] = useState(false)
    const src = typeof image === "string" ? image : image?.src || ""

    const variant = variantFor(size)
    const price = variant?.price || livePrice(live, cmsPrice)
    // a product with no size at all (a bag) is sold out when its only variant is
    const goneWithoutSize = found && !list.length && !variantFor(null)?.available

    // the page's main picture follows the chosen colour
    const choiceImage = others.length ? live!.variants.find((v) => others.every((o) => low(v.opts[low(o.name)] || "") === low(choice[low(o.name)])))?.image || "" : ""
    useEffect(() => {
        if (!isStatic && others.length && Object.keys(picked).length) setChosenImage(slug, choiceImage)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [choiceKey, choiceImage])

    useEffect(() => {
        if (isStatic) return
        const m = () => setMobile(window.innerWidth < 810)
        m()
        window.addEventListener("resize", m)
        const el = btnRef.current
        let io: IntersectionObserver | null = null
        if (el && "IntersectionObserver" in window) {
            io = new IntersectionObserver(([e]) => setDock(!e.isIntersecting && e.boundingClientRect.top < 0))
            io.observe(el)
        }
        return () => {
            window.removeEventListener("resize", m)
            io?.disconnect()
        }
    }, [isStatic])

    const pickOption = (optName: string, value: string) => {
        setPicked((p) => ({ ...p, [low(optName)]: value }))
        setAdded(false)
        setNotify(null)
    }
    const pick = (s: string) => {
        if (sold.includes(s)) {
            setNotify(s)
            setNotified(false)
            setSize(null)
            return
        }
        setNotify(null)
        setSize(s)
        setAdded(false)
    }
    const add = () => {
        if (missing || goneWithoutSize) return
        if (added) return openBag()
        if (!size && list.length) {
            setAsk((n) => n + 1)
            return
        }
        if (size && sold.includes(size)) return pick(size)
        const colourOpt = others.find((o) => isColour(o.name))
        const extra = others.filter((o) => o !== colourOpt && o.values.length > 1).map((o) => choice[low(o.name)])
        bag.add({
            slug,
            name,
            colour: (colourOpt ? choice[low(colourOpt.name)] : live?.meta?.colour) || "",
            size: [...extra, size || "One size"].join(" / "),
            price: Number(price) || 0,
            image: choiceImage || src,
            // tell the bag exactly which variant when the size alone does not say it
            variantId: others.some((o) => o.values.length > 1) ? variant?.id : undefined,
        })
        setAdded(true)
    }

    const off = missing || goneWithoutSize
    const Button = ({ refEl, compact }: { refEl?: React.Ref<HTMLButtonElement>; compact?: boolean }) => (
        <button ref={refEl} onClick={add} style={{ ...plain, position: "relative", width: "100%", height: compact ? 48 : 52, background: T.ink, color: T.onInk, borderRadius: 2, overflow: "hidden", opacity: off ? 0.45 : 1, cursor: off ? "default" : "pointer", fontSize: 14, fontWeight: 500, letterSpacing: "0.004em" }}>
            <motion.span initial={false} animate={{ scaleX: added ? 1 : 0 }} transition={{ duration: 0.6, ease: [0.45, 0, 0.55, 1] }} style={{ position: "absolute", inset: 0, background: T.oxblood, transformOrigin: "0 50%" }} />
            <span style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 22px", color: added ? "#EEE7DC" : T.onInk }}>
                <span>{missing ? unavailableLabel : goneWithoutSize ? soldOutLabel : added ? `${addedLabel} ✓` : addLabel}</span>
                <span style={{ fontWeight: 400, fontSize: 13, opacity: 0.8 }}>{off ? "" : added ? viewBag : size ? `${sizeWord} ${size}` : compact || !list.length ? formatPrice(Number(price), lang) : chooseLabel}</span>
            </span>
        </button>
    )
    const chip = (on: boolean, dim: boolean): React.CSSProperties => ({ ...plain, height: 44, borderRadius: 2, border: `1px solid ${on ? T.ink : T.hairline}`, background: on ? T.ink : "transparent", color: on ? T.onInk : dim ? T.inkSoft : T.ink, fontSize: 13, textDecoration: dim ? "line-through" : "none", transition: "background-color .25s, color .25s, border-color .25s" })

    return (
        <div style={{ ...style, width: "100%", display: "flex", flexDirection: "column", gap: 14, fontFamily: ff.sans(), color: T.ink }}>
            {others
                .filter((o) => o.values.length > 1)
                .map((o) => (
                    <div key={o.name} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, letterSpacing: "0.006em" }}>
                            <span>{o.name}</span>
                            <span style={{ color: T.inkSoft }}>{choice[low(o.name)]}</span>
                        </div>
                        <div role="radiogroup" aria-label={o.name} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {o.values.map((v) => {
                                const on = choice[low(o.name)] === v.name
                                return (
                                    <button key={v.name} role="radio" aria-checked={on} onClick={() => pickOption(o.name, v.name)} style={{ ...chip(on, false), padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 8 }}>
                                        {v.swatch && <span aria-hidden style={{ width: 12, height: 12, borderRadius: 6, background: v.swatch, border: `1px solid ${T.hairline}`, flex: "0 0 auto" }} />}
                                        {v.name}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            {list.length > 0 && (
                <>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, letterSpacing: "0.006em" }}>
                        <span>{sizeLabel}</span>
                        <span style={{ color: T.inkSoft }}>{fitNote}</span>
                    </div>
                    <motion.div key={ask} animate={ask ? { x: [0, -6, 6, -3, 3, 0] } : {}} transition={{ duration: 0.5 }} role="radiogroup" aria-label={sizeLabel} style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(6, Math.max(list.length, 1))}, minmax(0, 1fr))`, gap: 8 }}>
                        {list.map((s) => {
                            const isSold = sold.includes(s)
                            return (
                                <button key={s} role="radio" aria-checked={size === s} aria-label={isSold ? `${s}, ${soldOutLabel}` : s} onClick={() => pick(s)} style={chip(size === s, isSold)}>
                                    {s}
                                </button>
                            )
                        })}
                    </motion.div>
                </>
            )}
            {(notify || ask > 0) && !size && (
                <div style={{ fontSize: 12, color: notify ? T.inkSoft : T.oxblood }}>
                    {notify ? (
                        notified ? (
                            notifyThanks
                        ) : (
                            <span>
                                {notify} — {soldOutLabel}.{" "}
                                <button onClick={() => setNotified(true)} style={{ ...plain, textDecoration: "underline", color: T.ink }}>
                                    {notifyMe}
                                </button>
                            </span>
                        )
                    ) : (
                        chooseLabel
                    )}
                </div>
            )}
            <Button refEl={btnRef} />
            {!isStatic &&
                mobile &&
                typeof document !== "undefined" &&
                createPortal(
                    <AnimatePresence>
                        {dock && (
                            <motion.div
                                key="dock"
                                initial={{ y: "110%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "110%" }}
                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    position: "fixed",
                                    left: 10,
                                    right: 10,
                                    bottom: "calc(10px + env(safe-area-inset-bottom))",
                                    zIndex: 800,
                                    padding: 10,
                                    background: T.glass,
                                    backdropFilter: "blur(24px)",
                                    WebkitBackdropFilter: "blur(24px)",
                                    border: `1px solid color-mix(in srgb, ${T.surface} 70%, transparent)`,
                                    borderRadius: 4,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    fontFamily: ff.sans(),
                                    color: T.ink,
                                }}
                            >
                                <div style={{ flex: "0 1 auto", minWidth: 0, paddingLeft: 6 }}>
                                    <div style={{ fontFamily: ff.serif(), fontWeight: ff.medium(), fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                                    <div style={{ fontSize: 12, color: T.inkSoft }}>{formatPrice(Number(price), lang)}</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Button compact />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    )
}

addPropertyControls(ProductPurchase as any, {
    slug: { type: ControlType.String, title: "Slug", defaultValue: "", preventLocalization: true, description: "Bind to Slug. Sizes, colours and stock follow from it." },
    name: { type: ControlType.String, title: "Name", defaultValue: "Double-face wrap coat", description: "Bind to Title." },
    price: { type: ControlType.Number, title: "Price", defaultValue: 2890, description: "Bind to Price (min)." },
    image: { type: ControlType.ResponsiveImage, title: "Image", description: "Bind to Featured Image (used in the bag)." },
    sizeLabel: { type: ControlType.String, title: "Size label", defaultValue: "Size" },
    fitNote: { type: ControlType.String, title: "Fit note", defaultValue: "Cut generous — take your usual size" },
    addLabel: { type: ControlType.String, title: "Add label", defaultValue: "Add to bag" },
    sizeWord: { type: ControlType.String, title: "Size word", defaultValue: "Size" },
    chooseLabel: { type: ControlType.String, title: "Choose label", defaultValue: "Choose a size" },
    addedLabel: { type: ControlType.String, title: "Added label", defaultValue: "Added to bag" },
    viewBag: { type: ControlType.String, title: "View bag", defaultValue: "View bag" },
    soldOutLabel: { type: ControlType.String, title: "Sold out label", defaultValue: "sold out" },
    notifyMe: { type: ControlType.String, title: "Notify me", defaultValue: "Notify me" },
    notifyThanks: { type: ControlType.String, title: "Notify thanks", defaultValue: "We will write to you when it is back." },
    unavailableLabel: { type: ControlType.String, title: "Unavailable", defaultValue: "Not available online", description: "Shown when the shop is connected and has no product with this slug." },
})
