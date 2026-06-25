"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface Props {
  total: number;
  pageSize: number;
  currentPage: number;
}

export default function Pagination({ total, pageSize, currentPage }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-30 hover:bg-neutral-50"
      >
        Anterior
      </button>
      <span className="text-sm text-neutral-500">
        Página {currentPage} de {totalPages}
      </span>
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-30 hover:bg-neutral-50"
      >
        Siguiente
      </button>
    </div>
  );
}
