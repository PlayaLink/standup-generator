'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

type TextInputSize = 'default' | 'compact';
type TextInputState = 'default' | 'error';

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Size variant */
  size?: TextInputSize;
  /** Visual state */
  state?: TextInputState;
  /** @deprecated Use state="error" instead */
  hasError?: boolean;
  /** Optional leading icon */
  icon?: ReactNode;
  /** Additional className for wrapper */
  wrapperClassName?: string;
}

// Styles matching chg-unified-ds patterns
const styles = {
  common: {
    wrapper: 'relative flex items-center',
    input: [
      'w-full font-regular transition duration-100 ease-linear',
      'bg-gray-50 text-gray-900 ring-1 ring-gray-300 ring-inset',
      'placeholder:text-gray-400',
      'outline-none',
      'disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400',
    ].join(' '),
    iconWrapper: 'pointer-events-none absolute left-12 flex items-center',
    icon: 'size-16 shrink-0 text-gray-500',
  },
  sizes: {
    default: {
      input: 'h-[40px] rounded-4 text-md',
      inputWithIcon: 'pl-36 pr-12',
      inputPlain: 'px-12',
    },
    compact: {
      input: 'h-[32px] rounded-4 text-sm',
      inputWithIcon: 'pl-32 pr-12',
      inputPlain: 'px-12',
    },
  },
  states: {
    default: { input: 'focus:ring-4 focus:ring-brand-100' },
    error: { input: 'ring-error-300 focus:ring-4 focus:ring-error-100' },
  },
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    {
      size = 'default',
      state = 'default',
      hasError,
      icon,
      className,
      wrapperClassName,
      disabled,
      ...props
    },
    ref
  ) {
    // Support deprecated hasError prop
    const effectiveState = hasError ? 'error' : state;
    const hasIcon = Boolean(icon);

    const inputClassName = [
      styles.common.input,
      styles.sizes[size].input,
      hasIcon ? styles.sizes[size].inputWithIcon : styles.sizes[size].inputPlain,
      styles.states[effectiveState].input,
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className={[styles.common.wrapper, wrapperClassName].filter(Boolean).join(' ')}>
        {hasIcon && (
          <span className={styles.common.iconWrapper}>
            <span className={styles.common.icon}>{icon}</span>
          </span>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={inputClassName}
          {...props}
        />
      </div>
    );
  }
);
