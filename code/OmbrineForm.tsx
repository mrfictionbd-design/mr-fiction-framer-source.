// Ombrine forms — the newsletter line in the footer and the fitting form on
// Stores. Submissions are POSTed as form data to "Send to" (Formspree, Basin,
// Mailchimp, Make, Zapier…). Leave it empty while designing: the form then
// just shows its thank-you state.
import * as React from "react"
import { useEffect, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { T, ff } from "./OmbrineStore.tsx"

interface Field {
    name: string
    label: string
    type: "text" | "email" | "select" | "textarea"
    options: string
    placeholder: string
    half: boolean
}
interface OmbrineFormProps {
    kind: "newsletter" | "fitting"
    action: string
    onDark: boolean
    placeholder: string
    submit: string
    sending: string
    thanks: string
    error: string
    fields: Field[]
    style?: React.CSSProperties
}

const plain: React.CSSProperties = { appearance: "none", background: "none", border: "none", padding: 0, margin: 0, font: "inherit", color: "inherit", cursor: "pointer" }

/**
 * Ombrine form
 *
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 52
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function OmbrineForm(props: OmbrineFormProps) {
    const {
        kind = "newsletter",
        action = "",
        onDark = false,
        placeholder = "Your email",
        submit = "Subscribe  →",
        sending = "Sending…",
        thanks = "Thank you — the next letter is yours.",
        error = "Something went wrong. Please try again.",
        fields = DEFAULT_FIELDS,
        style,
    } = props
    const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle")
    const [preset, setPreset] = useState<Record<string, string>>({})
    const ink = onDark ? "#EEE7DC" : T.ink
    const soft = onDark ? "#A39A8E" : T.inkSoft
    const line = onDark ? "rgba(238,231,220,0.35)" : T.outline

    // "Book a fitting" links can pre-select a house: /stores?house=Paris#contact
    useEffect(() => {
        if (kind !== "fitting" || typeof window === "undefined") return
        const read = () => {
            const p = new URLSearchParams(window.location.search)
            const h = p.get("house")
            if (h) setPreset((s) => ({ ...s, house: h, about: s.about || "" }))
        }
        read()
        const on = (e: Event) => {
            const h = (e as CustomEvent).detail
            if (h) setPreset((s) => ({ ...s, house: h }))
        }
        window.addEventListener("ombrine:house", on)
        return () => window.removeEventListener("ombrine:house", on)
    }, [kind])

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        setState("sending")
        if (!action) {
            setTimeout(() => setState("done"), 600)
            return
        }
        try {
            const res = await fetch(action, { method: "POST", body: data, headers: { Accept: "application/json" } })
            setState(res.ok ? "done" : "error")
        } catch (err) {
            setState("error")
        }
    }

    if (kind === "newsletter") {
        return (
            <form onSubmit={onSubmit} style={{ ...style, width: "100%", display: "flex", alignItems: "center", gap: 16, height: 52, borderBottom: `1px solid ${line}`, fontFamily: ff.sans() }}>
                {state === "done" ? (
                    <span style={{ fontSize: 15, color: ink }}>{thanks}</span>
                ) : (
                    <>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder={placeholder}
                            aria-label={placeholder}
                            style={{ flex: 1, minWidth: 0, height: 44, border: "none", outline: "none", background: "transparent", color: ink, fontFamily: "inherit", fontSize: 15, padding: 0 }}
                        />
                        <button type="submit" style={{ ...plain, color: ink, fontSize: 14, fontWeight: 500, letterSpacing: "0.004em", whiteSpace: "pre", minHeight: 44, opacity: state === "sending" ? 0.6 : 1 }}>
                            {state === "sending" ? sending : state === "error" ? error : submit}
                        </button>
                    </>
                )}
            </form>
        )
    }

    const label: React.CSSProperties = { fontSize: 12, letterSpacing: "0.006em", color: soft, marginBottom: 10, display: "block" }
    const box: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 48, border: "none", borderBottom: `1px solid ${line}`, background: "transparent", color: ink, fontFamily: "inherit", fontSize: 15, outline: "none", padding: 0, borderRadius: 0 }
    return (
        <form onSubmit={onSubmit} style={{ ...style, width: "100%", display: "flex", flexWrap: "wrap", gap: "32px 24px", fontFamily: ff.sans(), color: ink }}>
            {fields.map((f) => {
                const key = (f.name || f.label).toLowerCase()
                const width = f.half ? "calc(50% - 12px)" : "100%"
                return (
                    <label key={key} style={{ width, minWidth: 220, flexGrow: 1 }}>
                        <span style={label}>{f.label}</span>
                        {f.type === "select" ? (
                            <select name={key} defaultValue={preset[key] || undefined} key={preset[key] || "x"} style={{ ...box, cursor: "pointer" }}>
                                {(f.options || "")
                                    .split(",")
                                    .map((o) => o.trim())
                                    .filter(Boolean)
                                    .map((o) => (
                                        <option key={o} value={o}>
                                            {o}
                                        </option>
                                    ))}
                            </select>
                        ) : f.type === "textarea" ? (
                            <textarea name={key} placeholder={f.placeholder} rows={4} style={{ ...box, height: 120, resize: "vertical", paddingTop: 12 }} />
                        ) : (
                            <input name={key} type={f.type} required={f.type === "email"} placeholder={f.placeholder} style={box} />
                        )}
                    </label>
                )
            })}
            <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 20 }}>
                <button
                    type="submit"
                    disabled={state === "sending" || state === "done"}
                    style={{ ...plain, height: 52, padding: "0 32px", background: state === "done" ? T.oxblood : T.ink, color: state === "done" ? "#EEE7DC" : T.onInk, fontSize: 14, fontWeight: 500, letterSpacing: "0.004em", borderRadius: 2 }}
                >
                    {state === "sending" ? sending : state === "done" ? "✓" : submit}
                </button>
                {(state === "done" || state === "error") && <span style={{ fontSize: 14, color: state === "error" ? T.oxblood : soft }}>{state === "done" ? thanks : error}</span>}
            </div>
        </form>
    )
}

const DEFAULT_FIELDS: Field[] = [
    { name: "name", label: "Name", type: "text", options: "", placeholder: "Camille Laurent", half: true },
    { name: "email", label: "Email", type: "email", options: "", placeholder: "camille@email.com", half: true },
    { name: "about", label: "About", type: "select", options: "A fitting, An order, Alterations, Something else", placeholder: "", half: true },
    { name: "house", label: "House", type: "select", options: "Paris, Milan, Dubai, Shanghai", placeholder: "", half: true },
    { name: "message", label: "Message", type: "textarea", options: "", placeholder: "I would like to try the wrap coat in 38 and 40 on a Saturday morning.", half: false },
]

addPropertyControls(OmbrineForm as any, {
    kind: { type: ControlType.Enum, title: "Kind", options: ["newsletter", "fitting"], optionTitles: ["Newsletter line", "Fitting form"], defaultValue: "newsletter", displaySegmentedControl: true },
    action: { type: ControlType.String, title: "Send to", defaultValue: "", placeholder: "https://formspree.io/f/…", description: "Endpoint that receives a POST with the fields. Empty = demo mode (shows the thank-you state)." },
    onDark: { type: ControlType.Boolean, title: "On dark band", defaultValue: false, description: "Bone text for the Nuit footer." },
    placeholder: { type: ControlType.String, title: "Placeholder", defaultValue: "Your email", hidden: (p: any) => p.kind !== "newsletter" },
    submit: { type: ControlType.String, title: "Submit", defaultValue: "Subscribe  →" },
    sending: { type: ControlType.String, title: "Sending", defaultValue: "Sending…" },
    thanks: { type: ControlType.String, title: "Thanks", defaultValue: "Thank you — the next letter is yours." },
    error: { type: ControlType.String, title: "Error", defaultValue: "Something went wrong. Please try again." },
    fields: {
        type: ControlType.Array,
        title: "Fields",
        hidden: (p: any) => p.kind !== "fitting",
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Key", defaultValue: "field", description: "Sent as the field name. Use “house” for the store select." },
                label: { type: ControlType.String, title: "Label", defaultValue: "Field" },
                type: { type: ControlType.Enum, title: "Type", options: ["text", "email", "select", "textarea"], defaultValue: "text" },
                options: { type: ControlType.String, title: "Options", defaultValue: "", description: "Comma-separated, for selects." },
                placeholder: { type: ControlType.String, title: "Placeholder", defaultValue: "" },
                half: { type: ControlType.Boolean, title: "Half width", defaultValue: true },
            },
        },
        defaultValue: DEFAULT_FIELDS,
    },
})
