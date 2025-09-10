/**
 * 클럽 탭 컴포넌트 (나의 클럽 / 공개 클럽)
 * - 사용자 인증 상태에 따른 탭 표시 제어
 * - 커스텀 스타일링 적용 (언더라인 효과, 활성 상태 표시)
 * - 접근성 고려한 키보드 네비게이션 지원
 */

import type React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/libs";
import type { CategorizedClubs, Player } from "../types";
import { ClubList } from "./ClubList";

interface ClubTabsProps {
  categorizedClubs: CategorizedClubs;
  players: Player[];
  isAuthenticated: boolean;
}

export const ClubTabs: React.FC<ClubTabsProps> = ({
  categorizedClubs,
  players,
  isAuthenticated,
}) => {
  // 인증된 사용자는 "나의 클럽" 탭을 기본으로, 그렇지 않으면 "공개 클럽" 탭을 기본으로
  const defaultTab = isAuthenticated ? "my" : "public";

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="bg-transparent space-x-2">
        {/* 인증된 사용자에게만 "나의 클럽" 탭 표시 */}
        {isAuthenticated && (
          <TabsTrigger
            value="my"
            className={cn(
              "text-foreground pb-1 relative inline-block font-semibold hover:text-primary",
              "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
              "data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:after:absolute data-[state=active]:after:-right-0 data-[state=active]:after:-top-0.5 data-[state=active]:after:content-[''] data-[state=active]:after:w-2 data-[state=active]:after:h-2 data-[state=active]:after:bg-primary data-[state=active]:after:rounded-full",
            )}
          >
            나의 클럽
          </TabsTrigger>
        )}

        {/* 공개 클럽 탭 */}
        <TabsTrigger
          value="public"
          className={cn(
            "text-foreground pb-1 relative inline-block font-semibold hover:text-primary",
            "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
            "data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:after:absolute data-[state=active]:after:-right-0 data-[state=active]:after:-top-0.5 data-[state=active]:after:content-[''] data-[state=active]:after:w-2 data-[state=active]:after:h-2 data-[state=active]:after:bg-primary data-[state=active]:after:rounded-full",
          )}
        >
          공개 클럽
        </TabsTrigger>
      </TabsList>

      {/* 탭 컨텐츠 */}
      {isAuthenticated && (
        <TabsContent value="my">
          <ClubList clubs={categorizedClubs.my} players={players} />
        </TabsContent>
      )}

      <TabsContent value="public">
        <ClubList clubs={categorizedClubs.public} players={players} />
      </TabsContent>
    </Tabs>
  );
};
