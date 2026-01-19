'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className = '', hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full px-3 py-2.5 text-sm border rounded-md bg-gray-50 text-gray-900 placeholder:text-gray-500
          ${hasError
            ? 'border-error-500 focus:border-error-500 focus:ring-error-500/10'
            : 'border-gray-300 hover:border-gray-400 focus:border-brand-500 focus:ring-brand-500/10'
          }
          focus:outline-none focus:ring-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}`}
        {...props}
      />
    );
  }
);

TextInput.displayName = 'TextInput';
