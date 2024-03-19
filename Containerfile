FROM docker.io/denoland/deno:1.41.3 AS builder

WORKDIR /app
COPY . .

RUN apt update && apt install -y unzip
RUN deno compile --allow-env --allow-net --allow-read --allow-write --unstable-kv --output /app/bouncer bin/bouncer.ts

FROM gcr.io/distroless/cc

WORKDIR /app

COPY --from=builder /app/bouncer /app/bouncer

VOLUME [ "/app/data" "/app/logs" ]

ENTRYPOINT [ "/app/bouncer" ]
