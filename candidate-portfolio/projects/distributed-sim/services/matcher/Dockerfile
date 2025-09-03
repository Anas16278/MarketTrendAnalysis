FROM python:3.11-slim
WORKDIR /app
RUN pip install redis==5.0.7
COPY matcher.py .
CMD ["python", "matcher.py"]

