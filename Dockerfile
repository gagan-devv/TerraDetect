# Build stage
FROM golang:1.26-bookworm AS builder

ARG ORT_VERSION=1.24.1   # ← single source of truth

RUN apt-get update && apt-get install -y git gcc g++ curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /tmp
RUN curl -L -o onnxruntime.tgz \
    https://github.com/microsoft/onnxruntime/releases/download/v${ORT_VERSION}/onnxruntime-linux-x64-${ORT_VERSION}.tgz && \
    tar -xzf onnxruntime.tgz && \
    mkdir -p /usr/local/include /usr/local/lib && \
    cp -r onnxruntime-linux-x64-${ORT_VERSION}/include/* /usr/local/include/ && \
    cp onnxruntime-linux-x64-${ORT_VERSION}/lib/*.so* /usr/local/lib/ && \
    rm -rf onnxruntime.tgz onnxruntime-linux-x64-${ORT_VERSION}

ENV LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=1 GOOS=linux CGO_LDFLAGS="-L/usr/local/lib" CGO_CFLAGS="-I/usr/local/include" go build -o app .

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates libgomp1 libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/lib/libonnxruntime.so* /usr/local/lib/
RUN ldconfig   # ← don't forget this

ENV LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
WORKDIR /backend
COPY --from=builder /app/app ./app
COPY ml/*.onnx ./ml/
EXPOSE 8080
CMD ["./app"]