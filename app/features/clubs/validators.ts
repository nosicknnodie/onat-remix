/**
 * 클럽 관련 데이터 검증 스키마와 유틸리티
 * - 입력 데이터 검증을 위한 스키마 정의
 * - 클라이언트와 서버에서 공통으로 사용 가능한 검증 로직
 */

import { z } from "zod";

/**
 * 클럽 생성/수정을 위한 검증 스키마
 */
export const clubSchema = z.object({
  name: z.string().min(1, "클럽명은 필수입니다").max(50, "클럽명은 50자를 초과할 수 없습니다"),
  description: z.string().max(200, "설명은 200자를 초과할 수 없습니다").optional(),
  si: z.string().optional(),
  gun: z.string().optional(),
  isPublic: z.boolean().default(true),
});

/**
 * 클럽 가입 신청을 위한 검증 스키마
 */
export const joinClubSchema = z.object({
  clubId: z.string().min(1, "클럽 ID는 필수입니다"),
  message: z.string().max(500, "가입 신청 메시지는 500자를 초과할 수 없습니다").optional(),
});

/**
 * 클럽 검색을 위한 검증 스키마
 */
export const searchClubSchema = z.object({
  query: z.string().min(1, "검색어를 입력해주세요").optional(),
  si: z.string().optional(),
  gun: z.string().optional(),
  isPublic: z.boolean().optional(),
});

// 타입 추론을 위한 타입 정의
export type ClubFormData = z.infer<typeof clubSchema>;
export type JoinClubFormData = z.infer<typeof joinClubSchema>;
export type SearchClubFormData = z.infer<typeof searchClubSchema>;

/**
 * 클럽명 중복 검사 유틸리티
 */
export function validateClubName(name: string): boolean {
  return name.length > 0 && name.length <= 50;
}

/**
 * 클럽 이미지 URL 검증
 */
export function validateImageUrl(url?: string): boolean {
  if (!url) return true; // 선택사항
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
