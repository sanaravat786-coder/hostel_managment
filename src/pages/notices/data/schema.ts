import { z } from "zod"

export const noticeSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  postedBy: z.string(),
  date: z.date(),
})

export type Notice = z.infer<typeof noticeSchema>
