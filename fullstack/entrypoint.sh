#!/bin/sh

ENV_JSON_PATH="/fullstack/env.json"

cat <<EOF > $ENV_JSON_PATH
{
  "user": "${POSTGRES_USER}",
  "password": "${POSTGRES_PASSWORD}",
  "host": "${POSTGRES_SERVER}",
  "database": "${POSTGRES_DB}",
  "port": "${POSTGRES_PORT}"
}
EOF

# Execute the original command
exec "$@"

cat $ENV_JSON_PATH


if [ ${ENV} = "DEV" ]; then 
  deno task format &
  deno task dev
else
  deno task start
fi
