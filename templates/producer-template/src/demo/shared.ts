import type { Post } from "../schemas";

// JSONPlaceholder has 10 users, and each post belongs to one of them.
export const userCount = 10;

export type Rows = {
  readonly posts: Array<Post>;
};
