import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { timeEntrySchema, TimeEntryFormData } from '../schemas'
import { Project } from '../types'
import { FormInput } from './form/FormInput'
import { FormTextarea } from './form/FormTextarea'
import { FormSelect } from './form/FormSelect'
import { FormCheckbox } from './form/FormCheckbox'
import { Button } from './ui/Button'
import { useCreateTimeEntry } from '../hooks/useTimeEntries'

interface TimeEntryFormProps {
  projects: Project[]
  onTimeEntryCreated: () => void
  onCancel: () => void
}

const TimeEntryForm = ({
  projects,
  onTimeEntryCreated,
  onCancel,
}: TimeEntryFormProps) => {
  const methods = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      project_id: projects.length > 0 ? projects[0].id : undefined,
      user_id: 1,
      description: '',
      start_time: new Date().toISOString().slice(0, 16),
      end_time: null,
      duration: null,
      billable: true,
    },
  })

  const createTimeEntryMutation = useCreateTimeEntry()

  const { handleSubmit, watch } = methods
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

  const onSubmit = async (data: TimeEntryFormData) => {
    try {
      const payload: Partial<TimeEntryFormData> & {
        start_time: string
        end_time?: string | null
        duration?: number | null
      } = {
        project_id: data.project_id,
        user_id: data.user_id,
        start_time: new Date(data.start_time).toISOString(),
        billable: data.billable,
      }

      if (data.description && data.description.trim()) {
        payload.description = data.description
      }

      if (data.end_time && data.end_time.trim()) {
        payload.end_time = new Date(data.end_time).toISOString()
        const duration = calculateDuration(data.start_time, data.end_time)
        if (duration > 0) {
          payload.duration = duration
        }
      } else {
        payload.end_time = null
        payload.duration = null
      }

      await createTimeEntryMutation.mutateAsync(payload)
      methods.reset()
      onTimeEntryCreated()
    } catch (error) {
      console.error('Error creating time entry:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Add Time Entry
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

            <FormInput
              name="end_time"
              label="End Time (optional)"
              type="datetime-local"
            />
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
            <Button
              type="submit"
              disabled={createTimeEntryMutation.isPending}
              className="flex-1"
            >
              {createTimeEntryMutation.isPending
                ? 'Adding...'
                : 'Add Time Entry'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}

export { TimeEntryForm }
