# Pre-built frontend image
# Build is done locally on the host (npm run build), then COPY'd in.
# This avoids npm install inside Docker which hangs on Windows Docker Desktop.
FROM node:20-slim

WORKDIR /app

# Copy the pre-built application from host
# .next/ contains the compiled output
# node_modules/ are needed at runtime for next start
# package.json is needed for npm start
COPY package.json ./
COPY .next ./.next
COPY node_modules ./node_modules
COPY public ./public

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

CMD ["npx", "next", "start"]
