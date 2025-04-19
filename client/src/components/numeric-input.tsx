import { Input } from '@/components/ui/input';
import { forwardRef } from 'react';

interface NumericInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: number) => void;
}

export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  ({ onValueChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) || 0;
      if (onValueChange) {
        onValueChange(value);
      }
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <Input
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

NumericInput.displayName = 'NumericInput';