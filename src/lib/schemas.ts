import { z } from 'zod'

// Common schemas
export const uuidSchema = z.string().uuid()
export const dateSchema = z
  .string()
  .or(z.date())
  .transform((val) => new Date(val))

// Grade Schema
export const gradeSchema = z
  .object({
    student_id: uuidSchema,
    class_id: uuidSchema,
    course_id: uuidSchema,
    term_id: uuidSchema,
    topic_id: uuidSchema,
    subtopic_id: uuidSchema,
    work_type: z.enum(['classwork', 'homework']),
    work_subtype: z.enum(['worksheet', 'pastpaper']),
    marks_obtained: z.number().min(0),
    total_marks: z.number().positive(),
    percentage: z.number().min(0).max(100).optional(), // Calculated on server usually, but can be passed
    is_low_point: z.boolean().optional(),
    attempt_number: z.number().int().min(1).optional().default(1),
    notes: z.string().optional().nullable(),
    assessed_date: dateSchema,
  })
  .refine((data) => data.marks_obtained <= data.total_marks, {
    message: 'Marks obtained cannot exceed total marks',
    path: ['marks_obtained'],
  })

export const gradeArraySchema = z.array(gradeSchema)

// Student Schema
export const studentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  year_group: z.string().min(1, 'Year group is required'),
  school: z.string().min(1, 'School is required'),
  // email is optional in DB but if provided should be valid
  email: z.string().email().optional().or(z.literal('')),
})

// Class Schema
export const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  teacher_id: uuidSchema,
})

// Term Schema
export const termSchema = z
  .object({
    name: z.string().min(1, 'Term name is required'),
    start_date: dateSchema,
    end_date: dateSchema,
    is_active: z.boolean().optional().default(false),
    academic_year: z.string().min(1, 'Academic year is required'),
  })
  .refine((data) => data.end_date > data.start_date, {
    message: 'End date must be after start date',
    path: ['end_date'],
  })

// User/Profile Schema
export const userSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['admin', 'teacher']),
})
