#!/bin/sh

if [ "${ENV}" = "development" ]; then 
  export INSECURE_COOKIE=1

  deno install --allow-scripts
  deno task migrate
  deno task seed
  deno task dev
else
  deno install --allow-scripts
  deno task start
fi
