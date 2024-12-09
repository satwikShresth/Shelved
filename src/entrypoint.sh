#!/bin/sh

if [ "${ENV}" = "development" ]; then 
  deno install --allow-scripts
  deno task migrate
  deno task seed
  deno fmt --watch &
  deno task dev
else
  deno install --allow-scripts
  deno task migrate
  deno task seed
  deno task start
fi
