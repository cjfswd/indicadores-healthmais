import { atom } from 'jotai';
import { z } from 'zod';

export function createFormAtom<T extends z.ZodObject<any>>(schema: T) {
  const initialState = schema.parse({});
  type RawData = z.infer<T>;

  const baseAtom = atom(initialState as RawData);

  return atom(
    (get) => {
      const raw = get(baseAtom);
      const result = schema.safeParse(raw);
      return {
        ...raw,
        errors: (result.success ? {} : result.error.flatten().fieldErrors) as Record<string, any>,
        isValid: result.success,
        data: raw,
      } as RawData & { errors: Record<string, any>; isValid: boolean; data: RawData };
    },
    (get, set, update: Partial<RawData> | ((prev: RawData) => Partial<RawData>) | { __replace: RawData }) => {
      if (update && typeof update === 'object' && '__replace' in update) {
        // Full replacement — used when loading entity data to avoid stale merges
        set(baseAtom, (update as { __replace: RawData }).__replace);
        return;
      }
      const prev = get(baseAtom);
      const nextUpdate = typeof update === 'function' ? update(prev) : update;
      set(baseAtom, { ...prev, ...nextUpdate } as RawData);
    }
  );
}
