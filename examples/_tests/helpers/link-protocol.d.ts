import { z } from 'zod'
export declare const LinkProtocol: z.ZodEnum<['link', 'file']>
export type LinkProtocol = z.infer<typeof LinkProtocol>
