FROM python:3.11-slim as requirements-stage

WORKDIR /tmp
RUN pip install poetry
# Since we didn't use poetry, we use pip directly
COPY ./requirements.txt /tmp/requirements.txt
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /tmp/wheels -r requirements.txt

FROM python:3.11-slim

WORKDIR /app

# Install native dependencies for opencv/deepface if needed
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=requirements-stage /tmp/wheels /wheels
COPY --from=requirements-stage /tmp/requirements.txt .

RUN pip install --no-cache /wheels/*

COPY ./app /app/app

# Expose port
EXPOSE 8000

# Run uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
