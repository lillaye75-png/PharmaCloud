"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { Upload, Download, Loader2, CheckCircle, XCircle, FileSpreadsheet } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

export default function ImportExportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [exportMsg, setExportMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showImportMsg = (type: "success" | "error", text: string) => {
    setImportResult({ type, text });
    setTimeout(() => setImportResult(null), 5000);
  };

  const showExportMsg = (type: "success" | "error", text: string) => {
    setExportMsg({ type, text });
    setTimeout(() => setExportMsg(null), 5000);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { showImportMsg("error", "Veuillez sélectionner un fichier CSV"); return; }

    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = api.getToken();
      const res = await fetch(`${API_URL}/excel/products/import`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Erreur d'import" }));
        throw new Error(err.detail || "Erreur d'import");
      }
      const data = await res.json();
      const count = data.count ?? data.imported_count ?? "plusieurs";
      showImportMsg("success", `${count} produit(s) importé(s) avec succès`);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: unknown) {
      showImportMsg("error", err instanceof Error ? err.message : "Erreur d'import");
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setExportMsg(null);
    try {
      const token = api.getToken();
      const res = await fetch(`${API_URL}/excel/products/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Erreur d'export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "produits_export.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showExportMsg("success", "Export téléchargé avec succès");
    } catch (err: unknown) {
      showExportMsg("error", err instanceof Error ? err.message : "Erreur d'export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import / Export</h1>
        <p className="mt-1 text-sm text-gray-500">Importez ou exportez vos produits en CSV</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-pharma-50 p-2.5 text-pharma-600"><Upload size={20} /></div>
            <h2 className="text-lg font-semibold text-gray-900">Importer des produits (CSV)</h2>
          </div>

          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <input ref={fileRef} type="file" accept=".csv"
                className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-pharma-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-pharma-700 hover:file:bg-pharma-100" />
            </div>
            <button type="submit" disabled={importing}
              className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700 disabled:opacity-50">
              {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {importing ? "Importation..." : "Importer"}
            </button>
          </form>

          {importResult && (
            <div className={`mt-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
              importResult.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
            }`}>
              {importResult.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {importResult.text}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-pharma-50 p-2.5 text-pharma-600"><Download size={20} /></div>
            <h2 className="text-lg font-semibold text-gray-900">Exporter les produits</h2>
          </div>

          <p className="mb-4 text-sm text-gray-500">Téléchargez un fichier CSV contenant tous vos produits.</p>

          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700 disabled:opacity-50">
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exporting ? "Téléchargement..." : "Télécharger CSV"}
          </button>

          {exportMsg && (
            <div className={`mt-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
              exportMsg.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
            }`}>
              {exportMsg.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {exportMsg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
