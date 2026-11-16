#!/usr/bin/env bash
# Start / inspect the digital-twin backend from the sibling meta-web-three checkout.
#
# This repository does not carry a second copy of the compose stack. The
# authoritative orchestration lives in meta-web-three:
#   docker-compose.yml                (includes env / server / ai stacks)
#   docker-compose.digital-twin.yml   (prod overlay for the 3 Java services)
# Only the three Java services are passed to `up`; compose resolves their
# depends_on closure (zookeeper, postgres, redis, kafka) = 7 containers.

set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_REPO="${SERVER_REPO:-$DEPLOY_DIR/../../meta-web-three}"

if [ ! -f "$SERVER_REPO/docker-compose.yml" ] || [ ! -f "$SERVER_REPO/docker-compose.digital-twin.yml" ]; then
  echo "error: meta-web-three compose files not found at: $SERVER_REPO" >&2
  echo "place both repositories side by side, or set SERVER_REPO=/path/to/meta-web-three" >&2
  exit 1
fi

SERVER_REPO="$(cd "$SERVER_REPO" && pwd)"
SERVICES=(gateway factory-service mall-user-service)
MIDDLEWARE=(zookeeper postgres redis kafka)

# Compose resolves build contexts, bind mounts and .env relative to the
# directory of the first compose file, so running from here is equivalent to
# running from the meta-web-three root.
cd "$SERVER_REPO"
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.digital-twin.yml)

usage() {
  cat <<'EOF'
usage: ./start-backend.sh [up|stop|restart|logs|ps|config]

  up       start the 3 Java services + their 4 dependencies (default)
  stop     stop exactly those 7 containers
  restart  stop then up
  logs     follow logs of the 3 Java services
  ps       show status of the 7 containers
  config   print the resolved compose config without starting anything

`stop` deliberately never calls `docker compose down`: that would remove the
whole 30-service project, including containers started for other work.
Both checkouts must be present; SERVER_REPO overrides the default location.
EOF
}

case "${1:-up}" in
  up)
    "${COMPOSE[@]}" up -d "${SERVICES[@]}"
    ;;
  stop)
    "${COMPOSE[@]}" stop "${SERVICES[@]}" "${MIDDLEWARE[@]}"
    ;;
  restart)
    "${COMPOSE[@]}" stop "${SERVICES[@]}" "${MIDDLEWARE[@]}"
    "${COMPOSE[@]}" up -d "${SERVICES[@]}"
    ;;
  logs)
    "${COMPOSE[@]}" logs -f "${SERVICES[@]}"
    ;;
  ps)
    "${COMPOSE[@]}" ps "${SERVICES[@]}" "${MIDDLEWARE[@]}"
    ;;
  config)
    "${COMPOSE[@]}" config
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    echo "error: unknown command: $1" >&2
    usage >&2
    exit 1
    ;;
esac
