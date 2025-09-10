# 기능: 006 - 커뮤니티(게시판/게시글/댓글)

## 1. 배경/목표
- 게시판 기반 커뮤니티 기능 제공: 글 작성/발행, 첨부 이미지 관리, 투표/좋아요, 댓글 CRUD.
- 불필요한 이미지 정리와 표준 응답 규칙으로 안정적인 사용자 경험 제공.

## 2. 사용자 스토리
- 사용자는 새 글 작성 페이지에서 제목/내용/이미지를 편집하고 발행한다.
- 사용자는 게시글/댓글에 투표/좋아요를 남길 수 있다.
- 작성자는 자신의 게시글/댓글을 수정·삭제(soft delete)할 수 있다.

## 3. 완료 조건 (AC)
- [ ] 새 글 작성 시 초안 포스트가 자동 생성/재사용된다.
- [ ] 발행 시 본문에 미사용 이미지가 저장소·DB에서 정리된다.
- [ ] 게시글 상세에서 합산 투표 수와 내 투표 상태가 표시된다.
- [ ] 댓글 수정 시 새로 참조한 이미지가 연결되고, 미사용 이미지는 정리된다.
- [ ] 삭제는 soft delete로 처리되어 권한자만 복구/완전삭제 가능(향후).

## 4. 기술 계획
- validators: `app/features/communities/validators.ts` — DTO 검증(zod).
- 서비스: `app/features/communities/service.server.ts`
  - `getNewPostData(userId)`: 초안 + 보드 목록
  - `publishPost(dto, userId)`: 미사용 이미지 삭제 → 게시글 업데이트 → 보드 슬러그 반환
  - `getPostDetail(postId, userId?)`: 합산 투표/내 투표 포함 상세
  - `deletePost(postId, userId)`: 작성자 soft delete
  - `updateComment(commentId, userId, contentJSON)`: 이미지 정리 + 내용 업데이트
  - `deleteComment(commentId, userId)`: 작성자 soft delete
  - `votePost`, `voteComment`, `togglePostLike`
- 쿼리: `app/features/communities/queries.server.ts` — DB 접근 전담, Prisma only
- 파일: 미사용 이미지 `s3.server.deletePublicImage` + `deleteFilesByIds`

## 5. 테스트 노트
- (발행) 본문에서 제거된 이미지가 S3/DB에서 삭제되는지 확인.
- (권한) 작성자 이외 삭제/수정 요청 시 실패.
- (투표) -1/0/1 이외 값은 400.

