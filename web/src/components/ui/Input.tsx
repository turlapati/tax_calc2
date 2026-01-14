import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  prefix?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, prefix, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-sm">
              {prefix}
            </span>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              "flex h-11 w-full rounded-lg border-2 border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm shadow-sm transition-all duration-200",
              "placeholder:text-slate-400",
              "focus-visible:outline-none focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500/20",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-100",
              "dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500",
              prefix && "pl-7",
              error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
