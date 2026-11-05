import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E8B]/30 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";

    const variants = {
      primary:
        "bg-[#087E8B] hover:bg-[#075B65] text-white shadow-subtle active:translate-y-[1px]",
      secondary:
        "bg-white hover:bg-[#F4F5F7] text-[#17212B] border border-[#E7EBEF] shadow-subtle hover:border-[#D4D9DE] active:translate-y-[1px]",
      outline:
        "border border-[#E7EBEF] bg-transparent hover:bg-[#F4F5F7] text-[#17212B]",
      ghost:
        "bg-transparent hover:bg-[#F4F5F7] text-[#687582] hover:text-[#17212B]",
      danger:
        "bg-[#D94B4B] hover:bg-[#B82E2E] text-white shadow-subtle",
    };

    const sizes = {
      sm: "h-7 px-2.5 text-xs gap-1.5",
      md: "h-9 px-3.5 text-xs font-medium gap-2",
      lg: "h-10 px-4 text-sm font-semibold gap-2",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
