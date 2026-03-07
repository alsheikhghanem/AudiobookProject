import subprocess
import sys
import time
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format="[%(asctime)s] [%(levelname)s] RUNNER - %(message)s",
    handlers=[
        logging.FileHandler("backend/report.txt", mode="a", encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)


def main():
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
        cwd="backend"
    )

    frontend_process = subprocess.Popen(
        [sys.executable, "-m", "http.server", "8080", "--directory", "frontend"]
    )

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        backend_process.terminate()
        frontend_process.terminate()


if __name__ == "__main__":
    main()