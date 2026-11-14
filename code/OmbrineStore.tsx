// Ombrine shared store — the bag, overlay state, the product index and small helpers.
// Every Ombrine code component imports from this one file, so the bag count,
// the bag drawer, the Salon panel and the product page always stay in sync.
import { useSyncExternalStore, useCallback, useEffect, useMemo } from "react"
import * as Framer from "framer"

/* ---------------------------------------------------------------- shopify */
// The shop is set on the "Shopify Settings" card above the Home page on the
// canvas (store address + public Storefront token); leave these lines empty.
// Each Shopify product's handle must equal the CMS product's slug, and sizes
// live in an option called "Size". Connected, prices, sizes and stock come
// live from Shopify and Checkout opens Shopify's checkout. Not connected, the
// site runs on the CMS values alone.
export const SHOPIFY = { store: "", token: "", sizeOption: "Size" }

/* ------------------------------------------------------------------ tokens */
// Colours come from the project colour styles (Assets → Colors). The hex
// value after the comma is only a fallback for the canvas.
export const T = {
    ground: "var(--token-75b95fe2-a8e3-4d13-a680-05a20e39b71e, #ECE8E2)",
    groundDeep: "var(--token-b99d2f30-0c51-4a95-8f5d-4d8dd942c6fa, #E2DDD5)",
    surface: "var(--token-6de7cbca-1133-4397-acd2-7197fe6f10fd, #F5F2ED)",
    ink: "var(--token-18423c43-2b11-4fe4-98ca-0df41abb5647, #16130F)",
    inkSoft: "var(--token-82020b8b-49bb-4a2e-a44f-ddc9b2b8180e, #6E665C)",
    onInk: "var(--token-3c269708-7d03-43a3-91c1-9797534a569b, #EEE7DC)",
    hairline: "var(--token-a3696bf5-592b-4330-9d03-b84ba65572bd, rgba(22,19,15,0.12))",
    outline: "var(--token-d6525e48-bdb4-4b50-b7e1-42d20bec29e5, rgba(22,19,15,0.3))",
    glass: "var(--token-5110053d-cf94-4e11-8a73-dece4e5d1c6a, rgba(255,255,255,0.55))",
    oxblood: "var(--token-573c158e-1c87-4029-8964-92ea8801066d, #5C1E22)",
    tileLight: "var(--token-f6086245-9051-4ca8-b2fd-3025088ea0a2, #F6F3EE)",
    tileEdge: "var(--token-db1c8fdd-df02-4b51-a8ba-c824ff9d3ab5, #E2DDD5)",
    shadow: "var(--token-e88a24d0-4d80-46ac-97f8-bc67a996b6a6, rgba(22,19,15,0.22))",
}

export const FONT = {
    serif: `"Cormorant Garamond", "Cormorant Garamond Placeholder", serif`,
    sans: `"Manrope", "Manrope Placeholder", sans-serif`,
}

export const EASE = {
    entrance: [0.22, 1, 0.36, 1] as [number, number, number, number],
    land: [0.16, 1, 0.3, 1] as [number, number, number, number],
    morph: [0.65, 0, 0.35, 1] as [number, number, number, number],
    quint: [0.22, 1, 0.36, 1] as [number, number, number, number],
}

export const studioTile = `radial-gradient(ellipse 70% 70% at 50% 45%, ${T.tileLight} 0%, ${T.tileEdge} 100%)`

/* ------------------------------------------------------------- tiny store */
type Listener = () => void
function createStore<S>(initial: S) {
    let state = initial
    const listeners = new Set<Listener>()
    return {
        get: () => state,
        set(next: S | ((s: S) => S)) {
            state = typeof next === "function" ? (next as (s: S) => S)(state) : next
            listeners.forEach((l) => l())
        },
        subscribe(l: Listener) {
            listeners.add(l)
            return () => {
                listeners.delete(l)
            }
        },
    }
}

/* -------------------------------------------------------------------- bag */
export interface BagItem {
    key: string // slug + size
    slug: string
    name: string
    colour?: string
    size: string
    price: number
    image?: string
    qty: number
    /** the Shopify variant, when the piece was chosen by more than its size (colour…) */
    variantId?: string
}

const BAG_KEY = "ombrine-bag-v1"
const bagStore = createStore<BagItem[]>([])
let bagLoaded = false

function loadBag() {
    if (bagLoaded || typeof window === "undefined") return
    bagLoaded = true
    try {
        const raw = window.localStorage.getItem(BAG_KEY)
        if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) bagStore.set(parsed)
        }
    } catch (e) {}
    try {
        window.addEventListener("storage", (e) => {
            if (e.key !== BAG_KEY) return
            try {
                bagStore.set(e.newValue ? JSON.parse(e.newValue) : [])
            } catch (err) {}
        })
    } catch (e) {}
}

