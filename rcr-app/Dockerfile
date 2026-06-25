# Stage 1: Build the React Application
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Setup the Express Backend
FROM node:20-alpine
WORKDIR /app

# Build tools required for sqlite3 native module compilation
RUN apk add --no-cache python3 make g++

# Copy backend source first
WORKDIR /app/server
COPY server/ .

# Remove any host-built node_modules (wrong architecture) and install fresh on Alpine
RUN rm -rf node_modules && npm install

# Copy the built frontend static files from Stage 1 into a 'dist' folder
COPY --from=frontend-build /app/dist /app/dist

# Expose port (Cloud Run sets PORT env var automatically)
ENV PORT=8080
EXPOSE 8080

# Run the backend server
CMD ["node", "index.js"]
