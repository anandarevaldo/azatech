export function successResponse<T>(message: string, data: T, meta?: unknown) {
  return meta === undefined
    ? { success: true, message, data }
    : { success: true, message, data, meta };
}

export function serializeValue<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_, nestedValue: unknown) =>
      typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue,
    ),
  ) as T;
}
