# 기능: 010 - 설정/프로필(Settings)

## 1. 배경/목표
- 사용자가 자신의 프로필, 체형/장비 정보, 포지션, 비밀번호를 관리할 수 있다.

## 2. 사용자 스토리
- 사용자는 이름/성별/생일/지역/프로필 이미지를 수정한다.
- 사용자는 체형/장비 정보(키/신발/의류 사이즈, native 여부)를 기록한다.
- 사용자는 선호 포지션 1~3순위를 지정한다.
- 사용자는 현재 비밀번호 검증 후 새 비밀번호로 변경한다.

## 3. 완료 조건 (AC)
- [ ] 프로필 업데이트 후 세션 캐시가 무효화되어 즉시 반영된다.
- [ ] 체형/장비 정보가 DB에 저장된다.
- [ ] 포지션 1~3이 유효 범위 내에서만 저장된다.
- [ ] 비밀번호 변경은 현재 비밀번호 검증 후에만 성공한다.

## 4. 기술 계획
- 서비스: `app/features/settings/service.server.ts`
  - `updateProfile({ id, name, gender, birth(YYYY-MM-DD), si, gun, userImageId })`
  - `updateBody(userId, { playerNative, clothesSize, shoesSize, height })`
  - `updatePosition(userId, { position1, position2, position3 })`
  - `changePassword(email, currentPassword, newPassword)` — bcrypt 비교 → `auth.core.service.setPasswordByEmail`
- 캐시: `invalidateUserSessionCache(userId)`로 세션 캐시 무효화

## 5. 테스트 노트
- (프로필) 부분 업데이트 시 누락 필드는 유지/또는 null 처리 확인.
- (비밀번호) 현재 비밀번호 불일치 시 실패 메시지.
- (포지션) 동일 포지션 중복 지정 방지(추가 검증 필요 시 validators에서 처리).

