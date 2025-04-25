# Onat Remix Project

Remix와 TypeScript, Tailwind CSS를 사용한 웹 애플리케이션 프로젝트입니다.

## 기술 스택

- [Remix](https://remix.run/) - 풀스택 웹 프레임워크
- [TypeScript](https://www.typescriptlang.org/) - 정적 타입 지원
- [Tailwind CSS](https://tailwindcss.com/) - 유틸리티 기반 CSS 프레임워크
- [Biome](https://biomejs.dev/) - 코드 린팅 및 포매팅
- [Vite](https://vitejs.dev/) - 빌드 도구

## 시작하기

### 필수 조건

- Node.js 20.0.0 이상
- pnpm (패키지 매니저)

### 설치

```bash
# 패키지 설치
pnpm install
```

### 개발 서버 실행

```bash
# 개발 서버 시작
pnpm dev
```

개발 서버는 기본적으로 http://localhost:5173 에서 실행됩니다.

### 빌드

```bash
# 프로덕션 빌드
pnpm build

# 빌드된 앱 실행
pnpm start
```

## 개발 도구

### 코드 품질

```bash
# 린팅
pnpm lint

# 코드 포매팅
pnpm format

# 타입 체크
pnpm typecheck
```

### VS Code 확장 프로그램

프로젝트에 도움이 되는 VS Code 확장 프로그램:

- `biomejs.biome` - Biome 린터 및 포매터
- `bradlc.vscode-tailwindcss` - Tailwind CSS 지원
- `formulahendry.auto-rename-tag` - HTML/JSX 태그 자동 이름 변경
- `formulahendry.auto-close-tag` - HTML/JSX 태그 자동 닫기
- `christian-kohler.path-intellisense` - 파일 경로 자동 완성
- `christian-kohler.npm-intellisense` - npm 패키지 자동 완성
- `ms-vscode.vscode-typescript-next` - 향상된 TypeScript 지원

## 프로젝트 구조

```
onat-remix/
├── app/                    # 애플리케이션 소스 코드
├── public/                # 정적 파일
├── .vscode/              # VS Code 설정
├── biome.json            # Biome 설정
├── tailwind.config.ts    # Tailwind CSS 설정
├── tsconfig.json         # TypeScript 설정
└── vite.config.ts        # Vite 설정
```

## 환경 변수

프로젝트 루트에 `.env` 파일을 생성하고 필요한 환경 변수를 설정하세요.1
