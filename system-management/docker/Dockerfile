# Build stage for the Rust native module and Electron web assets
FROM node:20-bookworm AS builder

ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1

# Debian's rustc is too old for this crate, so install a current stable toolchain.
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential curl pkg-config python3 \
      libasound2-dev libv4l-dev libudev-dev \
    && rm -rf /var/lib/apt/lists/*
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
      | sh -s -- -y --profile minimal --default-toolchain stable
ENV PATH="/root/.cargo/bin:${PATH}"

# build:native resolves ../system-support/Cargo.toml from /app.
COPY system-support /system-support

WORKDIR /app

# Copy the manifest only; this app ships without a lockfile.
COPY system-management/package.json ./

# Install dependencies from the manifest
RUN npm install --legacy-peer-deps

# Copy source code
COPY system-management /app

# Generate native/index.d.ts before any TypeScript check runs.
RUN npm run build:native

# Build the web assets
RUN npm run build

# Production stage - serve the static assets with nginx
FROM nginx:alpine AS production

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY system-management/docker/nginx.conf.d/default.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
