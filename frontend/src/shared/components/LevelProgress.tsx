import React from "react";

interface LevelProgressProps {
  level: number;
  currentXp: number;
  maxXp: number;
  className?: string;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({
  level,
  currentXp,
  maxXp,
  className = "",
}) => {
  const percentage = Math.min(Math.max((currentXp / maxXp) * 100, 0), 100);

  return (
    <div className={`flex items-center gap-3 font-body select-none ${className}`}>
      {/* Level Badge Circle */}
      <div className="shrink-0 flex items-center justify-center bg-linear-to-br from-cta to-[#EA580C] text-white rounded-full w-10 h-10 border-2 border-white shadow-retro-md font-heading text-xl font-bold">
        {level}
      </div>

      {/* Progress Track */}
      <div className="grow flex flex-col justify-center min-w-[100px]">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
          <span className="text-slate-600">Cấp sạp</span>
          <span>
            {currentXp}/{maxXp} EXP
          </span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner border border-slate-300/40">
          <div
            className="h-full bg-linear-to-r from-primary to-secondary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
export default LevelProgress;
