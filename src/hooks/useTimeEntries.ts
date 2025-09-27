import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TimeEntry } from '../types'
import { TimeEntryFormData } from '../schemas'

const fetchTimeEntries = async (): Promise<TimeEntry[]> => {
  const response = await fetch('/api/time-entries')
  if (!response.ok) {
    throw new Error('Failed to fetch time entries')
  }
  const data = await response.json()
  return data || []
}

const createTimeEntry = async (data: TimeEntryFormData): Promise<TimeEntry> => {
  const response = await fetch('/api/time-entries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create time entry')
  }
  return response.json()
}

export const useTimeEntries = () => {
  return useQuery({
    queryKey: ['timeEntries'],
    queryFn: fetchTimeEntries,
  })
}

export const useCreateTimeEntry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
    },
  })
}
