'use client';

import { useState, useMemo } from 'react';
import {
  ComboBox,
  Input,
  Button,
  Popover,
  ListBox,
  ListBoxItem,
  type Key,
} from 'react-aria-components';

export interface SelectOption {
  id: string | number;
  name: string;
}

type SelectSize = 'default' | 'compact';
type SelectState = 'default' | 'error';

interface SelectProps {
  options: SelectOption[];
  placeholder?: string;
  selectedKey?: Key | null;
  onSelectionChange?: (key: Key | null) => void;
  size?: SelectSize;
  state?: SelectState;
  isDisabled?: boolean;
  className?: string;
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
    button: 'pointer-events-none absolute right-12 flex items-center',
    icon: 'size-20 shrink-0 text-gray-500',
  },
  sizes: {
    default: {
      input: 'h-[40px] rounded-4 text-md pl-12 pr-36',
    },
    compact: {
      input: 'h-[32px] rounded-4 text-sm pl-12 pr-36',
    },
  },
  states: {
    default: {
      input: 'focus:ring-4 focus:ring-brand-100',
    },
    error: {
      input: 'ring-error-300 focus:ring-4 focus:ring-error-100',
    },
  },
  popover: 'rounded-4 border border-gray-300 bg-base-white py-8 shadow-lg',
  listBox: 'max-h-200 overflow-y-auto outline-none',
  listItem: [
    'flex cursor-pointer items-center px-16 py-8 text-sm text-gray-900 transition-colors',
    'hover:bg-blue-50',
    'focus:bg-blue-50 focus:outline-none',
    'data-[selected]:bg-brand-50 data-[selected]:text-brand-700',
    'data-[focused]:bg-blue-50',
  ].join(' '),
  emptyState: 'px-16 py-8 text-sm text-gray-500',
};

// Caret down icon matching design system
function CaretDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function Select({
  options,
  placeholder = 'Select an option',
  selectedKey,
  onSelectionChange,
  size = 'default',
  state = 'default',
  isDisabled = false,
  className,
}: SelectProps) {
  // Initialize inputValue from selectedKey if provided
  const initialValue = selectedKey ? options.find((opt) => opt.id === selectedKey)?.name ?? '' : '';
  const [inputValue, setInputValue] = useState(initialValue);

  const filteredOptions = useMemo(() => {
    if (!inputValue) return options;
    const lower = inputValue.toLowerCase();
    return options.filter((opt) => opt.name.toLowerCase().includes(lower));
  }, [options, inputValue]);

  const inputClassName = [
    styles.common.input,
    styles.sizes[size].input,
    styles.states[state].input,
  ].join(' ');

  return (
    <ComboBox
      className={['w-full relative', className].filter(Boolean).join(' ')}
      inputValue={inputValue}
      onInputChange={setInputValue}
      selectedKey={selectedKey}
      onSelectionChange={(key) => {
        onSelectionChange?.(key);
        const item = options.find((opt) => opt.id === key);
        setInputValue(item?.name ?? '');
      }}
      allowsCustomValue={false}
      isDisabled={isDisabled}
      menuTrigger="focus"
    >
      <div className={styles.common.wrapper}>
        <Input
          placeholder={placeholder}
          className={inputClassName}
        />
        <Button className={styles.common.button}>
          <CaretDownIcon className={styles.common.icon} />
        </Button>
      </div>
      <Popover className={['w-[--trigger-width]', styles.popover].join(' ')}>
        <ListBox className={styles.listBox}>
          {filteredOptions.map((option) => (
            <ListBoxItem
              key={option.id}
              id={option.id}
              textValue={option.name}
              className={styles.listItem}
            >
              {option.name}
            </ListBoxItem>
          ))}
          {filteredOptions.length === 0 && (
            <div className={styles.emptyState}>No results found</div>
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}

export type { Key };
