# Build stage
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    git \
    gcc \
    g++ \
    musl-dev \
    wget \
    tar

# Download and install ONNX Runtime
WORKDIR /tmp
RUN wget https://github.com/microsoft/onnxruntime/releases/download/v1.17.0/onnxruntime-linux-x64-1.17.0.tgz && \
    tar -xzf onnxruntime-linux-x64-1.17.0.tgz && \
    cp -r onnxruntime-linux-x64-1.17.0/include/* /usr/local/include/ && \
    cp -r onnxruntime-linux-x64-1.17.0/lib/* /usr/local/lib/ && \
    ldconfig /usr/local/lib

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -o app .

# Runtime stage
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    libstdc++ \
    libgomp

# Copy ONNX Runtime libraries from builder
COPY --from=builder /usr/local/lib/libonnxruntime.so* /usr/local/lib/
RUN ldconfig /usr/local/lib

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/app ./app

# Copy ML models from project root
COPY ../ml/*.onnx ./ml/

# Expose port
EXPOSE 8080

# Run the application
CMD ["./app"]
