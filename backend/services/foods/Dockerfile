# syntax=docker/dockerfile:1

FROM golang:1.24-alpine AS build

WORKDIR /src
COPY go.mod ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download
COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 go build -o /out/foods ./cmd/foods

FROM alpine:3.20
RUN apk add --no-cache ca-certificates wget

COPY --from=build /out/foods /usr/local/bin/foods

ENV FOODS_ADDR=0.0.0.0:8084

EXPOSE 8084

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8084/health || exit 1

CMD ["foods"]
