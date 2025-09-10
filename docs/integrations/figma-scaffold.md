# Figma → Storybook 스캐폴딩 스크립트

이 스크립트는 Figma 노드를 PNG/SVG로 익스포트하고, 간단한 React 컴포넌트와 Storybook 스토리를 생성합니다.

## 준비물
- 환경변수: `FIGMA_TOKEN` (Figma Personal Access Token)
- 설정 파일: `figma.scaffold.json`

## 설정 파일 예시 (figma.scaffold.json)
```json
{
  "fileKey": "<YOUR_FIGMA_FILE_KEY>",
  "output": { "assetsDir": "public/figma", "componentsDir": "app/components/figma" },
  "pngScale": 2,
  "items": [
    { "nodeId": "0:1", "name": "Button Primary", "format": "png" }
  ]
}
```

필드 설명
- `fileKey`: Figma 파일 URL의 `<FILE_KEY>` 부분
- `items[]`
  - `nodeId`: Figma 노드 ID (URL의 `node-id=` 값)
  - `name`: 생성될 컴포넌트/파일 이름(공백은 PascalCase로 변환)
  - `format`: `png` 또는 `svg` (기본: `png`)
- `pngScale`: PNG 내보내기 배율(기본: 2)
- `output.assetsDir`: 내보낸 이미지 저장 경로(기본: `public/figma`)
- `output.componentsDir`: 생성 컴포넌트/스토리 저장 경로(기본: `app/components/figma`)

## 실행
1) 토큰 설정: `export FIGMA_TOKEN=xxxxxxxx`
2) 스캐폴딩: `pnpm design:scaffold`
   - 옵션: `--config <path>`로 다른 설정 파일 지정, `--file <fileKey>`로 fileKey 덮어쓰기
3) 결과물
   - 자산: `public/figma/<Name>.png|svg`
   - 컴포넌트: `app/components/figma/<Name>.tsx`
   - 스토리: `app/components/figma/<Name>.stories.tsx`

## 참고
- 생성된 컴포넌트는 `<img src="/figma/..." />` 형태의 단순 래퍼입니다.
- `vite-plugin-svgr` 사용 시, 향후 SVG를 React 컴포넌트로 임포트하도록 개선할 수 있습니다.
- 이 스크립트는 스켈레톤입니다. 변환/토큰 동기화, 배치 네이밍, 접근성 속성(alt) 등은 필요에 맞게 확장하세요.

