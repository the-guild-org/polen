import { z } from 'zod'

export const LinkProtocol = z.enum([`link`, `file`])

export type LinkProtocol = z.infer<typeof LinkProtocol>
