import { z } from 'zod'

export const projectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(255, 'Name must be less than 255 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  user_id: z.number().min(1, 'User ID is required'),
  hourly_rate: z
    .number()
    .or(z.coerce.number().min(0, 'Hourly rate must be positive'))
    .optional()
    .nullish(),
})

export const timeEntrySchema = z.object({
  project_id: z
    .number({ error: 'Project is required' })
    .min(1, 'Project is required'),
  user_id: z.number().min(1, 'User ID is required'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().optional(),
  duration: z.number().min(0, 'Duration must be positive').optional(),
  billable: z.boolean().default(true),
})

export const settingsSchema = z.object({
  default_hourly_rate: z.coerce
    .number()
    .min(0, 'Default hourly rate must be positive')
    .optional(),
  currency: z
    .string()
    .min(1, 'Currency is required')
    .max(10, 'Currency must be less than 10 characters'),
})

export type TProjectFormData = z.infer<typeof projectSchema>
export type TimeEntryFormData = z.infer<typeof timeEntrySchema>
export type SettingsFormData = z.infer<typeof settingsSchema>
