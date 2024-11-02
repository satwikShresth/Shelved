#!/bin/sh

ENV_JSON_PATH="/src/env.json"

cat <<EOF > $ENV_JSON_PATH
{
  "user": "${POSTGRES_USER}",
  "password": "${POSTGRES_PASSWORD}",
  "host": "${POSTGRES_SERVER}",
  "database": "${POSTGRES_DB}",
  "port": "${POSTGRES_PORT}"
}
EOF

if [ "${ENV}" = "DEV" ]; then 
  deno task database
  deno task format &
  deno task dev
else
  deno task database
  deno task start
fi
