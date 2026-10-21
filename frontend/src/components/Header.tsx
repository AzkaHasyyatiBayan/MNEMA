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
  IconActivity,
  IconLock,
  IconUnlock,
} from "../lib/icons";

export function Header() {
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
    connectMetaMask,
  } = useLedger();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active navigation links - Slide deck removed as requested
  const navLinks = [
    { href: "/", label: "Notary Vault" },
    { href: "/verify", label: "Verify Proof" },
    { href: "/commit-reveal", label: "Commit-Reveal" },
    { href: "/guide", label: "System Guide" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-obsidian-700 bg-white/90 dark:bg-obsidian-950/85 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo - NO BORDER, NO CONTAINER BOX */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link href="/" className="flex items-center gap-3 group">
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

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 text-xs font-medium tracking-wide transition-colors ${
                      isActive
                        ? "text-memoryBlue dark:text-coldWhite border-b-2 border-memoryBlue font-semibold"
                        : "text-slate-600 dark:text-silverMist hover:text-memoryBlue dark:hover:text-coldWhite"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Control Bar (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Live Block Indicator */}
            <div className="flex items-center gap-2 px-2.5 py-1 text-xs text-slate-600 dark:text-silverMist font-mono-code bg-slate-100 dark:bg-obsidian-850 border border-slate-200 dark:border-obsidian-700">
              <span className="w-2 h-2 rounded-full bg-signalLilac animate-pulse" />
              <span>Block #{blockNumber}</span>
            </div>

            {/* Circuit Breaker Status if Paused */}
            {isPaused && (
              <span className="px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800">
                PAUSED
              </span>
            )}

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 text-slate-600 dark:text-silverMist hover:text-slate-900 dark:hover:text-coldWhite bg-slate-100 dark:bg-obsidian-850 border border-slate-200 dark:border-obsidian-700 transition-colors"
              title={theme === "dark" ? "Beralih ke Light Mode" : "Beralih ke Dark Mode"}
            >
              {theme === "dark" ? (
                <IconSun className="w-4 h-4 text-amber-300" />
              ) : (
                <IconMoon className="w-4 h-4 text-memoryBlue" />
              )}
            </button>

            {/* Mode Switcher (Simulator vs MetaMask) */}
            <div className="flex items-center bg-slate-100 dark:bg-obsidian-850 border border-slate-200 dark:border-obsidian-700 p-0.5 text-xs">
              <button
                onClick={() => setMode("simulator")}
                className={`px-2.5 py-1 font-medium transition-colors ${
                  mode === "simulator"
                    ? "bg-memoryBlue text-coldWhite shadow-sm"
                    : "text-slate-600 dark:text-silverMist hover:text-slate-900 dark:hover:text-coldWhite"
                }`}
              >
                Simulator
              </button>
              <button
                onClick={() => {
                  if (!metaMaskAddress) {
                    connectMetaMask();
                  } else {
                    setMode("metamask");
                  }
                }}
                className={`px-2.5 py-1 font-medium transition-colors ${
                  mode === "metamask"
                    ? "bg-memoryBlue text-coldWhite shadow-sm"
                    : "text-slate-600 dark:text-silverMist hover:text-slate-900 dark:hover:text-coldWhite"
                }`}
              >
                {metaMaskAddress ? "MetaMask" : "Connect"}
              </button>
            </div>

            {/* Persona Switcher Dropdown (Simulator) */}
            {mode === "simulator" && (
              <div className="relative">
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono-code bg-slate-100 dark:bg-obsidian-850 hover:bg-slate-200 dark:hover:bg-obsidian-800 border border-slate-200 dark:border-obsidian-700 text-slate-800 dark:text-coldWhite transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-memoryBlue" />
                  <span className="font-semibold text-memoryBlue dark:text-signalLilac">
                    {currentAccount.role}
                  </span>
                  <span className="text-slate-500 dark:text-silverMist hidden lg:inline">
                    ({currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)})
                  </span>
                </button>

                {isAccountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-700 shadow-2xl p-2 z-50">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-silverMist px-2 py-1 uppercase tracking-wider border-b border-slate-100 dark:border-obsidian-800">
                      Ganti Aktor Simulasi (RBAC)
                    </div>
                    <div className="mt-1 space-y-1">
                      {PRESET_ACCOUNTS.map((acc) => {
                        const isSelected = acc.address === currentAccount.address;
                        return (
                          <button
                            key={acc.address}
                            onClick={() => {
                              switchAccount(acc.address);
                              setIsAccountMenuOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 text-xs flex flex-col transition-colors ${
                              isSelected
                                ? "bg-memoryBlue/10 dark:bg-memoryBlue/20 text-slate-900 dark:text-coldWhite border-l-2 border-memoryBlue"
                                : "text-slate-600 dark:text-silverMist hover:bg-slate-50 dark:hover:bg-obsidian-800 hover:text-slate-900 dark:hover:text-coldWhite"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800 dark:text-coldWhite">
                                {acc.role}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] text-memoryBlue dark:text-signalLilac font-mono-code">
                                  Active
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-silverMist/80">
                              {acc.label}
                            </span>
                            <span className="font-mono-code text-[10px] text-slate-400 dark:text-silverMist/60 mt-0.5">
                              {acc.address}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Admin Circuit Breaker Toggle */}
                    {currentAccount.role === "Super Admin" && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-obsidian-800 px-2">
                        <button
                          onClick={() => togglePause()}
                          className={`w-full py-1 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                            isPaused
                              ? "bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-700 dark:text-emerald-300"
                              : "bg-red-100 dark:bg-red-950/60 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-300"
                          }`}
                        >
                          {isPaused ? <IconUnlock className="w-3.5 h-3.5" /> : <IconLock className="w-3.5 h-3.5" />}
                          {isPaused ? "Unpause Contract" : "Trigger Emergency Pause"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Actions: Theme + Burger Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-silverMist hover:text-slate-900 dark:hover:text-coldWhite bg-slate-100 dark:bg-obsidian-850 border border-slate-200 dark:border-obsidian-700 transition-colors"
              title="Toggle Theme"
            >
              {theme === "dark" ? (
                <IconSun className="w-4 h-4 text-amber-300" />
              ) : (
                <IconMoon className="w-4 h-4 text-memoryBlue" />
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-silverMist hover:text-slate-900 dark:hover:text-coldWhite bg-slate-100 dark:bg-obsidian-850 border border-slate-200 dark:border-obsidian-700 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <IconX className="w-5 h-5 text-slate-900 dark:text-coldWhite" />
              ) : (
                <IconMenu className="w-5 h-5 text-slate-900 dark:text-coldWhite" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-obsidian-700 bg-white dark:bg-obsidian-950 px-4 pt-3 pb-6 space-y-4 shadow-xl">
          {/* Navigation Links */}
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-memoryBlue/10 dark:bg-obsidian-800 text-memoryBlue dark:text-coldWhite font-bold border-l-4 border-memoryBlue"
                      : "text-slate-600 dark:text-silverMist hover:bg-slate-50 dark:hover:bg-obsidian-900 hover:text-slate-900 dark:hover:text-coldWhite"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Provider Mode & Persona Selection */}
          <div className="pt-3 border-t border-slate-200 dark:border-obsidian-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-silverMist">
              <span>Mode Jaringan:</span>
              <div className="flex items-center bg-slate-100 dark:bg-obsidian-850 border border-slate-200 dark:border-obsidian-700 p-0.5">
                <button
                  onClick={() => setMode("simulator")}
                  className={`px-2.5 py-1 text-xs font-medium ${
                    mode === "simulator"
                      ? "bg-memoryBlue text-coldWhite"
                      : "text-slate-600 dark:text-silverMist"
                  }`}
                >
                  Simulator
                </button>
                <button
                  onClick={() => {
                    if (!metaMaskAddress) connectMetaMask();
                    else setMode("metamask");
                  }}
                  className={`px-2.5 py-1 text-xs font-medium ${
                    mode === "metamask"
                      ? "bg-memoryBlue text-coldWhite"
                      : "text-slate-600 dark:text-silverMist"
                  }`}
                >
                  {metaMaskAddress ? "MetaMask" : "Connect"}
                </button>
              </div>
            </div>

            {/* Persona Switcher on Mobile */}
            {mode === "simulator" && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-silverMist uppercase tracking-wider">
                  Aktor Aktif:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_ACCOUNTS.map((acc) => {
                    const isSelected = acc.address === currentAccount.address;
                    return (
                      <button
                        key={acc.address}
                        onClick={() => {
                          switchAccount(acc.address);
                        }}
                        className={`p-2 text-left text-xs border transition-colors ${
                          isSelected
                            ? "bg-memoryBlue text-coldWhite border-memoryBlue font-bold"
                            : "bg-slate-50 dark:bg-obsidian-900 text-slate-700 dark:text-silverMist border-slate-200 dark:border-obsidian-800"
                        }`}
                      >
                        <div className="font-semibold truncate">{acc.role}</div>
                        <div className="text-[10px] opacity-80 truncate">{acc.address.slice(0, 8)}...</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
