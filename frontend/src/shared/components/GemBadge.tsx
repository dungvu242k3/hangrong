import React from "react";

interface GemBadgeProps {
  amount: number;
  className?: string;
}

export const GemBadge: React.FC<GemBadgeProps> = ({ amount, className = "" }) => {
  const formattedAmount = amount.toLocaleString("vi-VN");

  return (
    <div
      className={`inline-flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/20 rounded-2xl py-1.5 px-3.5 shadow-sm select-none cursor-default font-body ${className}`}
    >
      {/* Emerald Gem Icon */}
      <span className="relative flex h-5 w-5 animate-pulse">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-gem"
        >
          <path
            d="M12 2L4 9L12 22L20 9L12 2Z"
            fill="#10B981"
            stroke="#059669"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M12 2L9 9L12 22L15 9L12 2Z"
            fill="#34D399"
            stroke="#059669"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M4 9H20"
            stroke="#059669"
            strokeWidth="1.5"
          />
        </svg>
      </span>

      {/* Amount Label */}
      <span className="font-bold text-white text-sm md:text-base drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]">
        {formattedAmount}
      </span>
      <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider hidden sm:inline">Ngọc</span>
    </div>
  );
};
export default GemBadge;
