import { z } from 'zod'

export const contactSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  address_line_1: z.string().min(1),
  address_line_2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  delivery_method: z.enum(['handwrite', 'print', 'digital']),
  is_international: z.boolean().optional().default(false),
  country: z.string().trim().max(80).optional(),
  tags: z.array(z.string()).optional().default([]),
}).superRefine((value, ctx) => {
  if (value.is_international && !value.country?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['country'],
      message: 'Country is required for international addresses',
    })
  }
})

export type ContactInput = z.infer<typeof contactSchema>

export const letterDraftSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string(),
})

export type LetterDraftInput = z.infer<typeof letterDraftSchema>

export const verifySchema = z.object({
  address_line_1: z.string().min(1),
  address_line_2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
})

export type VerifyInput = z.infer<typeof verifySchema>

export const scheduleVerificationSchema = z.object({
  send_at: z.string().min(1),
})

export const calendarEventSchema = z.object({
  title: z.string().trim().min(1).max(120),
  event_type: z.enum(['birthday', 'anniversary', 'holiday', 'custom']),
  event_date: z.string().min(1),
  recurrence: z.enum(['none', 'yearly']).default('yearly'),
  contact_id: z.string().uuid().optional().or(z.literal('')),
})

export type CalendarEventInput = z.infer<typeof calendarEventSchema>

export const calendarImportSchema = z.object({
  provider: z.enum(['google', 'outlook', 'ics']),
  name: z.string().trim().min(1).max(80),
  subscription_url: z.string().url(),
})

export const mailingOriginSchema = z.object({
  mailing_state: z.string().trim().length(2).transform(s => s.toUpperCase()),
})

export const onboardingSchema = z.object({
  full_name: z.string().trim().min(1).max(80),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>

export const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(80),
  bio: z.string().trim().max(160).optional(),
  sender_name: z.string().trim().max(80).optional(),
  anniversary_reminders_enabled: z.boolean().optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>

const RESERVED_SLUGS = new Set([
  'login', 'dashboard', 'share', 'verify', 'about',
  'onboarding', 'api', 'settings', 's',
])

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9_-]{3,30}$/, 'Slug must be 3–30 lowercase letters, numbers, hyphens, or underscores')
  .refine(s => !RESERVED_SLUGS.has(s), { message: 'That slug is reserved' })

export type SlugInput = z.infer<typeof slugSchema>
