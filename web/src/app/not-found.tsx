import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="text-4xl font-bold text-wa-blue mb-4">404</h2>
      <p className="text-neutral-500 mb-6">
        La página que buscas no existe.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-wa-blue text-white rounded-md text-sm font-medium hover:bg-blue-900 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
