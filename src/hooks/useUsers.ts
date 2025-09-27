import { useQuery } from '@tanstack/react-query'
import { User } from '../types'

const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch('/api/users')
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  const data = await response.json()
  return data || []
}

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })
}