function saveBag(items: BagItem[]) {
    try {
        window.localStorage.setItem(BAG_KEY, JSON.stringify(items))
    } catch (e) {}
}

export const bag = {
    items: () => bagStore.get(),
    count: () => bagStore.get().reduce((n, i) => n + i.qty, 0),
    subtotal: () => bagStore.get().reduce((n, i) => n + i.qty * i.price, 0),
    add(item: Omit<BagItem, "key" | "qty"> & { qty?: number }) {
        loadBag()
        const key = `${item.slug}__${item.size}${item.variantId ? `__${item.variantId}` : ""}`
        bagStore.set((list) => {
            const found = list.find((i) => i.key === key)
            const next = found
                ? list.map((i) => (i.key === key ? { ...i, qty: i.qty + (item.qty || 1) } : i))
                : [...list, { ...item, key, qty: item.qty || 1 }]
            saveBag(next)
            return next
        })
        ui.set((u) => ({ ...u, pop: u.pop + 1 }))
    },
    setQty(key: string, qty: number) {
        bagStore.set((list) => {
            const next = qty <= 0 ? list.filter((i) => i.key !== key) : list.map((i) => (i.key === key ? { ...i, qty } : i))
            saveBag(next)
            return next
        })
    },
    remove(key: string) {
        bag.setQty(key, 0)
    },
    clear() {
        bagStore.set([])
        saveBag([])
    },
}

const EMPTY: BagItem[] = []
export function useBag(): BagItem[] {
    loadBag()
    return useSyncExternalStore(bagStore.subscribe, bagStore.get, () => EMPTY)
}

/* --------------------------------------------------------------- overlays */
interface UIState {
    bagOpen: boolean
    searchOpen: boolean
    pop: number // increments on every add, drives the header count pop
}
export const ui = createStore<UIState>({ bagOpen: false, searchOpen: false, pop: 0 })
const UI0: UIState = { bagOpen: false, searchOpen: false, pop: 0 }
export function useUI(): UIState {
    return useSyncExternalStore(ui.subscribe, ui.get, () => UI0)
}
export const openBag = () => ui.set((u) => ({ ...u, bagOpen: true, searchOpen: false }))
export const closeBag = () => ui.set((u) => ({ ...u, bagOpen: false }))
export const openSearch = () => ui.set((u) => ({ ...u, searchOpen: true, bagOpen: false }))
export const closeSearch = () => ui.set((u) => ({ ...u, searchOpen: false }))

/* ---------------------------------------------------------- product index */
// Filled at runtime by the hidden "Product Index" collection list in the
// layout (one row per product of the synced Shopify collection), so every
// component can find a product's title, price, image and sizes by its slug.
export interface IndexedProduct {
    slug: string
    title: string
    colour: string
    price: number
    image: string
    category: string
    short: string
    look: string
    lookSlug?: string
    sizes: string
}
/** One row of the synced Shopify collection, as the hidden Product Index list hands it over. */
export interface RawProduct {
    slug: string
    title: string
    price: number
    image: string
    category: string
    /** the collection's "Options (JSON)" field: [{"name":"Size","values":["34","36"]}] */
    options: string
}
const productStore = createStore<Record<string, RawProduct>>({})
let pending: Record<string, RawProduct> = {}
let flushQueued = false
export function registerProduct(p: RawProduct) {
    if (!p || !p.slug) return
    const cur = productStore.get()[p.slug]
    if (cur && JSON.stringify(cur) === JSON.stringify(p)) return
    pending[p.slug] = p
    if (flushQueued) return
    flushQueued = true
    Promise.resolve().then(() => {
        flushQueued = false
        const add = pending
        pending = {}
        productStore.set((s) => ({ ...s, ...add }))
    })
}
const P0: Record<string, RawProduct> = {}
/** The option values of one name ("Size") out of the collection's Options (JSON) text. */
export function optionValues(json: string, name: string): string[] {
    if (!json) return []
    try {
        const list = JSON.parse(json)
        const want = name.trim().toLowerCase()
        const opt = Array.isArray(list) ? list.find((o: any) => String(o?.name || "").trim().toLowerCase() === want) : null
        return opt && Array.isArray(opt.values) ? opt.values.map((v: any) => String(v)) : []
    } catch (e) {
        return []
    }
}
/** The synced row of one product (title, price, image, sizes) by slug. */
export function useProduct(slug: string): RawProduct | undefined {
    const map = useSyncExternalStore(productStore.subscribe, productStore.get, () => P0)
    return slug ? map[slug] : undefined
}
/** Every product, joined with its look (from Looks → Shop Pieces) and Shopify's live colour and short line. */
export function useProducts(): IndexedProduct[] {
    const map = useSyncExternalStore(productStore.subscribe, productStore.get, () => P0)
    const salon = useSyncExternalStore(salonStore.subscribe, salonStore.get, () => S0)
    const shop = useShop()
    const slugs = Object.keys(map)
    // one round of requests brings price, stock, colour and short line for the whole shop
    const live = useLiveMap(slugs)
    return useMemo(() => {
        const lookOf: Record<string, IndexedLook> = {}
        Object.values(salon.links).forEach((l) => {
            const look = salon.looks[l.look]
            if (look && !lookOf[l.slug]) lookOf[l.slug] = look
        })
        return Object.values(map).map((p) => {
            const l = live[p.slug]
            const look = lookOf[p.slug]
            return {
                slug: p.slug,
                title: p.title,
                colour: l?.meta?.colour || "",
                price: livePrice(l, p.price),
                image: p.image,
                category: p.category,
                short: l?.meta?.shortLine || "",
                look: look?.title || "",
                lookSlug: look?.slug || "",
                sizes: liveSizes(l, optionValues(p.options, shop.sizeOption || "Size")).join(", "),
            }
        })
    }, [map, salon, live, shop.sizeOption])
}

