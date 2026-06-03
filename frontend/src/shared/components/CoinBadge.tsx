import React from "react";

interface CoinBadgeProps {
  amount: number;
  className?: string;
}

export const CoinBadge: React.FC<CoinBadgeProps> = ({ amount, className = "" }) => {
  // Format coin values nicely (e.g. 10,250 instead of 10250)
  const formattedAmount = amount.toLocaleString("vi-VN");

  return (
    <div
      className={`inline-flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/20 rounded-2xl py-1.5 px-3.5 shadow-sm select-none cursor-default font-body ${className}`}
      style={{ boxShadow: "0 0 12px rgba(234, 179, 8, 0.05)" }}
    >
      {/* Golden Coin Icon */}
      <span className="relative flex h-5 w-5 animate-float">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-coin"
        >
          <circle cx="12" cy="12" r="10" fill="#EAB308" />
          <circle cx="12" cy="12" r="7" stroke="#F59E0B" strokeWidth="2" />
          <path
            d="M12 7V17M9 10H14C14.5 10 15 10.5 15 11.25C15 12 14.5 12.5 14 12.5H10C9.5 12.5 9 13 9 13.75C9 14.5 9.5 15 10 15H15"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>

      {/* Amount Label */}
      <span className="font-bold text-slate-700 text-sm md:text-base">
        {formattedAmount}
      </span>
      <span className="text-[#F97316] text-xs font-semibold">Xu</span>
    </div>
  );
};
export default CoinBadge;
