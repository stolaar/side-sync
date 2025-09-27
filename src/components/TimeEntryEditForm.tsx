import { useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { timeEntrySchema, TimeEntryFormData } from '../schemas'
import { Project, TimeEntry } from '../types'
import { FormInput } from './form/FormInput'
import { FormTextarea } from './form/FormTextarea'
import { FormSelect } from './form/FormSelect'
import { FormCheckbox } from './form/FormCheckbox'
import { Button } from './ui/Button'

interface TimeEntryEditFormProps {
  timeEntry: TimeEntry
  projects: Project[]
  onSave: (data: TimeEntryFormData) => void
  onCancel: () => void
  onDelete?: () => void
}

const TimeEntryEditForm = ({
  timeEntry,
  projects,
  onSave,
  onCancel,
  onDelete,
}: TimeEntryEditFormProps) => {
  const methods = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      project_id: timeEntry.project_id,
      user_id: timeEntry.user_id,
      description: timeEntry.description || '',
      start_time: new Date(timeEntry.start_time).toISOString().slice(0, 16),
      end_time: timeEntry.end_time
        ? new Date(timeEntry.end_time).toISOString().slice(0, 16)
        : '',
      duration: timeEntry.duration || 0,
      billable: timeEntry.billable,
    },
  })

  const { handleSubmit, watch, setValue } = methods
  const startTime = watch('start_time')
  const endTime = watch('end_time')

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0
    const startDate = new Date(start)
    const endDate = new Date(end)
    return Math.max(
      0,
      Math.floor((endDate.getTime() - startDate.getTime()) / 1000)
    )
  }

  useEffect(() => {
    if (startTime && endTime) {
      const duration = calculateDuration(startTime, endTime)
      setValue('duration', duration)
    }
  }, [startTime, endTime, setValue])

  const onSubmit = async (data: TimeEntryFormData) => {
    const duration = calculateDuration(data.start_time, data.end_time || '')
    const payload = {
      ...data,
      duration: duration > 0 ? duration : data.duration,
      start_time: new Date(data.start_time).toISOString(),
      end_time: data.end_time
        ? new Date(data.end_time).toISOString()
        : undefined,
      billable: data.billable,
    }
    onSave(payload)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Edit Time Entry
      </h3>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormSelect
            name="project_id"
            label="Project"
            placeholder="Select a project"
            required
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </FormSelect>

          <FormTextarea
            name="description"
            label="Description"
            placeholder="What did you work on?"
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              name="start_time"
              label="Start Time"
              type="datetime-local"
              required
            />

            <FormInput name="end_time" label="End Time" type="datetime-local" />
          </div>

          <FormCheckbox name="billable" label="Billable" />

          {startTime && endTime && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">
                Duration:{' '}
                {Math.floor(calculateDuration(startTime, endTime) / 3600)}h{' '}
                {Math.floor(
                  (calculateDuration(startTime, endTime) % 3600) / 60
                )}
                m
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            {onDelete && (
              <Button
                type="button"
                variant="secondary"
                onClick={onDelete}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  )
}

export { TimeEntryEditForm }
