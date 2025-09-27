import { FieldPath, FieldValues, useController } from 'react-hook-form'

interface FormCheckboxProps<T extends FieldValues> {
  name: FieldPath<T>
  label?: string
  className?: string
}

function FormCheckbox<T extends FieldValues>({
  name,
  label,
  className,
}: FormCheckboxProps<T>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
  })

  return (
    <div className={className}>
      <div className="flex items-center">
        <input
          {...field}
          type="checkbox"
          id={name}
          checked={field.value}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        {label && (
          <label htmlFor={name} className="ml-2 block text-sm text-gray-900">
            {label}
          </label>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
    </div>
  )
}

export { FormCheckbox }
