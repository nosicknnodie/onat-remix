# Onat-Remix 마스터 플랜

## 1. 프로젝트 비전

전국의 아마추어 축구인들이 손쉽게 클럽을 관리하고, 경기를 매칭하며, 팀원(용병)을 구하는 원스톱 커뮤니티 플랫폼을 제공한다.

## 2. 핵심 기능 목록

### 현재 구현된 기능 (Based on existing code)
- **(완료) 001: 사용자 인증 (Auth):** 회원가입, 로그인, 비밀번호 재설정
- **(부분) 002: 클럽 (Clubs):** 클럽 목록 조회, 기본 정보 표시
- **(부분) 003: 용병 (Mercenary):** 용병 관련 기본 템플릿 및 UI
- **(부분) 004: 게시글 (Post):** 게시글 관련 기본 템플릿 및 UI

### 앞으로 구현할 기능 (Roadmap)
- 클럽 관리 기능 고도화 (멤버 관리, 가입 신청/승인)
- 경기 매칭 시스템 (경기 생성, 신청, 관리)
- 용병 검색 및 제안 기능
- 사용자 프로필 및 평점 시스템
- 실시간 경기 상황 알림

## 3. 기술 아키텍처

- **Framework:** Remix
- **Build Tool:** Vite
- **Language:** TypeScript
- **Package Manager:** pnpm
- **Database ORM:** Prisma
- **Styling:** Tailwind CSS & shadcn/ui
- **Testing:** Vitest
- **Component Lib:** Storybook
- **CI/CD:** Docker, GitHub Actions
