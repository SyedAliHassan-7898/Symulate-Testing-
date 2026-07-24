# Containerized runner: Playwright (headless Chromium) + k6, both preinstalled,
# so the ENTIRE test suite (UI/API + load/performance) runs identically
# regardless of the host machine - sidesteps host-machine resource issues
# (e.g. low RAM on Windows) entirely, since the container gets its own
# isolated, predictable environment.
#
# Build:  docker compose -f docker/docker-compose.yml build runner
# Run:    npm run docker:test
#         (or: docker compose -f docker/docker-compose.yml run --rm runner)

FROM mcr.microsoft.com/playwright:v1.48.0-jammy

# --- Install k6 ---------------------------------------------------------
RUN apt-get update \
  && apt-get install -y --no-install-recommends gnupg2 curl ca-certificates \
  && curl -s https://dl.k6.io/key.gpg | gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg \
  && echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
       > /etc/apt/sources.list.d/k6.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends k6 \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Browsers already ship in the base image; this just confirms/repairs deps.
RUN npx playwright install --with-deps chromium

ENV HEADLESS=true
ENV K6_BROWSER_HEADLESS=true

# Runs Playwright (headless, all specs) then the full k6 suite.
# Override the command to run a subset instead, e.g.:
#   docker compose -f docker/docker-compose.yml run --rm runner npm run k6:all
CMD ["npm", "run", "test:all:full"]
