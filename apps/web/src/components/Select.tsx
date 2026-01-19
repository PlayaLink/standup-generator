'use client';

import {
  Select as AriaSelect,
  SelectValue,
  Button,
  Popover,
  ListBox,
  ListBoxItem,
  type SelectProps as AriaSelectProps,
  type Key,
} from 'react-aria-components';

export interface SelectOption {
  id: string | number;
  name: string;
}

interface SelectProps extends Omit<AriaSelectProps<SelectOption>, 'children'> {
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ options, placeholder = 'Select...', ...props }: SelectProps) {
  return (
    <AriaSelect {...props} className="w-full">
      <Button className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-900 hover:border-gray-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 data-[pressed]:border-brand-500">
        <SelectValue className="truncate">
          {({ selectedText }) => selectedText || placeholder}
        </SelectValue>
        <svg className="w-4 h-4 ml-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>
      <Popover className="w-[--trigger-width] bg-white border border-gray-200 rounded-md shadow-lg mt-1 overflow-hidden">
        <ListBox className="max-h-60 overflow-auto py-1 outline-none">
          {options.map((option) => (
            <ListBoxItem
              key={option.id}
              id={option.id}
              textValue={option.name}
              className="px-3 py-2 text-sm text-gray-900 cursor-pointer outline-none hover:bg-gray-100 focus:bg-gray-100 data-[selected]:bg-brand-50 data-[selected]:text-brand-700"
            >
              {option.name}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}

export type { Key };
