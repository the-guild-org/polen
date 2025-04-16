import { z } from 'zod';
export const LinkProtocol = z.enum([`link`, `file`]);
