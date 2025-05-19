import React from 'react';
import InputMask, { Props as InputMaskProps } from 'react-input-mask';
import { Controller, Control, FieldError } from 'react-hook-form';

interface MaskedInputProps extends Omit<InputMaskProps, 'mask' | 'value' | 'onChange'> {
  rules?: Record<string, any>; // Para passar as regras de validação do react-hook-form
  label: string;
  name: string;
  control: Control<any>;
  mask: string | Array<string | RegExp>;
  error?: FieldError;
  fullWidth?: boolean;
  // Adicione quaisquer outras props que seu componente Input original aceitava e que você queira manter
}

const MaskedInput: React.FC<MaskedInputProps> = ({
  label,
  name,
  control,
  mask,
  error,
  fullWidth,
  disabled,
  readOnly,
  placeholder,
  rules,
  ...rest
}) => {
  return (
    <div className={`flex flex-col ${fullWidth ? 'w-full' : ''}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <InputMask
            {...rest}
            mask={mask}
            value={value || ''}
            onChange={(e) => {
              // Para react-hook-form, queremos passar o valor não mascarado (apenas números)
              const unmaskedValue = e.target.value.replace(/\D/g, '');
              onChange(unmaskedValue); 
            }}
            onBlur={onBlur}
            inputRef={ref}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={placeholder}
            className={`block w-full p-2.5 text-sm text-gray-900 border ${
              error ? 'border-red-500' : 'border-gray-300'
            } rounded-lg bg-gray-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 shadow-sm ${
              disabled || readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          />
        )}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  );
};

export default MaskedInput;
