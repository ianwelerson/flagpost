<div align="center">

# 🧩 @flagpost/core

**Shared schema and types for [flagpost](https://github.com/ianwelerson/flagpost) — the source of truth for what a flag looks like.**

[![npm version](https://img.shields.io/npm/v/@flagpost/core.svg)](https://www.npmjs.com/package/@flagpost/core)
[![npm downloads](https://img.shields.io/npm/dm/@flagpost/core.svg)](https://www.npmjs.com/package/@flagpost/core)
[![types](https://img.shields.io/npm/types/@flagpost/core.svg)](https://www.npmjs.com/package/@flagpost/core)
[![license](https://img.shields.io/npm/l/@flagpost/core.svg)](https://github.com/ianwelerson/flagpost/blob/develop/LICENSE)

</div>

---

## 📖 What is this?

`@flagpost/core` defines:

- 🧬 The **Zod schema** for a single flag YAML file
- 📦 The schema for the compiled `flags.json` artifact
- 🔍 A **YAML parser + validator** (`parseFlagYaml`)
- 🏷️ TypeScript **types** for both

It's consumed by [`@flagpost/sdk-js`](https://www.npmjs.com/package/@flagpost/sdk-js) and [`@flagpost/action`](https://github.com/ianwelerson/flagpost/tree/develop/packages/action).

> 💡 **Most users don't need to install this directly** — it's a building block. Install it only if you're building tooling that reads/writes flag YAML.

---

## 📥 Install

```bash
npm install @flagpost/core
```

---

## 🚀 Usage

### Parse and validate a flag YAML

```ts
import { parseFlagYaml, type Flag } from "@flagpost/core";

const flag: Flag = parseFlagYaml(`
name: new-checkout
enabled: true
description: Roll out the new checkout
owner: "@ianwelerson"
`);

console.log(flag.enabled); // true
```

### Validate a compiled `flags.json` payload

```ts
import { compiledFlagsSchema } from "@flagpost/core";

const result = compiledFlagsSchema.safeParse(json);
if (!result.success) {
  console.error("Invalid flags.json:", result.error.issues);
}
```

### Use the raw schema with your own tooling

```ts
import { flagSchema } from "@flagpost/core";

flagSchema.parse({ name: "foo", enabled: true });
// → throws on invalid input
```

---

## 🧬 Flag schema

| Field         | Type      | Required | Notes                                                                    |
| ------------- | --------- | -------- | ------------------------------------------------------------------------ |
| `name`        | `string`  | ✅       | Lowercase alphanumeric + hyphens, 1–64 chars, no leading/trailing hyphen |
| `enabled`     | `boolean` | ✅       | The flag's value                                                         |
| `description` | `string`  |          | Optional human-readable description, ≤ 280 chars                         |
| `owner`       | `string`  |          | Optional owner handle, ≤ 64 chars                                        |

> ⚠️ The schema is **strict** — unknown fields are rejected. This catches typos like `enabld: true` early.

---

## 🚨 Errors

`parseFlagYaml` throws `FlagParseError` on invalid YAML or schema failure:

```ts
import { parseFlagYaml, FlagParseError } from "@flagpost/core";

try {
  parseFlagYaml("name: BAD\nenabled: true\n", "flags/foo.yml");
} catch (err) {
  if (err instanceof FlagParseError) {
    console.error(err.source); // 'flags/foo.yml'
    console.error(err.issues); // string[] of validation messages
  }
}
```

---

## 📚 API

```ts
// Schema
export const flagSchema: ZodObject<...>;
export const compiledFlagsSchema: ZodObject<...>;
export const FLAG_NAME_PATTERN: RegExp;

// Types
export type Flag = z.infer<typeof flagSchema>;
export type CompiledFlags = z.infer<typeof compiledFlagsSchema>;

// Parser
export function parseFlagYaml(yaml: string, source?: string): Flag;
export class FlagParseError extends Error {
  source: string;
  issues: string[];
}
```

---

## 📄 License

[MIT](https://github.com/ianwelerson/flagpost/blob/develop/LICENSE) © [Ian Welerson](https://github.com/ianwelerson)
