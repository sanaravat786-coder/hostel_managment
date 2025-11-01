import { z } from "zod"

export const feeSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  balance: z.number(),
  status: z.enum(["Paid", "Partial", "Unpaid"]),
})

export type Fee = z.infer<typeof feeSchema>
