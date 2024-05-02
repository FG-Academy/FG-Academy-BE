# Build stage
FROM node:20.4.0-alpine3.18 AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20.4.0-alpine3.18 AS production

# 환경변수를 production으로 설정
ENV NODE_ENV=production

WORKDIR /app

# Production dependencies만 설치
COPY package*.json ./
RUN npm ci --only=production

# 빌드한 파일을 복사
COPY --from=build /app/dist ./dist

EXPOSE 3000

# Production 모드로 앱 시작
CMD ["npm", "run", "start:prod"]