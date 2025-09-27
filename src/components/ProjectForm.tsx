import { useForm, FormProvider } from 'react-hook-form'
import { projectSchema, TProjectFormData } from '../schemas'
import { Project } from '../types'
import { FormInput } from './form/FormInput'
import { FormTextarea } from './form/FormTextarea'
import { Button } from './ui/Button'
import { useCreateProject, useUpdateProject } from '../hooks/useProjects'
import { zodResolver } from '@hookform/resolvers/zod'

interface ProjectFormProps {
  project?: Project
  onProjectCreated: () => void
  onCancel: () => void
}

const ProjectForm = ({
  project,
  onProjectCreated,
  onCancel,
}: ProjectFormProps) => {
  const isEditing = !!project

  const methods = useForm<TProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      user_id: project?.user_id || 1,
      hourly_rate: project?.hourly_rate || undefined,
    },
  })

  const createProjectMutation = useCreateProject()
  const updateProjectMutation = useUpdateProject()

  const { handleSubmit } = methods

  const onSubmit = async (data: TProjectFormData) => {
    try {
      if (isEditing && project) {
        await updateProjectMutation.mutateAsync({ id: project.id, data })
      } else {
        await createProjectMutation.mutateAsync(data)
      }
      methods.reset()
      onProjectCreated()
    } catch (error) {
      console.error(
        `Error ${isEditing ? 'updating' : 'creating'} project:`,
        error
      )
    }
  }

  const isLoading =
    createProjectMutation.isPending || updateProjectMutation.isPending

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        {isEditing ? 'Edit Project' : 'Create New Project'}
      </h3>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            name="name"
            label="Project Name"
            placeholder="Enter project name"
            required
          />

          <FormTextarea
            name="description"
            label="Description"
            placeholder="Enter project description"
            rows={3}
          />

          <FormInput
            name="hourly_rate"
            label="Hourly Rate (Optional)"
            type="number"
            placeholder="Enter hourly rate for this project"
          />

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> If no hourly rate is set, the global
                  default rate will be used in reports.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Project'}
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

export { ProjectForm }
