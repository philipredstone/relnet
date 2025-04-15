# syntax=docker/dockerfile:1
FROM node:22 AS frontend-builder

# Workingdir
WORKDIR /frontend

# Copy files
COPY frontend/src/ src/
COPY frontend/package.json .
COPY frontend/index.html .
COPY frontend/tsconfig.json .
COPY frontend/vite.config.mjs .

# Install libs
RUN yarn install
# Build to dist/
RUN yarn build


FROM node:22 AS backend-builder

# Workingdir
WORKDIR /app

COPY package.json .
RUN yarn install

COPY tsconfig.json .
COPY src/ src/

# Build to dist/
RUN yarn run build


# Final stage
FROM node:22
COPY --from=frontend-builder /frontend/dist/ /app/frontend/dist
COPY --from=backend-builder /app/dist /app/dist
COPY package.json .

ENV PORT=80
ENV MONGODB_URI=mongodb://db:27017/friendship-network
ENV JWT_SECRET=7hPqh6pS91WCQY
ENV APP_URL=http://localhost:80
ENV ENABLE_REGISTRATION=true

CMD ["yarn", "run", "start"]
