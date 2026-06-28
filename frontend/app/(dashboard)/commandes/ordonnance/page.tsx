"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { Upload, FileText, Loader2 } from "lucide-react";

export default function UploadPrescriptionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setAnalysis("");
  };

  const uploadAndAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:8000/api/v1/orders/upload-prescription", {
        method: "POST",
        headers: { Authorization: `Bearer ${api.getToken()}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      const aiRes = await api.post<{ analysis: string }>("/ai/analyze-prescription", {
        image_url: data.url,
      });
      setAnalysis(aiRes.analysis);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload d&apos;ordonnance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Téléchargez une ordonnance pour analyse automatique par l&apos;IA
        </p>
      </div>

      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
        {preview ? (
          <div className="space-y-4">
            <img src={preview} alt="Ordonnance" className="mx-auto max-h-80 rounded-lg object-contain" />
            <button
              onClick={() => { setFile(null); setPreview(null); setAnalysis(""); }}
              className="text-sm text-gray-500 hover:text-red-500"
            >
              Supprimer
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer"
          >
            <Upload size={40} className="mx-auto text-gray-300" />
            <p className="mt-4 font-medium text-gray-700">Cliquez pour télécharger</p>
            <p className="mt-1 text-sm text-gray-400">PDF ou photo d&apos;ordonnance</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFile}
              className="hidden"
            />
          </div>
        )}
      </div>

      {file && !analysis && (
        <button
          onClick={uploadAndAnalyze}
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-pharma-600 py-3 text-sm font-medium text-white hover:bg-pharma-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
          {loading ? "Analyse en cours..." : "Analyser l'ordonnance"}
        </button>
      )}

      {analysis && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Rapport d&apos;analyse</h2>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
}
