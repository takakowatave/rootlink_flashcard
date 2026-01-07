// app/layout.tsx
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/Header";

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
        </body>
        </html>
    );
}
