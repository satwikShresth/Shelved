#!/bin/sh -l

 exec docker compose up --build --attach shelved --watch
