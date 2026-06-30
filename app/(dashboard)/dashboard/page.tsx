"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, ShoppingCart, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { usePolling } from "@/lib/usePolling";

interface SaleItem {
  id: string;
  total_amount: number;
  created_at: string;
  customer_name?: string;
  sale_number?: string;
}

interface ProductAlert {
  id: string;
  name: string;
  current_stock: number;
  min_stock_alert: number;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [salesToday, setSalesToday] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [lowStockAlerts, setLowStockAlerts] = useState(0);
  const [recentSales, setRecentSales] = useState<SaleItem[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<ProductAlert[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [salesRes, alertsRes] = await Promise.all([
        api.get<SaleItem[]>("/sales/?size=5"),
        api.get<ProductAlert[]>("/products/alerts/low-stock"),
      ]);

      const todaySales = salesRes.filter((s) => isToday(s.created_at));
      const totalToday = todaySales.reduce((sum, s) => sum + Number(s.total_amount), 0);
      setSalesToday(totalToday);
      setProductsCount(0);
      setPendingOrders(0);
      setLowStockAlerts(alertsRes.length);
      setRecentSales(salesRes);
      setLowStockProducts(alertsRes);
    } catch {
      // silently fail, keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  usePolling(fetchData, 30000);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Chargement...
      </div>
    );
  }

  const stats = [
    {
      label: "Ventes aujourd'hui",
      value: formatCurrency(salesToday),
      icon: ShoppingCart,
      color: "text-pharma-600 bg-pharma-100",
    },
    {
      label: "Produits en stock",
      value: String(productsCount),
      icon: Package,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Commandes en attente",
      value: String(pendingOrders),
      icon: TrendingUp,
      color: "text-amber-600 bg-amber-100",
    },
    {
      label: "Alertes stock faible",
      value: String(lowStockAlerts),
      icon: AlertTriangle,
      color: "text-red-600 bg-red-100",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h1>
      <p className="mt-1 text-sm text-gray-500">Bienvenue sur PharmaCloud</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={stat.color + " rounded-lg p-3"}>
                <stat.icon size={22} />
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Activité Récente</h2>
            <Link href="/caisse/historique" className="text-sm text-pharma-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          {recentSales.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Aucune activité récente</p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sale.customer_name || "Client"}</p>
                    <p className="text-xs text-gray-500">{formatDate(sale.created_at)}</p>
                  </div>
                  <span className="text-sm font-semibold text-pharma-600">{formatCurrency(Number(sale.total_amount))}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Alertes Stock</h2>
            <Link href="/produits" className="text-sm text-pharma-600 hover:underline flex items-center gap-1">
              Gérer <ArrowRight size={14} />
            </Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Aucune alerte</p>
          ) : (
            <div className="mt-4 space-y-3">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-red-500">Stock: {p.current_stock} / Seuil: {p.min_stock_alert}</p>
                  </div>
                  <AlertTriangle size={16} className="text-red-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
