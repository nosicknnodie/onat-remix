# 기능: 002 - 클럽 관리

## 1. 사용자 스토리
- "사이트 사용자는 새로운 축구 클럽을 생성하여 우리팀의 페이지를 갖고 싶다."
- "사용자들은 등록된 클럽 목록을 보고, 원하는 클럽의 상세 정보를 확인하고 싶다."

## 2. 완료 조건 (Acceptance Criteria)
- [x] 로그인한 사용자는 클럽 생성 페이지로 이동할 수 있다.
- [x] 클럽 이름, 지역, 소개 등을 입력하여 새 클럽을 생성할 수 있다.
- [x] 전체 클럽 목록을 볼 수 있다.
- [ ] 클럽 상세 페이지에서 클럽 멤버 목록을 볼 수 있다.
- [ ] 클럽 관리자는 클럽 정보를 수정할 수 있다.
- [ ] 사용자는 클럽에 가입 신청을 보낼 수 있다.

## 3. 기술 계획 (Technical Plan)
- **Backend:**
  - `prisma/schema.prisma`: `Club`, `ClubMember` 모델 정의
  - `app/features/clubs/service.server.ts`: 클럽 생성 및 조회 로직
  - `app/features/clubs/queries.server.ts`: 클럽 데이터베이스 쿼리
- **Frontend:**
  - `app/routes/_public+/clubs+/_index.tsx`: 클럽 목록 페이지
  - `app/routes/_public+/clubs+/new`: 새 클럽 생성 페이지
  - `app/routes/_public+/clubs+/$clubId`: 클럽 상세 페이지 (구현 필요)

## 4. 테스트 케이스
- (성공) 모든 필수 정보를 입력했을 때 클럽이 정상적으로 생성된다.
- (실패) 클럽 이름이 중복될 경우 에러 메시지를 표시한다.
- (성공) 비로그인 상태에서 클럽 목록을 볼 수 있다.
- (실패) 비로그인 상태에서 클럽 생성 페이지 접근 시 로그인 페이지로 리다이렉트된다.
