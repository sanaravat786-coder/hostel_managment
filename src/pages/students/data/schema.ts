import { z } from "zod"

export const studentSchema = z.object({
  id: z.string(),
  name: z.string(),
  course: z.string(),
  year: z.number(),
  contact: z.string(),
  room: z.object({
    id: z.string(),
    number: z.string(),
  }),
  status: z.enum(["active", "inactive"]),
})

export type Student = z.infer<typeof studentSchema>
