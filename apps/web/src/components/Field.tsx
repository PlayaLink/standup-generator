'use client';

import type { ReactNode } from 'react';

type FieldOrientation = 'vertical' | 'horizontal';

export interface FieldProps {
  /** Layout orientation */
  orientation?: FieldOrientation;
  /** Label text for the field */
  label?: ReactNode;
  /** Shows required indicator (*) */
  isRequired?: boolean;
  /** Helper text displayed below the input */
  helperText?: ReactNode;
  /** Current character count */
  currentCount?: number;
  /** Maximum character count */
  maxCount?: number;
  /** Shows character counter (e.g., "12/100") */
  showCounter?: boolean;
  /** The form input element */
  children?: ReactNode;
  /** Additional className for root element */
  className?: string;
}

// Styles matching chg-unified-ds patterns
const styles = {
  common: {
    root: 'flex',
    head: 'flex',
    labelWrapper: 'flex flex-row items-center gap-2',
    label: 'text-sm font-normal text-gray-900',
    requiredIndicator: 'text-sm font-normal text-red-600',
    body: 'flex flex-col',
    foot: 'flex flex-row gap-8',
    helperText: 'text-xs font-normal text-gray-500',
    counter: 'text-xs font-normal text-gray-500',
  },
  orientation: {
    vertical: {
      root: 'flex-col gap-4',
      head: 'flex-row items-stretch justify-stretch',
      labelWrapper: 'pb-4',
      body: 'gap-10',
      foot: 'justify-between',
    },
    horizontal: {
      root: 'flex-row gap-8',
      head: 'flex-row items-stretch justify-stretch w-140 py-10',
      labelWrapper: '',
      body: 'flex-1 gap-4 items-end justify-center',
      foot: 'justify-end',
    },
  },
};

export function Field({
  orientation = 'vertical',
  label,
  isRequired = false,
  helperText,
  currentCount,
  maxCount,
  showCounter = false,
  children,
  className,
}: FieldProps) {
  const hasFooter = helperText || showCounter;

  const rootClassName = [
    styles.common.root,
    styles.orientation[orientation].root,
    className,
  ].filter(Boolean).join(' ');

  const headClassName = [
    styles.common.head,
    styles.orientation[orientation].head,
  ].join(' ');

  const labelWrapperClassName = [
    styles.common.labelWrapper,
    styles.orientation[orientation].labelWrapper,
  ].join(' ');

  const bodyClassName = [
    styles.common.body,
    styles.orientation[orientation].body,
  ].join(' ');

  const footClassName = [
    styles.common.foot,
    styles.orientation[orientation].foot,
  ].join(' ');

  return (
    <div className={rootClassName}>
      {/* Head - Label */}
      {label && (
        <div className={headClassName}>
          <div className={labelWrapperClassName}>
            <span className={styles.common.label}>{label}</span>
            {isRequired && (
              <span className={styles.common.requiredIndicator}>*</span>
            )}
          </div>
        </div>
      )}

      {/* Body - Input slot + Footer */}
      <div className={bodyClassName}>
        {children}

        {/* Footer - Helper text and Counter */}
        {hasFooter && (
          <div className={footClassName}>
            {helperText && (
              <span className={styles.common.helperText}>{helperText}</span>
            )}
            {showCounter && (
              <span className={styles.common.counter}>
                {currentCount ?? 0}/{maxCount ?? 0}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
