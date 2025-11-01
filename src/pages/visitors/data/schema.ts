import { z } from "zod"

export const visitorSchema = z.object({
  id: z.string(),
  name: z.string(),
  contact: z.string(),
  studentName: z.string(),
  purpose: z.string(),
  in_time: z.date(),
  out_time: z.date().nullable(),
  status: z.enum(["Inside", "Checked Out"]),
})

export type Visitor = z.infer<typeof visitorSchema>
