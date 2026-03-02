import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          flex h-12 w-full bg-surface border-2 border-white/10 px-4 py-2 text-ink
          placeholder:text-white/30
          focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/50
          disabled:cursor-not-allowed disabled:opacity-50
          transition-colors duration-200
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
