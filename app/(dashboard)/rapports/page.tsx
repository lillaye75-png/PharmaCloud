"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, TrendingUp, DollarSign, Package, Download, FileDown } from "lucide-react";

export default function RapportsPage() {
  const [period, setPeriod] = useState("today");
  const [salesData, setSalesData] = useState<any>(null);
  const [invData, setInvData] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const [s, i] = await Promise.all([
        api.get<any>(`/reports/sales?period=${period}`),
        api.get<any>("/reports/inventory"),
      ]);
      setSalesData(s);
      setInvData(i);
    } catch { /* silent */ }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const downloadReport = async (format: string) => {
    const token = api.getToken();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";
    const res = await fetch(`${baseUrl}/reports/sales/export/${format}?period=${period}`, {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
          <p className="mt-1 text-sm text-gray-500">Analyse des ventes et de l&apos;activité</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {["today", "week", "month", "year"].map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              period === p ? "bg-pharma-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}>
            {p === "today" ? "Aujourd'hui" : p === "week" ? "7 jours" : p === "month" ? "30 jours" : "Année"}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={() => downloadReport("csv")}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download size={16} /> Télécharger CSV
          </button>
          <button onClick={() => downloadReport("pdf")}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <FileDown size={16} /> Télécharger PDF
          </button>
        </div>
      </div>

      {salesData && (
        <div className="grid gap-6 sm:grid-cols-3 mb-6">
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
        </div>
      )}

      {invData && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">État du stock</h2>
          <div className="grid gap-4 sm:grid-cols-3">
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
          </div>
        </div>
      )}
    </div>
  );
}
