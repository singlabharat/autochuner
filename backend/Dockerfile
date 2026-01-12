# Use lightweight Python image
FROM python:3.10-slim

# Set working directory inside container
WORKDIR /app

# Copy only the backend folder to keep container small
COPY backend/ /app/backend/

# Install backend dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Expose the port Hugging Face Spaces expects
EXPOSE 7860

# Command to run FastAPI via Uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
