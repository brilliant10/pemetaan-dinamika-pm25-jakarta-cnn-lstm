# Multi-stage production Dockerfile for PM2.5 Prediction API
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TF_ENABLE_ONEDNN_OPTS=0 \
    PORT=8000

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run training on container build if models do not already exist, or ensure data is ready
EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.api.main:app --host 0.0.0.0 --port ${PORT}"]
