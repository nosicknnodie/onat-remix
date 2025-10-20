# FROM node:22-bullseye-slim AS base
FROM harbor.onsoa.net/library/node:22-bullseye-slim AS base
RUN corepack enable && corepack prepare pnpm@10.7.1 --activate
WORKDIR /app

FROM base AS build-deps
WORKDIR /app
# ✅ 먼저 의존성 관련 파일만 복사 (캐시 활용 가능)
COPY . .
# ✅ node_modules 캐시될 수 있게
RUN pnpm install
RUN pnpm build

ADD prisma .
RUN pnpm prisma generate
# Remove devDependencies to shrink the final bundle size
RUN pnpm prune --prod


## prisma 빌드가 캐시로 묶이면 안됨
# FROM base AS prod-deps
# WORKDIR /app
# COPY package.json pnpm-lock.yaml ./
# RUN --mount=type=cache,target=/root/.pnpm-store \
#     pnpm install

# 2단계 (런타임 이미지)
# FROM node:22-bullseye-slim AS runner
FROM harbor.onsoa.net/library/node:22-bullseye-slim AS runner

RUN corepack enable && corepack prepare pnpm@10.7.1 --activate
WORKDIR /app
# Bring the pruned production node_modules from the builder stage
COPY --from=build-deps /app/node_modules ./node_modules
COPY --from=build-deps /app/build ./build
COPY --from=build-deps /app/public ./public
COPY --from=build-deps /app/package.json ./package.json
COPY --from=build-deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build-deps /app/.env ./.env

EXPOSE 3000
CMD ["pnpm", "start"]