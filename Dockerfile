FROM hayd/alpine-deno:latest

EXPOSE 8080 

WORKDIR /app

USER deno

COPY ["server/index.ts", "server/Quiz.ts", "server/types.ts", "/app/"]
COPY ["server/commands", "/app/commands"]
COPY ["server/helpers", "/app/helpers"]
COPY ["client/dist", "/app/client/dist"]

RUN deno cache index.ts
COPY . .

CMD ["run", "--allow-all", "index.ts"]