# Use an official Python runtime (3.11-slim) that meets our dependency constraints.
FROM python:3.11-slim

# Install system dependencies required for libGL.
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory.
WORKDIR /app

# Copy the requirements file and install dependencies.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code.
COPY . .

# Expose the port uvicorn will run on.
EXPOSE 8000

# Run the application using uvicorn.
CMD ["uvicorn", "marker_api.api_server:app", "--host", "0.0.0.0", "--port", "8000"] 