/* ------------------------------------------------------------ salon index */
// Filled at runtime by the hidden "Salon looks" list (and, inside each look, the
// list of its Shop Pieces), so the hero, the look page, search and the bag know
// which products make up which look.
export interface IndexedLook {
    code: string
    slug?: string
    title: string
    intro: string
    image: string
    order: number
}
export interface IndexedPiece {
    slug: string
    look: string // the look's Code
    name: string
    material: string
    price: number
    image: string
    sizes: string
    soldOut: string
    sizeLabel?: string
    category?: string
    order: number
}
export interface SalonIndexData {
    looks: Record<string, IndexedLook>
    pieces: Record<string, IndexedPiece>
}
/** "This product belongs to that look": one per entry of Looks → Shop Pieces. */
export interface PieceLink {
    slug: string
    look: string // the look's Code
    order: number
}
interface SalonRaw {
    looks: Record<string, IndexedLook>
    links: Record<string, PieceLink>
}
const salonStore = createStore<SalonRaw>({ looks: {}, links: {} })
let salonPending: SalonRaw = { looks: {}, links: {} }
let salonQueued = false
function queueSalon() {
    if (salonQueued) return
    salonQueued = true
    Promise.resolve().then(() => {
        salonQueued = false
        const add = salonPending
        salonPending = { looks: {}, links: {} }
        salonStore.set((s) => ({ looks: { ...s.looks, ...add.looks }, links: { ...s.links, ...add.links } }))
    })
}
export function registerLook(l: IndexedLook) {
    if (!l || !l.code) return
    const cur = salonStore.get().looks[l.code]
    if (cur && JSON.stringify(cur) === JSON.stringify(l)) return
    salonPending.looks[l.code] = l
    queueSalon()
}
export function registerPiece(p: PieceLink) {
    if (!p || !p.slug || !p.look) return
    const key = `${p.look}|${p.slug}`
    const cur = salonStore.get().links[key]
    if (cur && cur.order === p.order) return
    salonPending.links[key] = p
    queueSalon()
}
const S0: SalonRaw = { looks: {}, links: {} }
/** Looks and their pieces: the links from the CMS, joined with each product's synced row and Shopify's live data. */
export function useSalonIndex(): SalonIndexData {
    const raw = useSyncExternalStore(salonStore.subscribe, salonStore.get, () => S0)
    const map = useSyncExternalStore(productStore.subscribe, productStore.get, () => P0)
    const shop = useShop()
    const live = useLiveMap(Object.values(raw.links).map((l) => l.slug))
    return useMemo(() => {
        const pieces: Record<string, IndexedPiece> = {}
        Object.entries(raw.links).forEach(([key, link]) => {
            const p = map[link.slug]
            if (!p) return
            const l = live[link.slug]
            const sizes = liveSizes(l, optionValues(p.options, shop.sizeOption || "Size"))
            pieces[key] = {
                slug: link.slug,
                look: link.look,
                name: p.title,
                material: l?.meta?.shortLine || "",
                price: livePrice(l, p.price),
                image: p.image,
                sizes: sizes.join(", "),
                soldOut: liveSold(l, sizes, []).join(", "),
                // pieces that share a size run share one size choice on the look page
                sizeLabel: sizes.join(","),
                category: p.category,
                order: link.order,
            }
        })
        return { looks: raw.looks, pieces }
    }, [raw, map, live, shop.sizeOption])
}

