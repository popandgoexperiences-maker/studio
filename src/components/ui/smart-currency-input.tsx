'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from './input';
import { formatCurrency } from '@/lib/utils';

interface SmartCurrencyInputProps {
  id?: string;
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
  currencySymbol?: string;
}

export function SmartCurrencyInput({
  id,
  value,
  onValueChange,
  className,
  currencySymbol = '€',
}: SmartCurrencyInputProps) {
  // Store the raw integer value (e.g., 12345 for 123.45)
  const [internalValue, setInternalValue] = useState<string>(
    Math.round(value * 100).toString()
  );

  // When the external value prop changes, update the internal integer string
  useEffect(() => {
    const newValueAsString = Math.round(value * 100).toString();
    if (newValueAsString !== internalValue) {
      setInternalValue(newValueAsString);
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    let nextValue = internalValue;

    if (e.key >= '0' && e.key <= '9') {
      // Append the new digit
      nextValue = internalValue + e.key;
    } else if (e.key === 'Backspace') {
      // Remove the last digit
      nextValue = internalValue.slice(0, -1);
    } else if (e.key === 'Delete' || e.key === 'Clear') {
      // Clear the input
      nextValue = '0';
    } else {
      // Ignore other keys
      return;
    }

    // Ensure the value is not empty, default to '0'
    if (nextValue === '') {
      nextValue = '0';
    }

    // Remove leading zeros
    if (nextValue.length > 1 && nextValue.startsWith('0')) {
      nextValue = nextValue.substring(1);
    }
    
    setInternalValue(nextValue);
    onValueChange(parseInt(nextValue, 10) / 100);
  };

  const formattedValue = formatCurrency(parseInt(internalValue, 10) / 100);

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric" // Helps mobile browsers show a numeric keypad
      value={formattedValue}
      onKeyDown={handleKeyDown}
      className={`text-lg font-bold h-auto p-2 text-right ${className}`}
      // The onClick handler moves the cursor to the end, which is more intuitive
      // for this type of input since we are always appending.
      onClick={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
      // readOnly is not strictly necessary but prevents some weird interactions
      // since all input is handled by onKeyDown.
      readOnly
    />
  );
}
