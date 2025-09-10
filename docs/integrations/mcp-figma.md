# MCP — Figma 연동 가이드

본 문서는 Codex(MCP)에서 Figma를 데이터 소스로 활용하기 위한 설정과 활용 예시를 제공합니다.

## 1) 준비물
- Figma Personal Access Token
  - Figma → Settings → Personal access tokens → 발급
  - 최소 read 권한 필요
- (선택) Figma 파일/노드 ID
  - 파일 URL 예: `https://www.figma.com/file/<FILE_ID>/<name>?node-id=<NODE_ID>`

## 2) Codex MCP 설정(config.toml)
사용자 홈의 Codex 설정 파일을 편집합니다: `/Users/<you>/.codex/config.toml`

아래 중 한 가지 서버를 선택해 활성화하세요. 토큰은 로컬 파일에만 존재하며 레포에 커밋하지 않습니다.

예시 A — 공식 패키지(@modelcontextprotocol/server-figma) 사용
```toml
[mcpServers.figma]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-figma"]
env = { FIGMA_TOKEN = "<YOUR_FIGMA_TOKEN>" }
disabled = false
```

예시 B — 커뮤니티 패키지(mcp-figma) 사용
```toml
[mcpServers.figma]
command = "npx"
args = ["-y", "mcp-figma"]
env = { FIGMA_TOKEN = "<YOUR_FIGMA_TOKEN>" }
disabled = false
```

참고
- npx 실행은 최초 1회 네트워크 다운로드가 필요합니다.
- 토큰을 바꾸려면 `env.FIGMA_TOKEN`만 수정하면 됩니다.
- 다른 런타임(예: node 직접 실행)을 쓰는 경우, `command`/`args`를 해당 서버의 실행 방식에 맞게 조정하세요.

## 3) 재시작/적용
- Codex CLI를 재시작하거나 MCP 서버 재연결을 수행합니다.
- 연결 성공 시, 에이전트가 `figma` 서버의 도구들을 인식하게 됩니다.

## 4) 사용 예시(개념)
서버 구현에 따라 메서드 이름은 약간 다를 수 있으나, 일반적인 워크플로는 다음과 같습니다.

- 프레임/노드 탐색
  - 입력: 파일 ID, (선택) 쿼리/노드 ID
  - 결과: 프레임/컴포넌트 목록, 노드 메타데이터
- 자산 내보내기
  - PNG/SVG로 특정 노드를 익스포트하고 로컬 파일로 저장
- 디자인 토큰 동기화
  - 색/타이포/스페이싱 토큰을 JSON으로 가져와 프로젝트 변수로 반영

예시 프롬프트
```
Figma 파일 <FILE_ID>에서 "Button/Primary" 컴포넌트의 PNG를 2x로 내보내고,
Storybook 스토리를 생성해줘. 색/타입 토큰도 JSON으로 가져와 utils/tokens에 저장해.
```

## 5) 보안/운영 팁
- 토큰은 절대 레포에 커밋하지 않습니다(홈 디렉터리 설정 유지).
- CI에서 사용하려면 GitHub Secrets에 저장 후 Actions에서 환경변수로 주입해 별도 MCP 서버 인스턴스를 실행하세요.
- 요청 실패(401/403/429) 시 재시도/쿼터 정책을 문서화해두면 운영 안정성에 도움이 됩니다.

