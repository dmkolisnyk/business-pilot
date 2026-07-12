FROM node:24.18.0-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.11.0 --activate

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

FROM dependencies AS build

# Prisma 7 loads prisma.config.ts during client generation. This non-secret URL
# is used only for build-time configuration; generation does not connect to it.
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?schema=public

COPY . .

RUN pnpm --filter ./apps/api prisma:generate
RUN pnpm --filter ./apps/api build

FROM base AS runtime

ENV NODE_ENV=production

COPY --from=build /app /app

EXPOSE 4000

USER node

CMD ["pnpm", "--filter", "./apps/api", "start:docker"]
