type DateKeywords = "createdAt" | "updatedAt";
const DATE_KEYWORDS: DateKeywords[] = ["createdAt", "updatedAt"];

const isDateString = (value: string): boolean => {
  return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d*/.test(value) || /\d{4}-\d{2}-\d{2}/.test(value);
};

const isDateKeyword = (key: string): boolean => {
  return DATE_KEYWORDS.some((keyword) => key.includes(keyword));
};

type JsonValue = string | number | boolean | null | JsonObject | JsonArray | Date;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

/**
 * 객체 내의 날짜 문자열을 Date 객체로 변환합니다.
 * - createdAt, updatedAt 키를 가진 필드
 * - ISO 8601 형식의 날짜 문자열 (YYYY-MM-DDTHH:mm:ss.sssZ)
 * - YYYY-MM-DD 형식의 날짜 문자열
 * @param input 변환할 객체
 * @returns Date 객체로 변환된 객체
 */
export const adaptToDate = <T extends JsonObject>(input: T): T => {
  if (!input) return input;

  const adaptRecursive = (obj: JsonObject): void => {
    for (const key of Object.keys(obj)) {
      const value = obj[key];

      if (value !== null && typeof value === "object") {
        adaptRecursive(value as JsonObject);
      } else if (typeof value === "string" && (isDateKeyword(key) || isDateString(value))) {
        obj[key] = new Date(value);
      }
    }
  };

  adaptRecursive(input);
  return input;
};

/**
 * 객체에서 null 또는 undefined 값을 가진 필드를 제거합니다.
 * 중첩된 객체의 경우에도 재귀적으로 처리됩니다.
 * @param input 처리할 객체
 * @returns falsy 값이 제거된 객체
 */
export const adapterOmitFalsy = <T extends JsonObject>(input: T): T => {
  if (!input) return input;

  const process = (obj: JsonObject): void => {
    for (const key of Object.keys(obj)) {
      const value = obj[key];

      if (value !== null && typeof value === "object") {
        process(value as JsonObject);
      } else if (value === undefined || value === null) {
        delete obj[key];
      }
    }
  };

  process(input);
  return input;
};

/**
 * 객체 내의 undefined 값을 null로 변환합니다.
 * 중첩된 객체의 경우에도 재귀적으로 처리됩니다.
 * @param input 처리할 객체
 * @returns undefined가 null로 변환된 객체
 */
export const convertToNull = <T extends JsonObject>(input: T): T => {
  if (!input) return input;

  const process = (obj: JsonObject): void => {
    for (const key of Object.keys(obj)) {
      const value = obj[key];

      if (value !== null && typeof value === "object") {
        process(value as JsonObject);
      } else if (value === undefined) {
        obj[key] = null;
      }
    }
  };

  process(input);
  return input;
};

export function formatPhoneNumber(phone: string): string {
  // 이미 하이픈이 있으면 그대로 반환
  if (phone.includes("-")) return phone;

  // 하이픈 없고 11자리 숫자인 경우
  return phone.replace(/^(\d{3})(\d{4})(\d{4})$/, "$1-$2-$3");
}

export function removePhoneHyphen(phone: string): string {
  return phone.replace(/-/g, "");
}
