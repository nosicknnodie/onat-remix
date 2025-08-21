# 기능: 001 - 사용자 인증

## 1. 사용자 스토리
- "웹사이트 방문자는 회원가입을 통해 계정을 만들고, 로그인을 통해 개인화된 서비스를 이용하고 싶다."
- "비밀번호를 잊어버린 사용자는 비밀번호 재설정 기능을 통해 계정을 되찾고 싶다."

## 2. 완료 조건 (Acceptance Criteria)
- [x] 사용자는 이메일과 비밀번호로 회원가입할 수 있다.
- [x] 가입 시 이메일 인증 절차를 거친다.
- [x] 사용자는 이메일과 비밀번호로 로그인할 수 있다.
- [x] 로그인 시 JWT 토큰이 발급되어 세션이 유지된다.
- [x] 사용자는 등록된 이메일을 통해 비밀번호를 재설정할 수 있다.

## 3. 기술 계획 (Technical Plan)
- **Backend:**
  - `prisma/schema.prisma`: `User` 모델 정의
  - `app/features/auth/service.server.ts`: 인증 관련 비즈니스 로직
  - `app/libs/crypto.utils.ts`: 비밀번호 해싱
  - `app/libs/auth/token.ts`: JWT 토큰 생성 및 검증
- **Frontend:**
  - `app/routes/_public+/register`: 회원가입 페이지
  - `app/routes/_public+/login`: 로그인 페이지
  - `app/routes/_public+/reset`: 비밀번호 재설정 페이지

## 4. 테스트 케이스
- (성공) 올바른 정보로 로그인 시 메인 페이지로 이동
- (실패) 틀린 비밀번호로 로그인 시 에러 메시지 표시
- (실패) 이미 가입된 이메일로 회원가입 시도 시 에러
