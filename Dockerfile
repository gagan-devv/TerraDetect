# Build stage
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    git \
    gcc \
    g++ \
    musl-dev \
    curl \
    tar

# Download and install ONNX Runtime
WORKDIR /tmp
RUN curl -L -o onnxruntime.tgz https://github.com/microsoft/onnxruntime/releases/download/v1.17.0/onnxruntime-linux-x64-1.17.0.tgz && \
    tar -xzf onnxruntime.tgz && \
    mkdir -p /usr/local/include /usr/local/lib && \
    cp -r onnxruntime-linux-x64-1.17.0/include/* /usr/local/include/ && \
    cp onnxruntime-linux-x64-1.17.0/lib/*.so* /usr/local/lib/ && \
    rm -rf onnxruntime.tgz onnxruntime-linux-x64-1.17.0

# Set library path
ENV LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH

# Set working directory
WORKDIR /app

# Copy go mod files
COPY backend/go.mod backend/go.sum ./

# Download dependencies
RUN go mod download

# Copy backend source code
COPY backend/ ./

# Build the application with CGO enabled
RUN CGO_ENABLED=1 GOOS=linux CGO_LDFLAGS="-L/usr/local/lib" CGO_CFLAGS="-I/usr/local/include" go build -o app .

# Runtime stage
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    libstdc++ \
    libgomp

# Copy ONNX Runtime libraries from builder
COPY --from=builder /usr/local/lib/libonnxruntime.so* /usr/local/lib/

# Set library path
ENV LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/app ./app

# Copy ML models from project root
COPY ml/*.onnx ./ml/

# Expose port
EXPOSE 8080

# Run the application
CMD ["./app"]
