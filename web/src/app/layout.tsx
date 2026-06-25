import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atletismo Chile",
  description: "Resultados y rankings de atletismo chileno",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        <header className="bg-wa-blue text-white sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-8">
            <Link href="/" className="font-bold text-lg tracking-tight">
              Atletismo Chile
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/toplists/100m/hombres" className="hover:text-wa-gold transition-colors">
                Toplists
              </Link>
              <Link href="/athletes" className="hover:text-wa-gold transition-colors">
                Atletas
              </Link>
              <Link href="/competitions" className="hover:text-wa-gold transition-colors">
                Campeonatos
              </Link>
            </nav>
            <div className="md:hidden ml-auto">
              <MobileNav />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-neutral-100 border-t text-neutral-500 text-xs py-6 text-center">
          Datos de atletismo.usplat.cl
        </footer>
      </body>
    </html>
  );
}

function MobileNav() {
  return (
    <details className="relative">
      <summary className="cursor-pointer list-none p-2">
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </summary>
      <div className="absolute right-0 top-full mt-1 bg-white text-neutral-900 rounded-lg shadow-lg py-2 min-w-[160px] z-50">
        <Link href="/toplists/100m/hombres" className="block px-4 py-2 hover:bg-neutral-50">
          Toplists
        </Link>
        <Link href="/athletes" className="block px-4 py-2 hover:bg-neutral-50">
          Atletas
        </Link>
        <Link href="/competitions" className="block px-4 py-2 hover:bg-neutral-50">
          Campeonatos
        </Link>
      </div>
    </details>
  );
}
