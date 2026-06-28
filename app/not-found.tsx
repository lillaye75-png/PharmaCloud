import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-6xl font-bold text-gray-200">404</h1>
      <p className="mt-4 text-lg text-gray-500">Page introuvable</p>
      <Link href="/" className="mt-6 rounded-lg bg-pharma-600 px-6 py-2 text-sm font-medium text-white hover:bg-pharma-700">
        Retour au tableau de bord
      </Link>
    </div>
  );
}
