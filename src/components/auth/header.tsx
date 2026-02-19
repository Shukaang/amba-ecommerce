// components/layout/header.tsx
import Link from "next/link";
import { CircleQuestionMark, Gem } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-0">
          <Gem className="text-[#f73a00]" />
          <Link href="/" className="text-2xl font-bold text-[#f73a00]">
            AmbaStore
          </Link>
        </div>
        <div className="flex items-center gap-0 hover:underline cursor-pointer">
          <CircleQuestionMark className="text-xs text-white fill-slate-700" />
          <p className="text-slate-700">Support</p>
        </div>
      </div>
    </header>
  );
}
