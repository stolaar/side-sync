import { FieldPath, FieldValues, useController } from 'react-hook-form'
import { Textarea } from '../ui/Textarea'

interface FormTextareaProps<T extends FieldValues> {
  name: FieldPath<T>
  label?: string
  placeholder?: string
  rows?: number
  required?: boolean
  className?: string
}

function FormTextarea<T extends FieldValues>({
  name,
  label,
  placeholder,
  rows = 3,
  required = false,
  className,
}: FormTextareaProps<T>) {
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
      <Textarea
        {...field}
        id={name}
        placeholder={placeholder}
        rows={rows}
        error={!!error}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
    </div>
  )
}

export { FormTextarea }
