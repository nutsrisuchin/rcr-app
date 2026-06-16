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

# Copy backend files
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install

# Copy the rest of the backend files
COPY server/ .

# Copy the built frontend static files from Stage 1 into a 'dist' folder
COPY --from=frontend-build /app/dist /app/dist

# Expose port (Cloud Run sets PORT env var automatically)
ENV PORT=8080
EXPOSE 8080

# Run the backend server
CMD ["node", "index.js"]
