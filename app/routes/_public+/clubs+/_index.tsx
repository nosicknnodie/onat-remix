/**
 * 클럽 목록 페이지의 HTTP Layer
 * - Remix의 loader/action과 hooks만 사용
 * - Feature layer의 비즈니스 로직 호출
 * - UI는 순수 Props로 전달하여 재사용성 확보
 */

import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useSession } from "~/contexts/AuthUserContext";
import { service } from "~/features/clubs";
import { ClubActionsDropdown, ClubTabs } from "~/features/clubs/ui/index";
import { getUser } from "~/libs/db/lucia.server";

/**
 * 서버사이드 데이터 로딩
 * - 사용자 인증 확인 및 클럽 데이터 조회
 * - Feature layer의 service 함수 사용
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  const clubsData = await service.getClubsData(user?.id);

  return clubsData;
};

/**
 * 페이지 헤더의 액션 메뉴 컴포넌트
 * - 사용자 인증 상태에 따라 조건부 렌더링
 * - Remix의 Link 컴포넌트를 UI 컴포넌트에 주입
 */
const RightComponent = () => {
  const session = useSession();

  return <ClubActionsDropdown isAuthenticated={!!session} />;
};

/**
 * Remix의 handle export - 페이지 레이아웃에서 사용
 * - 헤더 영역에 액션 버튼 표시
 */
export const handle = {
  right: () => <RightComponent />,
};

/**
 * 메인 페이지 컴포넌트
 * - HTTP layer의 역할: Remix hooks 사용과 데이터 전달
 * - UI 로직은 feature의 컴포넌트에 위임
 */
const ClubsPage = () => {
  const session = useSession();
  const clubsData = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-4">
      <ClubTabs
        categorizedClubs={clubsData.categorized}
        players={clubsData.players}
        isAuthenticated={!!session}
      />
    </div>
  );
};

export default ClubsPage;
