"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface Props {
  placeholder: string;
  defaultValue: string;
  action: string;
}

export default function SearchForm({ placeholder, defaultValue, action }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim().length >= 2) {
      router.push(`${action}?q=${encodeURIComponent(value.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="max-w-md"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-wa-blue text-white rounded-md text-sm font-medium hover:bg-blue-900 transition-colors"
      >
        Buscar
      </button>
    </form>
  );
}
