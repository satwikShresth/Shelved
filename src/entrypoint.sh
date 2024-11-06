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

if [ "${ENV}" = "development" ]; then 
  deno install --allow-scripts
  deno task dev
else
  deno install --allow-scripts
  deno task start
fi
