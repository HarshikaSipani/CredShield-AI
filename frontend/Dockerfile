# Stage 1: Build the React Application
FROM node:20-alpine AS build

WORKDIR /frontend

# Copy dependencies manifest
COPY package*.json /frontend/
RUN npm install

# Copy frontend source files
COPY . /frontend/

# Compile production build assets
RUN npm run build

# Stage 2: Serve static files via Nginx
FROM nginx:stable-alpine

# Copy built assets from Stage 1
COPY --from=build /frontend/dist /usr/share/nginx/html

# Copy custom Nginx configuration to support SPA React Router redirects
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
