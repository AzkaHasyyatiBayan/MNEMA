import Link from "next/link";
import { IconShield } from "../lib/icons";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-750 flex items-center justify-center text-memoryBlue shadow-md">
        <IconShield className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-coldWhite">
          404 — Record Tidak Ditemukan
        </h1>
        <p className="text-xs text-slate-600 dark:text-silverMist max-w-md">
          Halaman atau entri ledger yang Anda tuju tidak tercatat dalam state routing MNEMA.
        </p>
      </div>
      <Link
        href="/"
        className="px-4 py-2 rounded-xl bg-memoryBlue hover:bg-memoryBlue-600 text-white font-bold text-xs shadow-md shadow-memoryBlue/25 transition-all"
      >
        Kembali ke Notary Vault
      </Link>
    </div>
  );
}
