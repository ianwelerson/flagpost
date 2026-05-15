import { z } from 'zod';

export const FLAG_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ENVIRONMENT_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const identifierSchema = z.string().min(1).max(128);

const targetingRulesSchema = z
  .object({
    users: z.array(identifierSchema).max(1000).optional(),
    groups: z.array(identifierSchema).max(1000).optional(),
  })
  .strict();

const targetingSchema = z
  .object({
    enable: targetingRulesSchema.optional(),
    disable: targetingRulesSchema.optional(),
  })
  .strict();

const rolloutSchema = z.number().int().min(0).max(100);

const environmentConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    rollout: rolloutSchema.optional(),
    targeting: targetingSchema.optional(),
  })
  .strict();

export const flagSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .max(64)
      .regex(
        FLAG_NAME_PATTERN,
        'Flag name must be lowercase alphanumeric with hyphens (no leading/trailing hyphen, no consecutive hyphens)',
      ),
    enabled: z.boolean(),
    description: z.string().max(280).optional(),
    owner: z.string().max(64).optional(),
    rollout: rolloutSchema.optional(),
    targeting: targetingSchema.optional(),
    environments: z
      .record(
        z
          .string()
          .regex(
            ENVIRONMENT_NAME_PATTERN,
            'Environment name must be lowercase alphanumeric with hyphens',
          ),
        environmentConfigSchema,
      )
      .optional(),
  })
  .strict();

export type Flag = z.infer<typeof flagSchema>;
export type TargetingRules = z.infer<typeof targetingRulesSchema>;
export type Targeting = z.infer<typeof targetingSchema>;
export type EnvironmentConfig = z.infer<typeof environmentConfigSchema>;

export const compiledFlagsSchema = z
  .object({
    version: z.literal(1),
    generatedAt: z.string().datetime(),
    flags: z.record(flagSchema),
  })
  .strict();

export type CompiledFlags = z.infer<typeof compiledFlagsSchema>;
