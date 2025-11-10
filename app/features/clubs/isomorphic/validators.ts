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
