import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled = false,
  className = "",
  children,
  ...props
}) => {
  // Styles from MASTER.md design tokens
  const baseStyle = "inline-flex items-center justify-center font-body font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[0.98] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none";
  
  const variants = {
    primary: "bg-cta hover:bg-[#EA580C] text-white shadow-retro-md hover:shadow-retro-lg border-2 border-transparent",
    secondary: "border-2 border-primary hover:bg-primary/10 text-primary bg-transparent",
    ghost: "bg-transparent hover:bg-slate-500/10 text-text-base",
  };

  const sizes = {
    sm: "py-1.5 px-3 text-sm min-h-[36px]",
    md: "py-3 px-6 text-base min-h-[44px]", // Touch target minimum 44px
    lg: "py-4 px-8 text-lg min-h-[52px]",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span>Đang xử lý...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
export default Button;
