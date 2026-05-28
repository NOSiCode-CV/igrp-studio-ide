#!/bin/sh

set -eu

# Keep this wrapper lightweight: compose passes minio args (server, console-address, etc).
exec /usr/bin/docker-entrypoint.sh "$@"