/* --------------------------------------------------------------- look sizes */
// The size chosen per size system ("Clothing, French", "Shoes, EU"…) on a Look
// page, shared by Look purchase and every piece's own Add button.
const sizeStore = createStore<Record<string, string>>({})
export function setLookSize(label: string, size: string) {
    if (!label || sizeStore.get()[label] === size) return
    sizeStore.set((s) => ({ ...s, [label]: size }))
}
const Z0: Record<string, string> = {}
export function useLookSizes(): Record<string, string> {
    return useSyncExternalStore(sizeStore.subscribe, sizeStore.get, () => Z0)
}
/* ------------------------------------------------------------ shopify live */
export interface Shop {
    domain: string
    token: string
    sizeOption: string
}
export interface LiveVariant {
    id: string
    available: boolean
    price: number
}
export interface LiveProduct {
    found: boolean
    price: number
    available: boolean
    /** variants by lower-cased size value */
    sizes: Record<string, LiveVariant>
    /** the size values as Shopify lists them, in Shopify's order */
    sizeList: string[]
    /** the only variant, for pieces sold without a size */
    single?: LiveVariant
    /** the product's custom.* metafields; any of them may be empty */
    meta: { colour: string; colourHex: string; shortLine: string; composition: string; care: string; madeIn: string }
    description: string
    /** the price before a reduction, 0 when there is none */
    compareAt: number
    images: string[]
    /** every option as Shopify lists it (Size, Color…), with a swatch colour where Shopify has one */
    options: { name: string; values: { name: string; swatch: string }[] }[]
    /** every variant, with its option values keyed by lower-cased option name */
    variants: (LiveVariant & { compareAt: number; image: string; opts: Record<string, string> })[]
}
const NO_META = { colour: "", colourHex: "", shortLine: "", composition: "", care: "", madeIn: "" }
const META_KEYS: [keyof typeof NO_META, string][] = [["colour", "colour"], ["colourHex", "colour_hex"], ["shortLine", "short_line"], ["composition", "composition"], ["care", "care"], ["madeIn", "made_in"]]
const MISSING: LiveProduct = { found: false, price: 0, available: false, sizes: {}, sizeList: [], meta: NO_META, description: "", compareAt: 0, images: [], options: [], variants: [] }
/** The variant for a full choice of option values (lower-cased option name → value). */
export function findVariant(l: LiveProduct | undefined, choice: Record<string, string>) {
    if (!l || !l.found) return undefined
    return l.variants.find((v) => Object.keys(v.opts).every((k) => choice[k] === undefined || v.opts[k].toLowerCase() === String(choice[k]).toLowerCase()))
}
const API_VERSION = "2026-07"
const cleanDomain = (d: string) => d.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "")
const shopStore = createStore<Shop>({ domain: SHOPIFY.store, token: SHOPIFY.token, sizeOption: SHOPIFY.sizeOption || "Size" })
const SHOP0: Shop = { domain: "", token: "", sizeOption: "Size" }
export const getShop = () => shopStore.get()
export const shopReady = (s: Shop = shopStore.get()) => !!(s.domain && s.token)
const SHOP_KEY = "ombrine-shop-v1"
/** Called by the Shopify Settings card (and by findShop below) with the shop to sell through. */
export function setShop(s: Partial<Shop>) {
    if (!s.domain || !s.token) return
    const cur = shopStore.get()
    const next = { domain: s.domain, token: s.token, sizeOption: s.sizeOption || cur.sizeOption || "Size" }
    if (cur.domain === next.domain && cur.token === next.token && cur.sizeOption === next.sizeOption) return
    shopStore.set(next)
    try {
        window.localStorage.setItem(SHOP_KEY, JSON.stringify(next))
    } catch (e) {}
}
// The Shopify Settings card sits on the Home page only. On Home it hands the
// shop over itself; on every other page the shop is read from the Home page's
// published HTML (the card prints it there as data-ombrine-shop) and kept in
// localStorage, so a visitor who lands on a product page still gets Shopify.
let shopSought = false
function readShopAttr(raw: string | null | undefined): Partial<Shop> | null {
    if (raw == null) return null
    try {
        return JSON.parse(raw.replace(/&quot;/g, '"').replace(/&amp;/g, "&")) || {}
    } catch (e) {
        return null
    }
}
export function findShop() {
    if (shopSought || typeof window === "undefined") return
    shopSought = true
    if (shopReady()) return
    const here = readShopAttr(document.querySelector("[data-ombrine-shop]")?.getAttribute("data-ombrine-shop"))
    if (here && here.domain && here.token) return setShop(here)
    try {
        const saved = window.localStorage.getItem(SHOP_KEY)
        if (saved) setShop(JSON.parse(saved))
        // looked a moment ago and Home had no shop: do not fetch Home again on every page load
        if (!saved && Date.now() - Number(window.sessionStorage.getItem(SHOP_KEY) || 0) < 300000) return
    } catch (e) {}
    fetch("/")
        .then((r) => (r.ok ? r.text() : ""))
        .then((html) => {
            const m = html.match(/data-ombrine-shop="([^"]*)"/)
            const cfg = m ? readShopAttr(m[1]) : null
            if (cfg && cfg.domain && cfg.token) return setShop(cfg)
            try {
                window.sessionStorage.setItem(SHOP_KEY, String(Date.now()))
                // the card is there and empty: the shop was disconnected
                if (cfg) window.localStorage.removeItem(SHOP_KEY)
            } catch (e) {}
        })
        .catch(() => {})
}
export function useShop(): Shop {
    return useSyncExternalStore(shopStore.subscribe, shopStore.get, () => SHOP0)
}

