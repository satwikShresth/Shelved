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
  deno task migrate
  deno task seed
  deno task dev
else
  deno task start
fi
