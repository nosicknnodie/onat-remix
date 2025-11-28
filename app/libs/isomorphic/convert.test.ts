import { describe, expect, it } from "vitest";
import {
  adapterOmitFalsy,
  adaptToDate,
  convertToNull,
  formatPhoneNumber,
  removePhoneHyphen,
} from "./convert";

describe("convert", () => {
  describe("adaptToDate", () => {
    it("should convert ISO date strings to Date objects", () => {
      const input = { date: "2023-01-01T00:00:00.000Z" };
      const output = adaptToDate(input);
      expect(output.date).toBeInstanceOf(Date);
      expect((output.date as unknown as Date).toISOString()).toBe("2023-01-01T00:00:00.000Z");
    });

    it("should convert fields with date keywords", () => {
      const input = { createdAt: "2023-01-01" };
      const output = adaptToDate(input);
      expect(output.createdAt).toBeInstanceOf(Date);
    });

    it("should handle nested objects", () => {
      const input = { nested: { updatedAt: "2023-01-01T00:00:00.000Z" } };
      const output = adaptToDate(input);
      expect(output.nested.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("adapterOmitFalsy", () => {
    it("should remove undefined and null values", () => {
      const input = { a: 1, b: undefined, c: null };
      // @ts-expect-error
      const output = adapterOmitFalsy(input);
      expect(output).toEqual({ a: 1 });
    });

    it("should handle nested objects", () => {
      const input = { a: { b: undefined, c: 2 } };
      // @ts-expect-error
      const output = adapterOmitFalsy(input);
      expect(output).toEqual({ a: { c: 2 } });
    });
  });

  describe("convertToNull", () => {
    it("should convert undefined to null", () => {
      const input = { a: 1, b: undefined };
      // @ts-expect-error
      const output = convertToNull(input);
      expect(output).toEqual({ a: 1, b: null });
    });

    it("should keep null as null", () => {
      const input = { a: null };
      const output = convertToNull(input);
      expect(output).toEqual({ a: null });
    });
  });

  describe("formatPhoneNumber", () => {
    it("should format 11 digit number", () => {
      expect(formatPhoneNumber("01012345678")).toBe("010-1234-5678");
    });

    it("should return original if already formatted", () => {
      expect(formatPhoneNumber("010-1234-5678")).toBe("010-1234-5678");
    });
  });

  describe("removePhoneHyphen", () => {
    it("should remove hyphens", () => {
      expect(removePhoneHyphen("010-1234-5678")).toBe("01012345678");
    });
  });
});
