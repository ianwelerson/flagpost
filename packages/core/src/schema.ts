import { z } from 'zod';

export const FLAG_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

export const flagSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .max(64)
      .regex(
        FLAG_NAME_PATTERN,
        'Flag name must be lowercase alphanumeric with hyphens (no leading/trailing hyphen)',
      ),
    enabled: z.boolean(),
    description: z.string().max(280).optional(),
    owner: z.string().max(64).optional(),
  })
  .strict();

export type Flag = z.infer<typeof flagSchema>;

export const compiledFlagsSchema = z
  .object({
    version: z.literal(1),
    generatedAt: z.string().datetime(),
    flags: z.record(flagSchema),
  })
  .strict();

export type CompiledFlags = z.infer<typeof compiledFlagsSchema>;
