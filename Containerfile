FROM docker.io/denoland/deno:1.41.3

WORKDIR /app
COPY . .

# TODO: Add cache layer for dependencies
RUN deno cache bin/bouncer.ts

VOLUME [ "/app/data", "/app/logs" ]

CMD [ "task", "start" ]
