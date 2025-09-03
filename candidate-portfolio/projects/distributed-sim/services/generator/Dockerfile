FROM python:3.11-slim
WORKDIR /app
RUN pip install redis==5.0.7 numpy==1.26.4
COPY generator.py .
CMD ["python", "generator.py"]

