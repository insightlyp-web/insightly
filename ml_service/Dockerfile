# Use Python 3.11 (Compatible with SpaCy, Sklearn, Pandas)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for pdfplumber + spaCy
RUN apt-get update && apt-get install -y \
    build-essential \
    poppler-utils \
    libpoppler-cpp-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirement file
COPY requirements.txt .

# Upgrade pip
RUN pip install --upgrade pip

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model (if needed)
RUN python -m spacy download en_core_web_sm || true

# Copy application code
COPY . .

# Expose port (Railway will override with $PORT)
EXPOSE 8000

# Run the FastAPI app (use PORT env variable)
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}

