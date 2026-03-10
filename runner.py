import subprocess
import sys
import time
import logging
import webbrowser

logging.basicConfig(
    level=logging.DEBUG,
    format="[%(asctime)s] [%(levelname)s] RUNNER - %(message)s",
    handlers=[
        logging.FileHandler("backend/report.txt", mode="a", encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)


def main():
    logging.info("Starting Backend Server (FastAPI)...")
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
        cwd="backend"
    )

    logging.info("Starting Frontend Server...")
    frontend_process = subprocess.Popen(
        [sys.executable, "-m", "http.server", "8080", "--directory", "frontend"]
    )
    
    time.sleep(1.5)
    logging.info("Opening LexiCast in the default web browser...")
    webbrowser.open("http://localhost:8080")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logging.info("Shutting down servers safely...")
        backend_process.terminate()
        frontend_process.terminate()


if __name__ == "__main__":
    main()