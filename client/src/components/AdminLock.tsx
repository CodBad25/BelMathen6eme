import { Link } from "wouter";
import { Lock } from "lucide-react";

export function AdminLock() {
  return (
    <Link href="/admin">
      <button
        className="fixed bottom-4 right-4 w-10 h-10 bg-gray-200 hover:bg-gray-300 text-gray-500 hover:text-gray-700 rounded-full flex items-center justify-center opacity-30 hover:opacity-100 transition-all z-50"
        title="Accès admin"
      >
        <Lock className="w-5 h-5" />
      </button>
    </Link>
  );
}
