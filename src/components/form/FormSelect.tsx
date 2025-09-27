import { FieldPath, FieldValues, useController } from 'react-hook-form'
import { Select } from '../ui/Select'

interface FormSelectProps<T extends FieldValues> {
  name: FieldPath<T>
  label?: string
  placeholder?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

function FormSelect<T extends FieldValues>({
  name,
  label,
  placeholder,
  required = false,
  className,
  children,
}: FormSelectProps<T>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
  })

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Select
        {...field}
        id={name}
        error={!!error}
        onChange={(e) => {
          const value = e.target.value
          if (value === '') {
            field.onChange(undefined)
          } else {
            const numericValue = Number(value)
            field.onChange(isNaN(numericValue) ? value : numericValue)
          }
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </Select>
      {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
    </div>
  )
}

export { FormSelect }
