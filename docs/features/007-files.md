# 기능: 007 - 파일/이미지 업로드

## 1. 배경/목표
- 사용자가 업로드한 이미지를 표준 포맷(WebP)으로 변환해 공용 스토리지(S3)로 저장하고, 메타데이터를 DB에 기록한다.

## 2. 사용자 스토리
- 사용자는 이미지를 업로드하면, 품질 손실 최소화로 빠르게 표시되길 원한다.

## 3. 완료 조건 (AC)
- [ ] 업로드한 이미지는 WebP로 변환되어 저장된다.
- [ ] 업로드 결과로 파일 ID/URL/용량/목적(purpose)이 기록된다.
- [ ] 퍼블릭 URL이 즉시 응답되어 UI에서 미리보기가 가능하다.

## 4. 기술 계획
- 서비스: `app/features/files/service.server.ts`
  - `saveImageFromNodeFile({ nodeFile, userId, purpose })`
  - `sharp`로 WebP 변환(quality=80), 파일명 slugify, S3 `sendBufferToPublicImage`
  - Prisma `file` 레코드 생성(url, key, uploaderId, mimeType, size, purpose)
- 주의: 용량/확장자 제한, 이미지 검증 등의 추가 검사는 추후 강화.

## 5. 테스트 노트
- (성공) 임의 PNG/JPG 업로드 시 WebP로 저장되고 URL이 반환된다.
- (메타) DB에 uploaderId, size가 올바르게 반영되는지 확인.

