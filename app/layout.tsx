// app/layout.tsx
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "RootLink — Learn English Through Etymology",
    template: "%s | RootLink",
  },
  description:
    "Understand English words deeply by exploring their roots and origins. A vocabulary app for serious learners.",
  metadataBase: new URL("https://www.rootlink.app"),
  openGraph: {
    siteName: "RootLink",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
  },
};

export default function RootLayout({
    children,
    }: {
    children: React.ReactNode;
    }) {
    return (
        <html lang="ja">
        <body>
            <Toaster position="top-center" />
            <Header />
            {children}
            <Footer />
        </body>
        </html>
    );
}
