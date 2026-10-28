import type { Schema } from "effect";

import { PostSchema } from "./schemas";

export const tableSchemas: Readonly<Record<string, Schema.Top>> = {
  posts: PostSchema,
};
