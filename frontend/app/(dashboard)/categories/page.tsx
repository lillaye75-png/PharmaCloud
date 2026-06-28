"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [catName, setCatName] = useState("");
  const [deptName, setDeptName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = useCallback(async () => {
    try {
      const catData = await api.get<Category[]>("/categories/");
      setCategories(catData);
    } catch { setCategories([]); }
    try {
      const deptData = await api.get<Department[]>("/categories/departments");
      setDepartments(deptData);
    } catch { setDepartments([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await api.post("/categories/", { name: catName.trim() });
      setCatName("");
      setShowCatForm(false);
      load();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Erreur"); }
  };

  const addDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    try {
      await api.post("/categories/departments", { name: deptName.trim() });
      setDeptName("");
      setShowDeptForm(false);
      load();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Erreur"); }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await api.put(`/categories/${id}`, { name: editName.trim() });
      setEditingId(null);
      load();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Erreur"); }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    try { await api.delete(`/categories/${id}`); load(); }
    catch { alert("Erreur"); }
  };

  const removeDept = async (id: string) => {
    if (!confirm("Supprimer ce département ?")) return;
    try { await api.delete(`/categories/departments/${id}`); load(); }
    catch { alert("Erreur"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
          <p className="mt-1 text-sm text-gray-500">Gestion des catégories et départements</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowDeptForm(!showDeptForm)}
            className="flex items-center gap-2 rounded-lg border border-pharma-600 px-4 py-2 text-sm font-medium text-pharma-600 hover:bg-pharma-50">
            <FolderTree size={18} /> Département
          </button>
          <button onClick={() => setShowCatForm(!showCatForm)}
            className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700">
            <Plus size={18} /> Catégorie
          </button>
        </div>
      </div>

      {showCatForm && (
        <form onSubmit={addCategory} className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Ajouter une catégorie</h3>
          <input required placeholder="Nom de la catégorie" value={catName} onChange={(e) => setCatName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-pharma-600 px-4 py-2 text-sm text-white hover:bg-pharma-700">Ajouter</button>
            <button type="button" onClick={() => setShowCatForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">Annuler</button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-8">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
          <h3 className="font-semibold text-gray-900">Catégories</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {categories.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">Aucune catégorie</p>
          ) : categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
              {editingId === cat.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(cat.id); if (e.key === "Escape") setEditingId(null); }}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-pharma-500 focus:outline-none" />
                  <button onClick={() => saveEdit(cat.id)} className="rounded bg-pharma-600 px-3 py-1.5 text-xs text-white hover:bg-pharma-700">OK</button>
                  <button onClick={() => setEditingId(null)} className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700">Annuler</button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(cat)} className="p-1.5 text-gray-400 hover:text-pharma-600"><Pencil size={15} /></button>
                    <button onClick={() => remove(cat.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {showDeptForm && (
        <form onSubmit={addDepartment} className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Ajouter un département</h3>
          <input required placeholder="Nom du département" value={deptName} onChange={(e) => setDeptName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-pharma-600 px-4 py-2 text-sm text-white hover:bg-pharma-700">Ajouter</button>
            <button type="button" onClick={() => setShowDeptForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">Annuler</button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Départements</h3>
          <FolderTree size={18} className="text-gray-400" />
        </div>
        <div className="divide-y divide-gray-100">
          {departments.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">Aucun département</p>
          ) : departments.map((dept) => (
            <div key={dept.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
              <span className="text-sm font-medium text-gray-900">{dept.name}</span>
              <button onClick={() => removeDept(dept.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
