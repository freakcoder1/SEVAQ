# Multi-stage build for Flutter Web
FROM google/dart:3.0 AS builder

# Install Flutter
RUN git clone https://github.com/flutter/flutter.git /opt/flutter
ENV PATH="/opt/flutter/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy pubspec files
COPY pubspec.yaml pubspec.lock ./

# Get dependencies
RUN flutter pub get

# Copy source code
COPY . .

# Build Flutter Web
RUN flutter config --enable-web
RUN flutter build web --release --dart-define=FLUTTER_WEB_CANVASKIT_URL=/flutter/canvaskit/

# Production stage
FROM nginx:alpine

# Copy built Flutter app
COPY --from=builder /app/build/web /usr/share/nginx/html

# Copy nginx configuration
COPY deployment/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]