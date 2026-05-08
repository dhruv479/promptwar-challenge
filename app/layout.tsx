import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/firebase/AuthProvider";

export const metadata: Metadata = {
  title: "TripPulse",
  description: "Dynamic AI-generated travel itineraries",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-ink-50 text-slate-900 selection:bg-cyan-500/30">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
