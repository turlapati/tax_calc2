import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, placeholder, error, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          className={cn(
            "flex h-11 w-full rounded-lg border-2 border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm shadow-sm transition-all duration-200 cursor-pointer",
            "focus-visible:outline-none focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500/20",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-100",
            "dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100",
            error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20",
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
