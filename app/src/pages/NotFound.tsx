import { Link } from "react-router-dom";
import { Mountain } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-rock-100 flex items-center justify-center text-rock-400">
        <Mountain className="w-8 h-8" />
      </div>
      <div className="text-2xl font-display font-bold tracking-[-0.01em] text-rock-900">
        Seite nicht gefunden
      </div>
      <div className="text-sm text-rock-500 mt-1">
        Die Route gibt's nicht (mehr).
      </div>
      <Link
        to="/"
        className="mt-6 bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-6 rounded-md transition-colors ease-out active:scale-[0.97]"
      >
        Zum Dashboard
      </Link>
    </div>
  );
}