export async function storefront(query: string, variables: Record<string, any> = {}, shop: Shop = shopStore.get()) {
    const res = await fetch(`https://${cleanDomain(shop.domain)}/api/${API_VERSION}/graphql.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": shop.token.trim() },
        body: JSON.stringify({ query, variables }),
    })
    const json = await res.json()
    if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors || res.status))
    return json.data
}

const liveStore = createStore<Record<string, LiveProduct>>({})
const L0: Record<string, LiveProduct> = {}
const asked = new Set<string>()
let liveQueue: string[] = []
let liveTimer: any = 0

/** Fetches price and availability for these handles, 20 per request. */
export async function loadLive(handles: string[]): Promise<Record<string, LiveProduct>> {
    const shop = shopStore.get()
    const want = (shop.sizeOption || "Size").trim().toLowerCase()
    const out: Record<string, LiveProduct> = {}
    for (let i = 0; i < handles.length; i += 20) {
        const chunk = handles.slice(i, i + 20)
        const query = `query Live { ${chunk
            .map(
                (h, k) =>
                    `p${k}: product(handle: ${JSON.stringify(h)}) { availableForSale description priceRange { minVariantPrice { amount currencyCode } } compareAtPriceRange { minVariantPrice { amount } } metafields(identifiers: [${META_KEYS.map(([, key]) => `{namespace:"custom",key:"${key}"}`).join(",")}]) { key value } options { name optionValues { name swatch { color } } } images(first: 10) { nodes { url } } variants(first: 60) { nodes { id availableForSale price { amount } compareAtPrice { amount } image { url } selectedOptions { name value } } } }`
            )
            .join(" ")} }`
        const data = await storefront(query, {}, shop)
        chunk.forEach((h, k) => {
            const p = data?.[`p${k}`]
            if (!p) {
                out[h] = MISSING
                return
            }
            const code = p.priceRange?.minVariantPrice?.currencyCode
            if (code) CURRENCY = code
            const nodes: any[] = p.variants?.nodes || []
            const variants = nodes.map((v) => {
                const opts: Record<string, string> = {}
                ;(v.selectedOptions || []).forEach((o: any) => (opts[String(o.name).trim().toLowerCase()] = String(o.value).trim()))
                return { id: v.id as string, available: v.availableForSale !== false, price: Number(v.price?.amount) || 0, compareAt: Number(v.compareAtPrice?.amount) || 0, image: (v.image?.url as string) || "", opts }
            })
            const options = ((p.options as any[]) || [])
                .filter((o) => !(o.name === "Title" && (o.optionValues || []).length === 1))
                .map((o) => ({ name: String(o.name), values: ((o.optionValues as any[]) || []).map((x) => ({ name: String(x.name), swatch: (x.swatch?.color as string) || "" })) }))
            // sizes: for a product with more options (colour…), those of its first value of each other option
            const first: Record<string, string> = {}
            options.forEach((o) => o.name.trim().toLowerCase() !== want && o.values[0] && (first[o.name.trim().toLowerCase()] = o.values[0].name.toLowerCase()))
            const sizes: Record<string, LiveVariant> = {}
            const sizeList: string[] = []
            variants.forEach((v) => {
                const value = v.opts[want]
                if (value === undefined || !Object.keys(first).every((n) => (v.opts[n] || "").toLowerCase() === first[n])) return
                if (!sizes[value.toLowerCase()]) sizeList.push(value)
                sizes[value.toLowerCase()] = { id: v.id, available: v.available, price: v.price }
            })
            const meta = { ...NO_META }
            ;((p.metafields as any[]) || []).forEach((m) => {
                const hit = m && META_KEYS.find(([, key]) => key === m.key)
                if (hit) meta[hit[0]] = String(m.value || "")
            })
            // no custom.colour metafield: a Color option says it just as well
            const colourOpt = options.find((o) => /^(colou?r|couleur|farbe)$/i.test(o.name.trim()))
            if (!meta.colour && colourOpt && colourOpt.values[0]) meta.colour = colourOpt.values.length === 1 ? colourOpt.values[0].name : colourOpt.values.map((x) => x.name).join(", ")
            if (!meta.colourHex && colourOpt && colourOpt.values[0]?.swatch) meta.colourHex = colourOpt.values[0].swatch
            out[h] = {
                found: true,
                price: Number(p.priceRange?.minVariantPrice?.amount) || 0,
                available: p.availableForSale !== false,
                sizes,
                sizeList,
                single: variants.length === 1 ? { id: variants[0].id, available: variants[0].available, price: variants[0].price } : undefined,
                meta,
                description: String(p.description || ""),
                compareAt: Number(p.compareAtPriceRange?.minVariantPrice?.amount) || 0,
                images: (((p.images?.nodes as any[]) || []).map((n) => n.url as string)).filter(Boolean),
                options,
                variants,
            }
        })
    }
    liveStore.set((s) => ({ ...s, ...out }))
    return out
}

function requestLive(handles: string[]) {
    if (typeof window === "undefined" || !shopReady()) return
    const fresh = handles.filter((h) => h && !asked.has(h))
    if (!fresh.length) return
    fresh.forEach((h) => asked.add(h))
    liveQueue.push(...fresh)
    if (liveTimer) return
    // one request for everything the page asks for in the same moment
    liveTimer = setTimeout(() => {
        liveTimer = 0
        const batch = liveQueue
        liveQueue = []
        // a failed request stays "asked": the page keeps its CMS values instead of retrying forever
        loadLive(batch).catch(() => {})
    }, 40)
}

/** Live Shopify data for every handle asked for so far; requests the ones given. */
export function useLiveMap(slugs: string[]): Record<string, LiveProduct> {
    const shop = useShop()
    const map = useSyncExternalStore(liveStore.subscribe, liveStore.get, () => L0)
    const key = slugs.filter(Boolean).join(",")
    useEffect(() => {
        findShop()
        if (key && shop.domain && shop.token) requestLive(key.split(","))
    }, [key, shop.domain, shop.token])
    return map
}
/** Live Shopify data for one product; undefined while there is no shop or it is still loading. `found: false` = no such handle in the shop. */
export function useLive(slug: string): LiveProduct | undefined {
    return useLiveMap(slug ? [slug] : [])[slug]
}
// The image of the variant chosen on a product page (a colour), so the page's main picture can follow it.
const chosenImage = createStore<Record<string, string>>({})
const C0: Record<string, string> = {}
export function setChosenImage(slug: string, url: string) {
    if (!slug || chosenImage.get()[slug] === url) return
    chosenImage.set((s) => ({ ...s, [slug]: url }))
}
export function useChosenImage(slug: string): string {
    const map = useSyncExternalStore(chosenImage.subscribe, chosenImage.get, () => C0)
    return (slug && map[slug]) || ""
}
/** Re-renders the caller once Shopify has answered, so prices switch to the shop's currency. */
export function useShopCurrency(): string {
    useSyncExternalStore(liveStore.subscribe, liveStore.get, () => L0)
    return CURRENCY
}
/** The shop is connected and has no product with this handle: it cannot be bought. */
export const liveMissing = (l: LiveProduct | undefined) => !!l && !l.found
export const livePrice = (l: LiveProduct | undefined, cms: number) => (l && l.found && l.price > 0 ? l.price : Number(cms) || 0)
/** The sizes to offer: Shopify's own list when the product is live, otherwise the CMS list. */
export function liveSizes(l: LiveProduct | undefined, cms: string[]): string[] {
    if (!l || !l.found) return cms
    return l.sizeList.length ? l.sizeList : l.single ? [] : cms
}
/** Sold-out sizes: Shopify's when the product is live, otherwise the CMS list. */
export function liveSold(l: LiveProduct | undefined, sizes: string[], cmsSold: string[]): string[] {
    if (!l) return cmsSold
    if (!l.found) return sizes
    if (!Object.keys(l.sizes).length) return l.single && l.single.available ? [] : sizes
    return sizes.filter((s) => {
        const v = l.sizes[s.trim().toLowerCase()]
        return !v || !v.available
    })
}

const LANGS: Record<string, string> = { en: "EN", fr: "FR", ru: "RU", zh: "ZH_CN", ar: "AR", es: "ES" }
/** Bag → Shopify cart. Returns Shopify's checkout URL, or the pieces it could not match. */
export async function shopifyCheckout(items: { slug: string; name: string; size: string; qty: number; variantId?: string }[], lang: string) {
    const live = await loadLive(Array.from(new Set(items.map((i) => i.slug))))
    const lines: { merchandiseId: string; quantity: number }[] = []
    const missing: string[] = []
    for (const it of items) {
        const l = live[it.slug]
        // the exact variant when the piece was added with one (colour and size), otherwise by size
        // and a product with no size option at all goes in as its first variant in stock
        const v = l && l.found ? (it.variantId && l.variants.find((x) => x.id === it.variantId)) || l.sizes[String(it.size).trim().toLowerCase()] || l.single || (l.sizeList.length ? undefined : l.variants.find((x) => x.available)) : undefined
        if (!v || !v.available) missing.push(`${it.name} (${it.size})`)
        else lines.push({ merchandiseId: v.id, quantity: it.qty })
    }
    if (missing.length) return { url: "", missing }
    const created = await storefront(
        `mutation Cart($lines: [CartLineInput!]!) @inContext(language: ${LANGS[lang] || "EN"}) { cartCreate(input: { lines: $lines }) { cart { checkoutUrl } userErrors { message } } }`,
        { lines }
    )
    return { url: (created?.cartCreate?.cart?.checkoutUrl as string) || "", missing: [] as string[] }
}

/* ------------------------------------------------------------------ locale */
export function useLang(): string {
    const info = ((Framer as any).useLocaleInfo || (() => null))()
    const code: string = info?.activeLocale?.code || (typeof document !== "undefined" ? document.documentElement.lang : "") || "en"
    const l = code.slice(0, 2).toLowerCase()
    LANG = l
    return l
}

// The shop's currency once Shopify has answered; euros until then and without a shop.
let CURRENCY = "EUR"
/** Euros: €2,890 (en, zh) · 2 890 € (fr, ru) · 2.890 € (es) · 2,890 € (ar). Any other shop currency: the language's own format. */
export function formatPrice(n: number, lang: string = "en"): string {
    const whole = Math.abs((n || 0) - Math.round(n || 0)) < 0.005
    if (CURRENCY !== "EUR" || !whole) {
        try {
            return new Intl.NumberFormat(lang, { style: "currency", currency: CURRENCY, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(n || 0)
        } catch (e) {}
    }
    const int = Math.round(n || 0)
    const group = (sep: string) => String(int).replace(/\B(?=(\d{3})+(?!\d))/g, sep)
    switch (lang) {
        case "fr":
        case "ru":
            return `${group(" ")} €`
        case "es":
            return `${group(".")} €`
        case "ar":
            return `${group(",")} €`
        default:
            return `€${group(",")}`
    }
}

/* ------------------------------------------------------------------ router */
// Internal links go through Framer's router so they also work in Preview.
export function useNavigate() {
    const router = ((Framer as any).useRouter || (() => undefined))()
    return useCallback(
        (href: string, e?: { preventDefault?: () => void; metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean; button?: number }) => {
            if (!href) return
            if (e && (e.metaKey || e.ctrlKey || e.shiftKey || (e.button !== undefined && e.button !== 0))) return
            if (/^(https?:|mailto:|tel:)/.test(href)) {
                if (e?.preventDefault) e.preventDefault()
                window.open(href, "_blank", "noopener")
                return
            }
            const [rawPath, hash] = href.replace(/^\.\//, "/").split("#")
            const path = ("/" + rawPath.replace(/^\/+/, "")).replace(/\/+$/, "") || "/"
            const routes = router?.routes
            if (routes && router.navigate) {
                for (const [id, route] of Object.entries<any>(routes)) {
                    const pattern: string = route?.path
                    if (!pattern) continue
                    const a = pattern.split("/").filter(Boolean)
                    const b = path.split("/").filter(Boolean)
                    if (a.length !== b.length) continue
                    const vars: Record<string, string> = {}
                    let ok = true
                    a.forEach((seg, i) => {
                        if (seg.startsWith(":")) vars[seg.slice(1)] = b[i]
                        else if (seg !== b[i]) ok = false
                    })
                    if (ok) {
                        if (e?.preventDefault) e.preventDefault()
                        router.navigate(id, hash, Object.keys(vars).length ? vars : undefined)
                        return
                    }
                }
            }
            if (!e?.preventDefault) window.location.href = href
        },
        [router]
    )
}

/* ------------------------------------------------------------------ motion */
export function prefersReducedMotion(): boolean {
    if (typeof window === "undefined" || !window.matchMedia) return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function useReducedMotion(): boolean {
    return useSyncExternalStore(
        (cb) => {
            if (typeof window === "undefined" || !window.matchMedia) return () => {}
            const m = window.matchMedia("(prefers-reduced-motion: reduce)")
            m.addEventListener?.("change", cb)
            return () => m.removeEventListener?.("change", cb)
        },
        prefersReducedMotion,
        () => false
    )
}

/** Checkout hand-off: the buyer's checkout URL with the bag appended as query items. */
export function checkoutHref(base: string, items: BagItem[]): string {
    if (!base) return ""
    try {
        const url = new URL(base, typeof window !== "undefined" ? window.location.href : "https://example.com")
        url.searchParams.set("items", items.map((i) => `${i.slug}:${i.size}:${i.qty}`).join(","))
        return url.toString()
    } catch (e) {
        return base
    }
}

/* ------------------------------------------------------------------- fonts */
// One matched set per script. Latin + Cyrillic: Cormorant Garamond / Manrope.
// Chinese: Noto Serif SC / Noto Sans SC. Arabic: Amiri / Readex Pro.
let LANG = "en"
export function setLang(l: string) {
    LANG = l || "en"
}
export const ff = {
    serif: () => (LANG === "zh" ? `"Noto Serif SC", serif` : LANG === "ar" ? `"Amiri", serif` : `"Cormorant Garamond", serif`),
    sans: () => (LANG === "zh" ? `"Noto Sans SC", sans-serif` : LANG === "ar" ? `"Readex Pro", sans-serif` : `"Manrope", sans-serif`),
    italic: (): "italic" | "normal" => (LANG === "zh" || LANG === "ar" ? "normal" : "italic"),
    /** heading weight: Cormorant Light 300, Noto Serif SC Light 300, Amiri Regular 400 */
    light: () => (LANG === "ar" ? 400 : 300),
    /** product-name weight: Cormorant Medium 500, Noto Serif SC Regular 400, Amiri Regular 400 */
    medium: () => (LANG === "zh" || LANG === "ar" ? 400 : 500),
    /** body size: Chinese body runs 1 px smaller so the weight matches */
    body: (px: number) => (LANG === "zh" ? px - 1 : px),
}

const FONT_CSS: Record<string, string> = {
    latin: "family=Cormorant+Garamond:ital,wght@0,400;0,500;1,300;1,400&family=Manrope:wght@400;500",
    zh: "family=Noto+Serif+SC:wght@300;400&family=Noto+Sans+SC:wght@400;500",
    ar: "family=Amiri&family=Readex+Pro:wght@300;400",
}
/** Loads the fonts the code components need (Google Fonts, latin always, CJK/Arabic only when active). */
export function fontLink(lang: string) {
    const extra = lang === "zh" ? `&${FONT_CSS.zh}` : lang === "ar" ? `&${FONT_CSS.ar}` : ""
    return <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?${FONT_CSS.latin}${extra}&display=swap`} />
}

