import { z } from 'zod';
export declare const FLAG_NAME_PATTERN: RegExp;
export declare const ENVIRONMENT_NAME_PATTERN: RegExp;
declare const targetingRulesSchema: z.ZodObject<{
    users: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    groups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    users?: string[] | undefined;
    groups?: string[] | undefined;
}, {
    users?: string[] | undefined;
    groups?: string[] | undefined;
}>;
declare const targetingSchema: z.ZodObject<{
    enable: z.ZodOptional<z.ZodObject<{
        users: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        groups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strict", z.ZodTypeAny, {
        users?: string[] | undefined;
        groups?: string[] | undefined;
    }, {
        users?: string[] | undefined;
        groups?: string[] | undefined;
    }>>;
    disable: z.ZodOptional<z.ZodObject<{
        users: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        groups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strict", z.ZodTypeAny, {
        users?: string[] | undefined;
        groups?: string[] | undefined;
    }, {
        users?: string[] | undefined;
        groups?: string[] | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    enable?: {
        users?: string[] | undefined;
        groups?: string[] | undefined;
    } | undefined;
    disable?: {
        users?: string[] | undefined;
        groups?: string[] | undefined;
    } | undefined;
}, {
    enable?: {
        users?: string[] | undefined;
        groups?: string[] | undefined;
    } | undefined;
    disable?: {
        users?: string[] | undefined;
        groups?: string[] | undefined;
    } | undefined;
}>;
declare const environmentConfigSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    rollout: z.ZodOptional<z.ZodNumber>;
    targeting: z.ZodOptional<z.ZodObject<{
        enable: z.ZodOptional<z.ZodObject<{
            users: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            groups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strict", z.ZodTypeAny, {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        }, {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        }>>;
        disable: z.ZodOptional<z.ZodObject<{
            users: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            groups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strict", z.ZodTypeAny, {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        }, {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        }>>;
    }, "strict", z.ZodTypeAny, {
        enable?: {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        } | undefined;
        disable?: {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        } | undefined;
    }, {
        enable?: {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        } | undefined;
        disable?: {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        } | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    enabled?: boolean | undefined;
    rollout?: number | undefined;
    targeting?: {
        enable?: {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        } | undefined;
        disable?: {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        } | undefined;
    } | undefined;
}, {
    enabled?: boolean | undefined;
    rollout?: number | undefined;
    targeting?: {
        enable?: {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        } | undefined;
        disable?: {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        } | undefined;
    } | undefined;
}>;
export declare const flagSchema: z.ZodObject<{
    name: z.ZodString;
    enabled: z.ZodBoolean;
    description: z.ZodOptional<z.ZodString>;
    owner: z.ZodOptional<z.ZodString>;
    rollout: z.ZodOptional<z.ZodNumber>;
    targeting: z.ZodOptional<z.ZodObject<{
        enable: z.ZodOptional<z.ZodObject<{
            users: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            groups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strict", z.ZodTypeAny, {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        }, {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        }>>;
        disable: z.ZodOptional<z.ZodObject<{
            users: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            groups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strict", z.ZodTypeAny, {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        }, {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        }>>;
    }, "strict", z.ZodTypeAny, {
        enable?: {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        } | undefined;
        disable?: {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        } | undefined;
    }, {
        enable?: {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        } | undefined;
        disable?: {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        } | undefined;
    }>>;
    environments: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        rollout: z.ZodOptional<z.ZodNumber>;
        targeting: z.ZodOptional<z.ZodObject<{
            enable: z.ZodOptional<z.ZodObject<{
                users: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                groups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strict", z.ZodTypeAny, {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            }, {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            }>>;
            disable: z.ZodOptional<z.ZodObject<{
                users: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                groups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strict", z.ZodTypeAny, {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            }, {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            }>>;
        }, "strict", z.ZodTypeAny, {
            enable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
            disable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
        }, {
            enable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
            disable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
        }>>;
    }, "strict", z.ZodTypeAny, {
        enabled?: boolean | undefined;
        rollout?: number | undefined;
        targeting?: {
            enable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
            disable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
        } | undefined;
    }, {
        enabled?: boolean | undefined;
        rollout?: number | undefined;
        targeting?: {
            enable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
            disable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
        } | undefined;
    }>>>;
}, "strict", z.ZodTypeAny, {
    enabled: boolean;
    name: string;
    rollout?: number | undefined;
    targeting?: {
        enable?: {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        } | undefined;
        disable?: {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        } | undefined;
    } | undefined;
    description?: string | undefined;
    owner?: string | undefined;
    environments?: Record<string, {
        enabled?: boolean | undefined;
        rollout?: number | undefined;
        targeting?: {
            enable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
            disable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
        } | undefined;
    }> | undefined;
}, {
    enabled: boolean;
    name: string;
    rollout?: number | undefined;
    targeting?: {
        enable?: {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        } | undefined;
        disable?: {
            users?: string[] | undefined;
            groups?: string[] | undefined;
        } | undefined;
    } | undefined;
    description?: string | undefined;
    owner?: string | undefined;
    environments?: Record<string, {
        enabled?: boolean | undefined;
        rollout?: number | undefined;
        targeting?: {
            enable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
            disable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
        } | undefined;
    }> | undefined;
}>;
export type Flag = z.infer<typeof flagSchema>;
export type TargetingRules = z.infer<typeof targetingRulesSchema>;
export type Targeting = z.infer<typeof targetingSchema>;
export type EnvironmentConfig = z.infer<typeof environmentConfigSchema>;
export declare const compiledFlagsSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    generatedAt: z.ZodString;
    flags: z.ZodRecord<z.ZodString, z.ZodObject<{
        name: z.ZodString;
        enabled: z.ZodBoolean;
        description: z.ZodOptional<z.ZodString>;
        owner: z.ZodOptional<z.ZodString>;
        rollout: z.ZodOptional<z.ZodNumber>;
        targeting: z.ZodOptional<z.ZodObject<{
            enable: z.ZodOptional<z.ZodObject<{
                users: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                groups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strict", z.ZodTypeAny, {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            }, {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            }>>;
            disable: z.ZodOptional<z.ZodObject<{
                users: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                groups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strict", z.ZodTypeAny, {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            }, {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            }>>;
        }, "strict", z.ZodTypeAny, {
            enable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
            disable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
        }, {
            enable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
            disable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
        }>>;
        environments: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            rollout: z.ZodOptional<z.ZodNumber>;
            targeting: z.ZodOptional<z.ZodObject<{
                enable: z.ZodOptional<z.ZodObject<{
                    users: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    groups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strict", z.ZodTypeAny, {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                }, {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                }>>;
                disable: z.ZodOptional<z.ZodObject<{
                    users: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    groups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strict", z.ZodTypeAny, {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                }, {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                }>>;
            }, "strict", z.ZodTypeAny, {
                enable?: {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                } | undefined;
                disable?: {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                } | undefined;
            }, {
                enable?: {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                } | undefined;
                disable?: {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                } | undefined;
            }>>;
        }, "strict", z.ZodTypeAny, {
            enabled?: boolean | undefined;
            rollout?: number | undefined;
            targeting?: {
                enable?: {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                } | undefined;
                disable?: {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                } | undefined;
            } | undefined;
        }, {
            enabled?: boolean | undefined;
            rollout?: number | undefined;
            targeting?: {
                enable?: {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                } | undefined;
                disable?: {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                } | undefined;
            } | undefined;
        }>>>;
    }, "strict", z.ZodTypeAny, {
        enabled: boolean;
        name: string;
        rollout?: number | undefined;
        targeting?: {
            enable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
            disable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
        } | undefined;
        description?: string | undefined;
        owner?: string | undefined;
        environments?: Record<string, {
            enabled?: boolean | undefined;
            rollout?: number | undefined;
            targeting?: {
                enable?: {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                } | undefined;
                disable?: {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                } | undefined;
            } | undefined;
        }> | undefined;
    }, {
        enabled: boolean;
        name: string;
        rollout?: number | undefined;
        targeting?: {
            enable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
            disable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
        } | undefined;
        description?: string | undefined;
        owner?: string | undefined;
        environments?: Record<string, {
            enabled?: boolean | undefined;
            rollout?: number | undefined;
            targeting?: {
                enable?: {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                } | undefined;
                disable?: {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                } | undefined;
            } | undefined;
        }> | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    version: 1;
    generatedAt: string;
    flags: Record<string, {
        enabled: boolean;
        name: string;
        rollout?: number | undefined;
        targeting?: {
            enable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
            disable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
        } | undefined;
        description?: string | undefined;
        owner?: string | undefined;
        environments?: Record<string, {
            enabled?: boolean | undefined;
            rollout?: number | undefined;
            targeting?: {
                enable?: {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                } | undefined;
                disable?: {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                } | undefined;
            } | undefined;
        }> | undefined;
    }>;
}, {
    version: 1;
    generatedAt: string;
    flags: Record<string, {
        enabled: boolean;
        name: string;
        rollout?: number | undefined;
        targeting?: {
            enable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
            disable?: {
                users?: string[] | undefined;
                groups?: string[] | undefined;
            } | undefined;
        } | undefined;
        description?: string | undefined;
        owner?: string | undefined;
        environments?: Record<string, {
            enabled?: boolean | undefined;
            rollout?: number | undefined;
            targeting?: {
                enable?: {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                } | undefined;
                disable?: {
                    users?: string[] | undefined;
                    groups?: string[] | undefined;
                } | undefined;
            } | undefined;
        }> | undefined;
    }>;
}>;
export type CompiledFlags = z.infer<typeof compiledFlagsSchema>;
export {};
//# sourceMappingURL=schema.d.ts.map