FROM node:22-bullseye-slim AS builder

RUN corepack enable && corepack prepare pnpm@10.7.1 --activate

WORKDIR /app

# ✅ 먼저 의존성 관련 파일만 복사 (캐시 활용 가능)
COPY package.json pnpm-lock.yaml ./

# ✅ node_modules 캐시될 수 있게
RUN pnpm install
ADD prisma .
RUN npx prisma generate
# ✅ 그다음 전체 소스 복사 (변경 있을 때만 다시 설치됨)
COPY . .
RUN pnpm build
# Remove devDependencies to shrink the final bundle size
RUN pnpm prune --prod

# 2단계 (런타임 이미지)
FROM node:22-bullseye-slim AS runner

RUN corepack enable && corepack prepare pnpm@10.7.1 --activate
WORKDIR /app
# Bring the pruned production node_modules from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/.env ./.env

EXPOSE 3000
CMD ["pnpm", "start"]