/* ------------------------------------------------------------------- theme */
// Light / Nuit. The colour styles carry both values; Framer applies the dark
// ones through a prefers-color-scheme media rule. To let visitors choose, we
// copy those token values into rules keyed on <html data-ombrine-theme>.
const THEME_KEY = "mrfiction-theme"
export type ThemeMode = "light" | "dark"
const themeStore = createStore<ThemeMode>("dark")
let themeReady = false

function collectTokenRules(): { light: string; dark: string } {
    let light = ""
    let dark = ""
    const visit = (rules: CSSRuleList, inDark: boolean, inLight: boolean) => {
        for (let i = 0; i < rules.length; i++) {
            const r: any = rules[i]
            if (r.media && r.cssRules) {
                const m = String(r.media.mediaText || "")
                visit(r.cssRules, inDark || /prefers-color-scheme:\s*dark/.test(m), inLight || /prefers-color-scheme:\s*light/.test(m))
            } else if (r.style) {
                const st = r.style as CSSStyleDeclaration
                if (!st) continue
                let decl = ""
                for (let j = 0; j < st.length; j++) {
                    const name = st[j]
                    if (name && name.startsWith("--token-")) decl += `${name}:${st.getPropertyValue(name)};`
                }
                if (!decl) continue
                if (inDark) dark += decl
                else if (!inLight) light += decl
            }
        }
    }
    try {
        for (const sheet of Array.from(document.styleSheets)) {
            try {
                visit((sheet as CSSStyleSheet).cssRules, false, false)
            } catch (e) {}
        }
    } catch (e) {}
    return { light, dark }
}

