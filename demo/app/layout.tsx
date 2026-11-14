import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TransitionProvider } from "../components/TransitionProvider";

export const metadata: Metadata = {
  title: "MR. FICTION — Motion Study",
  description: "A motion-led streetwear storefront experiment for MR. FICTION, Dhaka.",
  applicationName: "MR. FICTION",
};
export const viewport: Viewport = { themeColor: "#090909", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><TransitionProvider>{children}</TransitionProvider></body></html>;
}
