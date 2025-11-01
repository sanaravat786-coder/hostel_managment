import { z } from "zod"

export const complaintSchema = z.object({
  id: z.string(),
  studentName: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(["Pending", "In Progress", "Resolved"]),
  date: z.date(),
})

export type Complaint = z.infer<typeof complaintSchema>