function ensureThemeCSS() {
    if (typeof document === "undefined") return
    if (document.getElementById("ombrine-theme-css")) return
    const { light, dark } = collectTokenRules()
    if (!dark) return
    const el = document.createElement("style")
    el.id = "ombrine-theme-css"
    el.textContent = `html[data-ombrine-theme="dark"] body{${dark}} html[data-ombrine-theme="light"] body{${light}} html{transition:background-color .6s}`
    document.head.appendChild(el)
}

function systemTheme(): ThemeMode {
    try {
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    } catch (e) {
        return "light"
    }
}

export function applyTheme(mode: ThemeMode, save = true) {
    if (typeof document === "undefined") return
    ensureThemeCSS()
    document.documentElement.setAttribute("data-ombrine-theme", mode)
    document.body?.setAttribute("data-framer-theme", mode)
    if (save) {
        try {
            window.localStorage.setItem(THEME_KEY, mode)
        } catch (e) {}
    }
    themeStore.set(mode)
}

function initTheme() {
    if (themeReady || typeof window === "undefined") return
    themeReady = true
    let saved: string | null = null
    try {
        saved = window.localStorage.getItem(THEME_KEY)
    } catch (e) {}
    const mode: ThemeMode = saved === "dark" || saved === "light" ? saved : "dark"
    themeStore.set(mode)
    // apply after Framer's styles are in the document
    setTimeout(() => applyTheme(mode, false), 0)
}

export function useTheme(): [ThemeMode, (m: ThemeMode) => void] {
    initTheme()
    const mode = useSyncExternalStore(themeStore.subscribe, themeStore.get, () => "dark" as ThemeMode)
    return [mode, applyTheme]
}
