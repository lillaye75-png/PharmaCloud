"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, TrendingUp, DollarSign, Package, Download, FileDown, Calendar, TrendingDown, PieChart, ArrowUp, ShoppingBag, CreditCard } from "lucide-react";

export default function RapportsPage() {
  const [period, setPeriod] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [salesData, setSalesData] = useState<any>(null);
  const [invData, setInvData] = useState<any>(null);
  const [accountingData, setAccountingData] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [dailySales, setDailySales] = useState<any[]>([]);

  const getPeriodParam = () => {
    if (period === "custom") return `start_date=${customStart}&end_date=${customEnd}`;
    return `period=${period}`;
  };

  const load = useCallback(async () => {
    try {
      const [s, i, a] = await Promise.all([
        api.get<any>(`/reports/sales?${getPeriodParam()}`),
        api.get<any>("/reports/inventory"),
        api.get<any>("/reports/accounting"),
      ]);
      setSalesData(s);
      setInvData(i);
      setAccountingData(a);
    } catch { }
    try {
      const allSales = await api.get<any[]>("/sales/?page=1&size=100");
      if (Array.isArray(allSales)) {
        const sorted = [...allSales].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
        setTopProducts(sorted);
      }
    } catch { }
  }, [period, customStart, customEnd]);

  useEffect(() => { load(); }, [load]);

  const downloadReport = async (format: string) => {
    const token = api.getToken();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";
    const res = await fetch(`${baseUrl}/reports/sales/export/${format}?${getPeriodParam()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-ventes.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isProfit = accountingData && accountingData.profit >= 0;
  const profitMargin = accountingData && accountingData.revenue > 0
    ? ((accountingData.profit / accountingData.revenue) * 100).toFixed(1)
    : "0.0";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
          <p className="mt-1 text-sm text-gray-500">Analyse des ventes et de l&apos;activité</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {["today", "week", "month", "year", "custom"].map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              period === p ? "bg-pharma-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}>
            {p === "today" ? "Aujourd'hui" : p === "week" ? "7 jours" : p === "month" ? "30 jours" : p === "year" ? "Année" : "Personnalisé"}
          </button>
        ))}
        {period === "custom" && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
            <span className="text-gray-400">-</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <button onClick={() => downloadReport("csv")}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download size={16} /> CSV
          </button>
          <button onClick={() => downloadReport("pdf")}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <FileDown size={16} /> PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {salesData && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-3 text-green-600"><TrendingUp size={22} /></div>
              <div>
                <p className="text-sm text-gray-500">Chiffre d&apos;affaires</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(salesData.total_revenue)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3 text-blue-600"><BarChart3 size={22} /></div>
              <div>
                <p className="text-sm text-gray-500">Ventes</p>
                <p className="text-2xl font-bold text-gray-900">{salesData.total_sales}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-100 p-3 text-violet-600"><DollarSign size={22} /></div>
              <div>
                <p className="text-sm text-gray-500">Ticket moyen</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(salesData.average_ticket)}</p>
              </div>
            </div>
          </div>
          {accountingData && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-3 ${isProfit ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                  {isProfit ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Marge bénéficiaire</p>
                  <p className={`text-2xl font-bold ${isProfit ? "text-green-600" : "text-red-600"}`}>
                    {profitMargin}%
                  </p>
                  <p className="text-xs text-gray-400">
                    Revenu: {formatCurrency(accountingData.revenue)} | Charges: {formatCurrency(accountingData.expenses)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Top Products / Recent Sales */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag size={18} className="text-pharma-600" />
            <h2 className="text-lg font-semibold text-gray-900">Dernières ventes</h2>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Aucune vente récente</p>
          ) : (
            <div className="space-y-2">
              {topProducts.slice(0, 5).map((sale: any, idx: number) => (
                <div key={sale.id || idx} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sale.customer_name || "Client"}</p>
                    <p className="text-xs text-gray-400">{new Date(sale.created_at).toLocaleDateString("fr-FR")} · {sale.payment_method || "Espèces"}</p>
                  </div>
                  <p className="text-sm font-semibold text-pharma-600">{formatCurrency(sale.total_amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paiements */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-pharma-600" />
            <h2 className="text-lg font-semibold text-gray-900">Méthodes de paiement</h2>
          </div>
          <div className="flex items-center justify-center h-32 text-gray-400">
            <PieChart size={48} className="text-gray-200" />
            <p className="ml-3 text-sm">Analyse des paiements disponible dans la caisse</p>
          </div>
        </div>
      </div>

      {invData && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-pharma-600" />
              <h2 className="text-lg font-semibold text-gray-900">État du stock</h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Produits</p>
              <p className="text-xl font-bold text-gray-900">{invData.total_products}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-sm text-amber-600">Stock faible</p>
              <p className="text-xl font-bold text-amber-700">{invData.low_stock_count}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-600">En rupture</p>
              <p className="text-xl font-bold text-red-700">{invData.out_of_stock_count}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-600">Valeur du stock</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(invData.total_stock_value || 0)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
