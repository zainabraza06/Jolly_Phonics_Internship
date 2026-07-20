# Use Python 3.10 slim (Render requires <3.11 and torch works fine on 3.10)
FROM python:3.10-slim

# Prevent Python from writing pyc files and buffer logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies required by some packages (ffmpeg, opencv, etc.)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy project files
COPY . .

# Expose port (Render uses 10000 by default)
EXPOSE 10000

# Command to run app with Uvicorn
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"
