# Eco-Nexus IoT & SmartHome API
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app app
COPY backend/run.py run.py

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

CMD ["python", "run.py"]
