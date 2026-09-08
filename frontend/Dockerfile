FROM node:26-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build && chown -R node:node /app /pnpm

USER node

EXPOSE 5173
CMD ["pnpm", "dev"]
