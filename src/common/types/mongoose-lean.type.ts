export type Lean<T> = T extends infer U
  ? U extends { _id: any }
    ? Omit<U, keyof Document> & { _id: string }
    : never
  : never;
