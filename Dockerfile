
# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the backend requirements file into the container at /app
COPY backend/requirements.txt /app/requirements.txt

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY backend /app/backend

# Copy the frontend build artifacts
# We assume the frontend has been built locally and dist folder exists
# We will copy it to a folder that main.py expects (static_dist)
COPY frontend/dist /app/backend/static_dist

# Make port 7860 available to the world outside this container
EXPOSE 7860

# Define environment variable
ENV PYTHONPATH=/app/backend

# Run the start script
WORKDIR /app/backend
CMD ["bash", "start_modelscope.sh"]
