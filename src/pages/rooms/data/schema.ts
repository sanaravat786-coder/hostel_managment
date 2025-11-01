import { z } from "zod"

export const roomSchema = z.object({
  id: z.string(),
  room_no: z.string(),
  block: z.enum(["A", "B", "C", "D"]),
  type: z.enum(["Single", "Double", "Triple"]),
  capacity: z.number(),
  status: z.enum(["occupied", "vacant", "maintenance"]),
})

export type Room = z.infer<typeof roomSchema>
