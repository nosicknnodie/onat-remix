# Figma 라이브러리 구성 계획(Design System Seed)

## 목표
- 현재 코드의 공통 컴포넌트를 Figma에서도 재사용 가능한 라이브러리로 제공.
- 코드(Tailwind/컴포넌트)와 디자인(Figma)이 같은 토큰/이름/상태를 공유.

## 파일 구조(권장)
- Pages
  - Foundations (Color / Typography / Radius / Spacing / Elevation)
  - Icons
  - Components (Atoms / Molecules / Organisms)
  - Patterns (Forms / Tables / Navigation / Cards 등)
  - Templates (페이지 레이아웃)

## 네이밍 규칙
- 컴포넌트: `DS/[Group]/[Component]` 예) `DS/Atoms/Button`
- Variant 속성: `size=sm|md|lg`, `tone=primary|secondary|destructive|ghost|link`, `state=default|hover|focus|disabled|loading`
- Tokens: `color.primary/foreground`, `radius.md`, `space.4`, `elevation.1` 등

## 토큰 매핑(초안)
- 코드의 CSS 변수 → Figma 스타일/토큰
  - `--primary` ↔ color.primary
  - `--primary-foreground` ↔ color.primary-foreground
  - `--background` ↔ color.background
  - `--foreground` ↔ color.foreground
  - `--muted` ↔ color.muted
  - `--accent` ↔ color.accent
  - `--destructive` ↔ color.destructive
  - `--ring` ↔ color.ring
  - `--border` ↔ color.border
  - `--radius` ↔ radius.lg (md/sm는 -2px/-4px 변형)
- 폰트: Pretendard, Inter 스타일을 헤딩/본문으로 스타일화

## 컴포넌트 맵핑(1차 대상)
- App 공통(`app/components/ui`)
  - Button, Input, Textarea, Checkbox, Radio, Select, Switch, Slider
  - Badge, Card, Alert, Tooltip, Toast, Skeleton, Progress, Tabs
  - Dialog, Drawer, Popover, DropdownMenu, HoverCard, Menubar, NavigationMenu
  - Pagination, Breadcrumb, Separator, Avatar, Calendar, Carousel
  - Table(기본), DataTable(확장 패턴)
  - Sidebar(레이아웃 패턴)
- 커스텀(`app/components`)
  - StarRating, Position(Badge), ConfirmModal, DataTable, Loading, ProgressBar

각 컴포넌트에 대해 Figma Variants로 props/state를 모델링:
- Button: size, tone(variant), state, iconLeft/Right(bool)
- Input: size, state, withIcon(bool), helpText(bool)
- Select: size, state, withIcon(bool)
- Tabs: orientation(h/v), state
- Dialog/Drawer: size, withHeader(bool), withFooter(bool)
- Table: density(sm/md), withSelection(bool), withActions(bool)
- StarRating: value(0..5 step 0.5), size(sm/md/lg)

## 작업 순서
1) Foundations 구축
   - Color/Type/Radius/Spacing/Elevation 스타일 정의(토큰 플러그인 사용 권장)
2) Icons
   - 프로젝트 아이콘 세트(예: Lucide) 중 자주 쓰는 24px/Grid 1:1로 import → 컴포넌트화
3) Components 제작
   - 1차 대상(Buttons, Inputs, Select, Badge, Card, Tabs, Dialog, Drawer, Tooltip, Toast)
   - Variant 속성/Auto Layout/Constraints 설정
4) Patterns/Template
   - Form 패턴, Table 패턴, Sidebar 레이아웃 등 조합 컴포넌트
5) 라이브러리 Publish
   - 팀 라이브러리로 게시, 소비 파일에서 enable

## 코드 ↔ 디자인 동기화 팁
- 이름 매칭: 코드의 파일명/props를 Figma Variant 이름과 맞춘다.
- 토큰: Tailwind CSS 변수 이름을 토큰으로 재사용(색상은 hsl(var(--...)) 패턴 유지)
- 문서화: 각 컴포넌트 프레임에 Usage/Do&Don’t/Props를 주석으로 기재

## 다음 단계
- `docs/integrations/figma-scaffold.md`의 스크립트는 이미지/스토리 스캐폴딩 전용입니다(아이콘/자산에 활용).
- 추후 MCP로 Figma 노드 메타(컴포넌트 키) ↔ 코드 컴포넌트 이름 매핑 JSON을 관리해 자동 확인 리포트를 생성할 수 있습니다.

