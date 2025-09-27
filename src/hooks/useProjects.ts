import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Project } from '../types'
import { ProjectFormData } from '../schemas'

const fetchProjects = async (): Promise<Project[]> => {
  const response = await fetch('/api/projects')
  if (!response.ok) {
    throw new Error('Failed to fetch projects')
  }
  const data = await response.json()
  return data || []
}

const createProject = async (data: ProjectFormData): Promise<Project> => {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create project')
  }
  return response.json()
}

const fetchProject = async (id: number): Promise<Project> => {
  const response = await fetch(`/api/projects/single?id=${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch project')
  }
  return response.json()
}

const updateProject = async (
  id: number,
  data: ProjectFormData
): Promise<Project> => {
  const response = await fetch(`/api/projects/single?id=${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update project')
  }
  return response.json()
}

const deleteProject = async (id: number): Promise<void> => {
  const response = await fetch(`/api/projects/single?id=${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete project')
  }
}

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  })
}

export const useCreateProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export const useProject = (id: number) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => fetchProject(id),
    enabled: !!id,
  })
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProjectFormData }) =>
      updateProject(id, data),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({
        queryKey: ['project', updatedProject.id],
      })
    },
  })
}

export const useDeleteProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
