import { FieldPath, FieldValues, useController } from 'react-hook-form'
import { Input } from '../ui/Input'

interface FormInputProps<T extends FieldValues> {
  name: FieldPath<T>
  label?: string
  placeholder?: string
  type?: string
  required?: boolean
  className?: string
}

function FormInput<T extends FieldValues>({
  name,
  label,
  placeholder,
  type = 'text',
  required = false,
  className,
}: FormInputProps<T>) {
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
      <Input
        {...field}
        id={name}
        type={type}
        placeholder={placeholder}
        error={!!error}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
    </div>
  )
}

export { FormInput }
