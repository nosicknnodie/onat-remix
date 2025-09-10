# Figma 컴포넌트 스펙(코드 매핑)

이 문서는 Figma에서 재사용 컴포넌트를 만들 때 코드(UI 라이브러리)와 1:1로 매핑하기 위한 스펙입니다.

## 공통 토큰 매핑
- Color Styles
  - background ↔ `--background`
  - foreground ↔ `--foreground`
  - primary / primary-foreground ↔ `--primary` / `--primary-foreground`
  - secondary / secondary-foreground ↔ `--secondary` / `--secondary-foreground`
  - accent / accent-foreground ↔ `--accent` / `--accent-foreground`
  - muted / muted-foreground ↔ `--muted` / `--muted-foreground`
  - destructive / destructive-foreground ↔ `--destructive` / `--destructive-foreground`
  - border ↔ `--border`, input ↔ `--input`, ring ↔ `--ring`
  - sidebar.* ↔ `--sidebar-*`
- Radius
  - radius.lg ↔ `--radius`, radius.md/sm는 파생값(-2px/-4px)
- Typography
  - sans: Inter, pretendard: Pretendard

## Button (app/components/ui/button.tsx)
- Variants
  - variant: default | destructive | outline | secondary | ghost | link
  - size: default | sm | lg | icon
- States
  - default, hover, focus (ring-1), disabled (opacity-50)
- Props 대응
  - icon 모드: `size=icon` (정사각형)
  - link 변형: `variant=link` (텍스트 링크 스타일)
- Figma Variants 제안
  - size: sm | md(default) | lg | icon
  - tone: default | destructive | outline | secondary | ghost | link
  - state: default | hover | focus | disabled | loading(선택)
  - iconLeft / iconRight: boolean (Auto Layout으로 아이콘/라벨 배치)
- 시각 스펙 힌트(코드 클래스)
  - default: bg=primary, text=primary-foreground, hover bg=primary/90
  - outline: border=input, bg=background, hover bg=accent + text=accent-foreground
  - secondary: bg=secondary, text=secondary-foreground, hover bg=secondary/80
  - destructive: bg=destructive, text=destructive-foreground, hover bg=destructive/90
  - ghost: hover bg=accent + text=accent-foreground
  - link: text=primary, hover underline
  - size.sm: h-8 px-3 text-xs / size.md: h-9 px-4 / size.lg: h-10 px-8 / icon: h-9 w-9

## Input (app/components/ui/input.tsx)
- Variants
  - size: md(default) — 코드상 단일 스타일. Figma에서는 sm/md/lg 3단계를 모델링해도 OK(미래 확장).
- States
  - default, focus (ring-1), disabled (opacity-50), invalid(디자인 전용, 보더/메시지)
- 시각 스펙 힌트(코드 클래스)
  - border=input, bg=transparent, placeholder=muted-foreground, focus ring=ring
  - h-9, rounded-md, text-sm, px-3, py-1
- Figma Variants 제안
  - size: sm | md | lg
  - state: default | focus | invalid | disabled
  - withIcon: boolean, helpText: boolean

## Checkbox / Radio / Select / Switch
- 공통
  - state: default | hover | focus | disabled | checked(true/false)
  - size: sm | md (코드 기준 h-4~6 권장)
- Select
  - open state, withIcon, helper text 옵션 추가

## Dialog / Drawer / Popover / Tooltip
- Variants
  - size: sm | md | lg
  - withHeader / withFooter: boolean
  - state: closed | open (오버레이 포함)

## Table / DataTable
- Variants
  - density: sm | md
  - withSelection / withActions: boolean
  - empty / loading 상태 프레임 별도 제공

## Custom: StarRating (app/components/StarRating.tsx)
- Variants
  - value: 0..5 (step 0.5) — Figma에서는 샘플 스텝으로 준비
  - size: sm | md | lg (아이콘 16/20/24)
- State
  - readonly vs interactive(hover 시 하이라이트)

## 네이밍 원칙
- Figma 컴포넌트: `DS/[Atoms|Molecules|Organisms]/[ComponentName]`
- Variant 속성: `size=sm`, `tone=primary`, `state=hover`, `iconLeft=true`
- Color Styles: `color.[name]` (예: `color.primary`, `color.primary-foreground`)

## 매핑 유지 팁
- 파일/컴포넌트명은 코드와 동일 철자(PascalCase). 예) `Button`, `Input`.
- Variant 옵션 이름은 코드의 variant/size/state 의미와 호환되게 유지.
- 신규 변형 추가 시, ADR 또는 docs 업데이트 후 Figma Variants에 반영.

