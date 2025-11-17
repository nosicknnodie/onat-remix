/**
 * 클럽 관련 액션 드롭다운 메뉴 컴포넌트
 * - 클럽 생성 등의 액션을 드롭다운으로 제공
 * - 사용자 인증 상태 확인
 * - 접근성을 위한 키보드 네비게이션 지원
 */

import { Link } from "@remix-run/react";
import type React from "react";
import { Button } from "~/components/ui/button";

interface ClubActionsDropdownProps {
  isAuthenticated: boolean;
}

export const ClubActionsDropdown: React.FC<ClubActionsDropdownProps> = ({ isAuthenticated }) => {
  // 인증되지 않은 사용자에게는 드롭다운을 표시하지 않음
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button asChild variant="outline">
      <Link to="/clubs/new">클럽 생성</Link>
    </Button>
    // <DropdownMenu>
    //   <DropdownMenuTrigger asChild>
    //     <Button
    //       variant="ghost"
    //       className={cn(
    //         "h-8 w-8 p-0 text-primary focus:outline-none focus:ring-0 focus-visible:ring-0",
    //       )}
    //       aria-label="클럽 액션 메뉴 열기"
    //     >
    //       <span className="sr-only">메뉴 열기</span>
    //       <DotsHorizontalIcon className="h-4 w-4" />
    //     </Button>
    //   </DropdownMenuTrigger>

    //   <DropdownMenuContent align="end">
    //     <DropdownMenuItem asChild>

    //     </DropdownMenuItem>
    //     {/* 추가적인 액션들이 필요한 경우 여기에 추가 */}
    //   </DropdownMenuContent>
    // </DropdownMenu>
  );
};
