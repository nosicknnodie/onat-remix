import { $Enums } from "@prisma/client";

export function generateEnumControls<T extends object>(obj: Partial<T>) {
  const result: {
    [K in keyof T]?: {
      control: { type: "select" | "radio" };
      options: (string | number)[];
    };
  } = {};

  for (const key in obj) {
    const value = obj[key];
    // 특정 조건으로 enum만 감지
    const enumEntry = Object.entries($Enums).find(([_, enumObj]) =>
      Object.values(enumObj as Record<string, unknown>).includes(value),
    );

    if (enumEntry) {
      const [, enumObj] = enumEntry;
      const options = Object.values(enumObj as Record<string, unknown>).filter(
        (v): v is string | number => typeof v === "string" || typeof v === "number",
      );

      result[key] = {
        control: { type: options.length > 5 ? "select" : "radio" },
        options,
      };
    }
  }
  return result;
}
