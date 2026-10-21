import type { Metadata } from "next";
import "./globals.css";
import { LedgerProvider } from "../lib/LedgerContext";
import { Sidebar } from "../components/Sidebar";

export const metadata: Metadata = {
  title: "MNEMA — Decentralized Audit & Provenance Ledger",
  description:
    "Sistem Pencatatan Jejak Audit, Notaris Digital, dan Evidence Vault Lintas Organisasi Berbasis Blockchain EVM dan IPFS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="bg-slate-50 dark:bg-obsidian text-slate-900 dark:text-coldWhite min-h-screen antialiased selection:bg-memoryBlue selection:text-white transition-colors">
        <LedgerProvider>
          <div className="flex min-h-screen">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:pl-64 min-w-0">
              <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </main>

              <footer className="border-t border-slate-200 dark:border-obsidian-800 bg-white/70 dark:bg-obsidian-950/60 py-6 text-xs text-slate-500 dark:text-silverMist transition-colors mt-auto">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-coldWhite">MNEMA</span>
                    <span className="hidden sm:inline text-slate-300 dark:text-obsidian-700">|</span>
                    <span className="italic text-slate-600 dark:text-silverMist/80">
                      "A memory no one owns alone. Remembered by the network. Proven by the record."
                    </span>
                  </div>
                  <div className="font-mono-code text-[11px] text-slate-500 dark:text-silverMist">
                    <span>Enterprise Provenance Protocol</span>
                    <span className="mx-2 text-slate-300 dark:text-obsidian-700">•</span>
                    <span className="text-memoryBlue dark:text-signalLilac font-semibold">EVM &amp; IPFS Architecture</span>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </LedgerProvider>
      </body>
    </html>
  );
}
