export type MapValueType<T extends Map<any, any>> = T extends Map<any, infer V> ? V : never;
