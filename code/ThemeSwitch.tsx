// Theme switch — Light / Nuit for the whole site.
// Remembers the visitor's choice; the first visit follows the OS setting.
import * as React from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion } from "framer-motion"
import { T, useTheme } from "./OmbrineStore.tsx"

interface ThemeSwitchProps {
    label: string
    onDark: boolean
    style?: React.CSSProperties
}

function Sun({ color }: { color: string }) {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M7 9.7C8.49 9.7 9.7 8.49 9.7 7C9.7 5.51 8.49 4.3 7 4.3C5.51 4.3 4.3 5.51 4.3 7C4.3 8.49 5.51 9.7 7 9.7Z" stroke={color} strokeWidth="1.1" />
            <path d="M7 .9V2.2M7 11.8V13.1M.9 7H2.2M11.8 7H13.1M2.69 2.69l.92.92M10.39 10.39l.92.92M2.69 11.31l.92-.92M10.39 3.61l.92-.92" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
        </svg>
    )
}
function Moon({ color }: { color: string }) {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M12.2 8.6A5.4 5.4 0 0 1 5.4 1.8 5.4 5.4 0 1 0 12.2 8.6Z" stroke={color} strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
    )
}

/**
 * Theme switch
 *
 * @framerIntrinsicWidth 54
 * @framerIntrinsicHeight 28
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ThemeSwitch(props: ThemeSwitchProps) {
    const { label = "Switch between light and Nuit", onDark = false, style } = props
    const isStatic = useIsStaticRenderer()
    const [mode, setMode] = useTheme()
    const dark = !isStatic && mode === "dark"
    const bone = "#EEE7DC"
    const knob = onDark ? bone : T.ink
    const line = onDark ? "rgba(238,231,220,0.28)" : T.outline
    const soft = onDark ? "#A39A8E" : T.inkSoft
    return (
        <button
            role="switch"
            aria-checked={dark}
            aria-label={label}
            onClick={() => setMode(dark ? "light" : "dark")}
            style={{
                ...style,
                position: "relative",
                width: 54,
                height: 28,
                boxSizing: "border-box",
                borderRadius: 14,
                border: `1px solid ${line}`,
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingInline: 3,
            }}
        >
            <motion.span
                aria-hidden
                initial={false}
                animate={{ x: dark ? 26 : 0 }}
                transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
                style={{ position: "absolute", left: 2, top: 2, width: 22, height: 22, borderRadius: 11, background: knob }}
            />
            <span style={{ position: "relative", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sun color={onDark ? (dark ? soft : "#100E0C") : dark ? soft : bone} />
            </span>
            <span style={{ position: "relative", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Moon color={onDark ? (dark ? "#100E0C" : soft) : dark ? "#100E0C" : soft} />
            </span>
        </button>
    )
}

addPropertyControls(ThemeSwitch as any, {
    label: { type: ControlType.String, title: "Label", defaultValue: "Switch between light and Nuit", description: "Read by screen readers." },
    onDark: { type: ControlType.Boolean, title: "On dark band", defaultValue: false, description: "Turn on when the switch sits on the Nuit footer." },
})
