# 디자인 인벤토리(코드 기준 → Figma 매핑)

> 코드의 공통 컴포넌트를 스캔하여 Figma 라이브러리 작성 체크리스트로 정리했습니다.

## 공통 UI (app/components/ui)
- Link, Button, Input, Textarea, Label
- Checkbox, RadioGroup, Select, Switch, Slider
- Badge, Card, Alert, Tooltip, Toast, Toaster, Skeleton, Progress
- Tabs, Separator, Pagination, Breadcrumb
- Dialog, Drawer, Popover, DropdownMenu, HoverCard, Menubar, NavigationMenu, Resizable, Sheet
- Avatar, Calendar, Carousel, ScrollArea
- Table (기본), Form (필드/에러 패턴), Confirm
- Sidebar (레이아웃 패턴)

## 커스텀 (app/components)
- StarRating, StarIcon
- Position(Badge 확장), ProgressBar, Loading, InfiniteSentinel
- ConfirmModal, DataTable, ItemLink, MarkdownEditor, QuillEditor
- Lexical Editor 묶음(에디터/뷰/노드/테마)

## 1차 Figma 제작 우선순위
- Atoms: Button, Input, Select, Checkbox, Radio, Switch, Badge, Tag, Tooltip, Toast, Progress
- Molecules: Form(필드+에러), Card, Tabs, Pagination, Breadcrumb
- Organisms/Patterns: Dialog, Drawer, Table, DataTable, Sidebar
- Custom: StarRating, Position

## 속성(Variants) 초안 가이드
- Button: size(sm/md/lg), tone(primary/secondary/destructive/ghost/link), state(default/hover/focus/disabled/loading), iconLeft/Right
- Input: size(sm/md), state(default/focus/invalid/disabled), withIcon, helpText
- Select: size(sm/md), state(default/open/disabled), withIcon
- Tabs: orientation(horizontal/vertical), state(default/active/disabled)
- Dialog: size(sm/md/lg), withHeader, withFooter
- Table: density(sm/md), withSelection, withActions
- StarRating: value(0..5 step 0.5), size(sm/md/lg)

## 토큰 연결
- Tailwind CSS 변수(HSL) ↔ Figma Color Styles
  - primary, secondary, accent, muted, destructive, background, foreground, ring, border
- Radius: `--radius` → radius.lg/md/sm
- Font: Pretendard / Inter → 헤딩/본문 스타일

## 다음 액션
- [ ] Figma 파일 생성: Foundations/Components/Patterns 페이지 구성
- [ ] Color/Type/Radius/Spacing/Elevation 스타일 등록
- [ ] Button/Input 등 Atoms부터 Variant로 모델링 → 라이브러리 Publish
- [ ] Custom(StarRating/Position) 설계 및 코드 props 매핑 문서화
- [ ] MCP 연동으로 노드 ID 수집 → `figma.scaffold.json`에 아이콘/자산 항목 추가

