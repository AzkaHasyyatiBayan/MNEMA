"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLedger } from "../lib/LedgerContext";
import { PRESET_ACCOUNTS } from "../lib/web3";
import {
  IconLogo,
  IconSun,
  IconMoon,
  IconMenu,
  IconX,
  IconShield,
  IconCheckCircle,
  IconLock,
  IconUnlock,
  IconBookOpen,
  IconActivity,
  IconCopy,
} from "../lib/icons";

export function Sidebar() {
  const pathname = usePathname();
  const {
    mode,
    setMode,
    theme,
    toggleTheme,
    currentAccount,
    switchAccount,
    isPaused,
    togglePause,
    blockNumber,
    contractAddress,
    metaMaskAddress,
    metaMaskNetwork,
    metaMaskError,
    connectMetaMask,
  } = useLedger();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Notary Vault", icon: IconShield },
    { href: "/verify", label: "Verify Proof", icon: IconCheckCircle },
    { href: "/commit-reveal", label: "Commit-Reveal", icon: IconLock },
    { href: "/guide", label: "System Guide", icon: IconBookOpen },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      {/* MOBILE TOPBAR (Visible only on screens < md) */}
      <div className="md:hidden sticky top-0 z-40 bg-white/95 dark:bg-obsidian-950/90 backdrop-blur-md border-b border-slate-200 dark:border-obsidian-700/80 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <IconLogo className="w-7 h-7" />
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-widest text-slate-900 dark:text-coldWhite">
              MNEMA
            </span>
            <span className="text-[9px] tracking-wider text-slate-500 dark:text-silverMist uppercase">
              Provenance Ledger
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-obsidian-850 border border-slate-200 dark:border-obsidian-700 text-slate-700 dark:text-silverMist transition-colors"
            title="Toggle Theme"
            suppressHydrationWarning
          >
            {theme === "dark" ? (
              <IconSun className="w-4 h-4 text-amber-300" />
            ) : (
              <IconMoon className="w-4 h-4 text-memoryBlue" />
            )}
          </button>

          {/* Hamburger Toggle */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-obsidian-850 border border-slate-200 dark:border-obsidian-700 text-slate-800 dark:text-coldWhite transition-colors"
            aria-label="Toggle Menu"
          >
            {isMobileOpen ? <IconX className="w-5 h-5" /> : <IconMenu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-slate-950/50 dark:bg-black/70 backdrop-blur-sm"
        />
      )}

      {/* SIDEBAR CONTAINER (Desktop Fixed + Mobile Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 md:w-64 bg-white dark:bg-obsidian-950/95 backdrop-blur-xl border-r border-slate-200 dark:border-obsidian-700/80 p-5 flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          {/* Logo Brand - NO BORDER, NO BOX CONTAINER */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-obsidian-800">
            <Link
              href="/"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-3 group"
            >
              <IconLogo className="w-8 h-8 transition-transform group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-widest text-slate-900 dark:text-coldWhite">
                  MNEMA
                </span>
                <span className="text-[10px] tracking-wider text-slate-500 dark:text-silverMist uppercase">
                  Provenance Ledger
                </span>
              </div>
            </Link>

            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:text-silverMist dark:hover:text-coldWhite"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>

          {/* Active Persona / Account Card */}
          <div className="relative">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-800 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-silverMist">
                  Role Aktif (RBAC)
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono-code bg-blue-50 dark:bg-memoryBlue/20 text-blue-700 dark:text-signalLilac border border-blue-200 dark:border-memoryBlue/30">
                  {currentAccount.role}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono-code text-slate-800 dark:text-silverMist font-medium">
                <span>{currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}</span>
                <button
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="text-[11px] font-sans font-bold text-memoryBlue hover:underline"
                >
                  Ganti
                </button>
              </div>
            </div>

            {/* Persona Dropdown */}
            {isAccountDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 rounded-xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-700 p-2 shadow-2xl z-50 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-silverMist/70 px-2 py-1">
                  Pilih Aktor Simulasi
                </div>
                {PRESET_ACCOUNTS.map((acc) => {
                  const isSelected = acc.address === currentAccount.address;
                  return (
                    <button
                      key={acc.address}
                      onClick={() => {
                        switchAccount(acc.address);
                        setIsAccountDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex flex-col ${
                        isSelected
                          ? "bg-blue-50 dark:bg-memoryBlue/20 text-blue-700 dark:text-coldWhite font-bold"
                          : "text-slate-700 dark:text-silverMist hover:bg-slate-50 dark:hover:bg-obsidian-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{acc.role}</span>
                        {isSelected && <span className="text-[9px] font-bold text-memoryBlue dark:text-signalLilac">Active</span>}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-silverMist/60 font-mono-code truncate">
                        {acc.address}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-silverMist/60 px-2 py-1">
              Modul Sistem
            </div>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-memoryBlue text-white shadow-md shadow-memoryBlue/25 font-bold"
                      : "text-slate-700 dark:text-silverMist hover:bg-slate-100 dark:hover:bg-obsidian-850 hover:text-slate-900 dark:hover:text-coldWhite"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Network Vitals Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-800 space-y-2 text-xs shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-silverMist font-bold">
                Network Status
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-[11px] text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isPaused ? "Paused" : "Live (EVM)"}</span>
              </div>
            </div>

            <div className="flex items-center justify-between font-mono-code text-[11px] text-slate-800 dark:text-silverMist font-medium">
              <span>Block Height</span>
              <span className="font-extrabold text-slate-900 dark:text-coldWhite">#{blockNumber}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-obsidian-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-silverMist">
              <span className="truncate max-w-[120px] font-mono-code">{contractAddress}</span>
              <button
                onClick={() => copyToClipboard(contractAddress)}
                className="text-memoryBlue hover:underline flex items-center gap-0.5 font-bold"
                title="Salin Alamat Kontrak"
              >
                <IconCopy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Sidebar Controls */}
        <div className="pt-4 border-t border-slate-200 dark:border-obsidian-800 space-y-2.5">
          {/* Provider Mode Selection (Simulator vs MetaMask) */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-obsidian-850 border border-slate-200 dark:border-obsidian-700 p-1 text-xs">
            <button
              onClick={() => setMode("simulator")}
              className={`flex-1 py-1.5 rounded-lg text-center font-bold transition-all ${
                mode === "simulator"
                  ? "bg-memoryBlue text-white shadow-sm"
                  : "text-slate-600 dark:text-silverMist hover:text-slate-900 dark:hover:text-coldWhite"
              }`}
            >
              Simulator
            </button>
            <button
              onClick={() => {
                if (!metaMaskAddress) connectMetaMask();
                else setMode("metamask");
              }}
              className={`flex-1 py-1.5 rounded-lg text-center font-bold transition-all ${
                mode === "metamask"
                  ? "bg-memoryBlue text-white shadow-sm"
                  : "text-slate-600 dark:text-silverMist hover:text-slate-900 dark:hover:text-coldWhite"
              }`}
            >
              {metaMaskAddress ? "MetaMask" : "Connect"}
            </button>
          </div>

          {/* Active Connected Wallet Indicator */}
          {mode === "metamask" && metaMaskAddress && (
            <div className="text-[10px] px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 font-mono-code flex items-center justify-between shadow-xs">
              <span className="font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Wallet:</span>
              </span>
              <span>{metaMaskAddress.slice(0, 6)}...{metaMaskAddress.slice(-4)}</span>
            </div>
          )}

          {/* MetaMask Detection / Connection Error Notice */}
          {metaMaskError && (
            <div className="text-[10px] p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 leading-snug">
              {metaMaskError}
            </div>
          )}

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-obsidian-850 dark:hover:bg-obsidian-800 border border-slate-200 dark:border-obsidian-700 text-xs font-semibold text-slate-800 dark:text-silverMist transition-colors shadow-xs"
            suppressHydrationWarning
          >
            <span className="flex items-center gap-2" suppressHydrationWarning>
              {theme === "dark" ? (
                <IconSun className="w-4 h-4 text-amber-400" />
              ) : (
                <IconMoon className="w-4 h-4 text-memoryBlue" />
              )}
              <span suppressHydrationWarning>Tema: {theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
            </span>
            <span className="text-[10px] font-mono-code uppercase font-bold text-slate-400 dark:text-silverMist/60" suppressHydrationWarning>
              {theme === "dark" ? "Obsidian" : "Slate"}
            </span>
          </button>

          {/* Emergency Pause Toggle for Super Admin */}
          {currentAccount.role === "Super Admin" && (
            <button
              onClick={() => togglePause()}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                isPaused
                  ? "bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                  : "bg-red-100 hover:bg-red-200 dark:bg-red-950/80 dark:hover:bg-red-900 text-red-900 dark:text-red-300 border border-red-300 dark:border-red-700"
              }`}
            >
              {isPaused ? <IconUnlock className="w-3.5 h-3.5" /> : <IconLock className="w-3.5 h-3.5" />}
              <span>{isPaused ? "Unpause Contract" : "Emergency Pause"}</span>
            </button>
          )}

          <div className="text-[10px] text-center text-slate-400 dark:text-silverMist/50 font-mono-code pt-1 font-medium">
            MNEMA Protocol • EVM Ledger
          </div>
        </div>
      </aside>
    </>
  );
}
