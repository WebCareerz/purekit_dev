import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PureKit - Free Online Developer Tools",
  description:
    "Privacy-first browser-based developer tools. Your data never leaves your device.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
