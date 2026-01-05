// app/layout.tsx
import "./globals.css";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
    children,
    }: {
    children: React.ReactNode;
    }) {
    return (
        <html lang="ja">
        <body>
            <Toaster position="top-center" />
            {children}
        </body>
        </html>
    );
}
