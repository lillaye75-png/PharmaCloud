"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  LayoutDashboard, ShoppingCart, Package, Store, Network,
  BarChart3, Settings, Pill, Menu, X, LogOut, Tags,
  ClipboardList, TrendingUp, FolderTree, MessageCircle,
  Moon, Sun, Bell, Receipt, Truck, FileSpreadsheet, Smartphone,
  ChevronRight, User, Globe,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { t, getLocale, setLocale, locales } from "@/lib/i18n";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<{ name: string; email: string }>("/auth/me")
      .then(setUser)
      .catch(() => setUser({ name: "Admin Principal", email: "admin@pharmacie.sn" }));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { section: "section.dashboard", items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "nav.dashboard" },
    ]},
    { section: "section.caisse", items: [
      { href: "/caisse", icon: ShoppingCart, label: "nav.sales" },
      { href: "/caisse/historique", icon: ShoppingCart, label: "nav.history" },
    ]},
    { section: "section.stock", items: [
      { href: "/produits", icon: Package, label: "nav.products" },
      { href: "/categories", icon: FolderTree, label: "nav.categories" },
      { href: "/inventaire", icon: ClipboardList, label: "nav.inventory" },
      { href: "/mouvements-stock", icon: TrendingUp, label: "nav.movements" },
      { href: "/bons-livraison", icon: Package, label: "nav.delivery_slips" },
    ]},
    { section: "section.shop", items: [
      { href: "/commandes", icon: Store, label: "nav.orders" },
      { href: "/boutique", icon: Store, label: "nav.shop_config" },
    ]},
    { section: "section.network_section", items: [
      { href: "/reseau", icon: Network, label: "nav.network" },
    ]},
    { section: "section.reports_section", items: [
      { href: "/rapports", icon: BarChart3, label: "nav.reports" },
    ]},
    { section: "section.finances", items: [
      { href: "/facturation", icon: Receipt, label: "nav.invoicing" },
      { href: "/paiements", icon: Smartphone, label: "nav.payments" },
    ]},
    { section: "section.suppliers", items: [
      { href: "/grossistes", icon: Truck, label: "nav.wholesalers" },
    ]},
    { section: "section.settings", items: [
      { href: "/parametres", icon: Settings, label: "nav.pharmacy" },
      { href: "/parametres/wizard", icon: Settings, label: "nav.wizard", hidden: true },
      { href: "/utilisateurs", icon: Settings, label: "nav.users" },
      { href: "/depenses", icon: Settings, label: "nav.expenses" },
      { href: "/assistance", icon: MessageCircle, label: "nav.assistance" },
      { href: "/parametres/notifications", icon: Bell, label: "nav.notifications" },
      { href: "/import-export", icon: FileSpreadsheet, label: "nav.import_export" },
    ]},
  ];

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg border border-border md:hidden"
        aria-label="Menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-pharma-500 transition-transform duration-300 md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white">
            <Pill size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{t("app.title")}</div>
            <div className="text-[11px] text-pharma-200">{t("app.subtitle")}</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navItems.map((group) => (
            <div key={group.section}>
              <div className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-pharma-200/70">
                {t(group.section)}
              </div>
              {group.items.filter((item) => !(item as any).hidden).map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-white/15 text-white shadow-sm"
                        : "text-pharma-100 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <item.icon size={18} />
                    {t(item.label)}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div ref={dropdownRef} className="relative border-t border-white/10">
          <button onClick={() => { setProfileOpen(!profileOpen); setLangOpen(false); }}
            className="flex w-full items-center gap-3 px-4 py-3 transition-all hover:bg-white/10">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white">
              <User size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-white truncate max-w-[140px]">
                {user?.name || "..."}
              </div>
              <div className="text-[11px] text-pharma-200 truncate max-w-[140px]">
                {user?.email || ""}
              </div>
            </div>
            <ChevronRight size={16} className={`text-pharma-200 transition-transform ${profileOpen ? "rotate-90" : ""}`} />
          </button>

          {profileOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden">
              <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                <div className="text-sm font-semibold text-gray-800">{user?.name}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>

              <div ref={langRef}>
                <button onClick={() => setLangOpen(!langOpen)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Globe size={16} className="text-gray-400" />
                  <span className="flex-1 text-left">{t("nav.lang") || "Langue"}</span>
                  <span className="text-xs text-gray-500">
                    {locales.find(l => l.code === getLocale())?.flag} {locales.find(l => l.code === getLocale())?.label}
                  </span>
                  <ChevronRight size={14} className={`text-gray-400 transition-transform ${langOpen ? "rotate-90" : ""}`} />
                </button>
                {langOpen && (
                  <div className="border-t border-gray-100">
                    {locales.map((l) => (
                      <button key={l.code} onClick={() => { setLocale(l.code); setLangOpen(false); setProfileOpen(false); }}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${l.code === getLocale() ? "bg-pharma-50 text-pharma-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                        <span className="w-5 text-center">{l.flag}</span>
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={() => { toggle(); setProfileOpen(false); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                {theme === "dark" ? <Sun size={16} className="text-gray-400" /> : <Moon size={16} className="text-gray-400" />}
                <span className="flex-1 text-left">{theme === "dark" ? t("nav.light_mode") : t("nav.dark_mode")}</span>
                <div className={`h-5 w-9 rounded-full transition-colors ${theme === "dark" ? "bg-pharma-500" : "bg-gray-300"} relative`}>
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${theme === "dark" ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </button>

              <div className="border-t border-gray-100">
                <button onClick={() => { api.clearToken(); router.push("/login"); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={16} />
                  {t("nav.logout")}
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
