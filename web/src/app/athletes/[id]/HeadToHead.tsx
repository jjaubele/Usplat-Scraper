"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface Props {
  currentAtletaId: number;
}

export default function HeadToHead({ currentAtletaId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rivalId, setRivalId] = useState(searchParams.get("vs") || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rivalId.trim()) {
      router.push(`/athletes/${currentAtletaId}?vs=${rivalId.trim()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <div>
        <label className="block text-xs font-medium text-neutral-500 mb-1">
          ID del rival
        </label>
        <Input
          type="number"
          placeholder="ID atleta"
          value={rivalId}
          onChange={(e) => setRivalId(e.target.value)}
          className="w-32"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-wa-blue text-white rounded-md text-sm font-medium hover:bg-blue-900 transition-colors h-9"
      >
        Comparar
      </button>
    </form>
  );
}
