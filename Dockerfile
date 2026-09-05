FROM node:18-alpine

WORKDIR /app

# Install dependencies for both backend and frontend
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY package*.json ./

RUN npm ci

# Build backend
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/
RUN cd backend && npm run build

# Build frontend
COPY frontend/src ./frontend/src
COPY frontend/index.html ./frontend/
COPY frontend/vite.config.ts ./frontend/
RUN cd frontend && npm run build

EXPOSE 3000

CMD ["node", "backend/dist/index.js"]