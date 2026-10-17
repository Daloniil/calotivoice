# syntax=docker/dockerfile:1

FROM python:3.12-slim-bookworm

WORKDIR /app

COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

COPY server.py .

ENV LAYA_HOST=0.0.0.0
ENV LAYA_PORT=8092
ENV LAYA_SUBFOLDER=multilingual

EXPOSE 8092

HEALTHCHECK --interval=15s --timeout=5s --start-period=600s --retries=3 \
  CMD python -c "import urllib.request; r=urllib.request.urlopen('http://127.0.0.1:8092/health'); exit(0 if b'ok' in r.read() else 1)"

CMD ["python", "server.py"]
