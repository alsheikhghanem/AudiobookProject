# AI Text Studio 🎙️✨

A powerful, locally-hosted Text-to-Speech (TTS) web application that brings your text to life. Built with a robust **FastAPI** backend and a modern, cinematic Vanilla JS frontend, it features real-time synchronized word highlighting, audio visualization, and Markdown support.

## 🚀 Features

* **Advanced TTS Generation:** Powered by `edge-tts` for high-quality, natural-sounding voices (supports multiple languages including English and Arabic).
* **Real-time Word Synchronization:** Words glow and highlight exactly as they are spoken, utilizing precise word-boundary metadata.
* **Cinematic Focus Mode:** A distraction-free UI that dims the surroundings and emphasizes the active word for an immersive reading/listening experience.
* **Dual-Word Pronunciation Syntax:** Custom syntax `{{Visual::Phonetic}}` allows you to display one word while forcing the TTS engine to pronounce it differently.
* **Rich Text Parsing:** Full Markdown support for headings, bold text, lists, and inline code formatting.
* **Smart Caching System:** * Backend: MD5 hash-based disk caching for instantly loading previously generated audio.
  * Frontend: `IndexedDB` implementation to store audio blobs, preventing redundant network requests.
* **Audio Visualizer:** A dynamic, real-time audio visualizer built with the Web Audio API.

## 🏗️ Architecture

* **Backend:** Python, FastAPI, Uvicorn, Edge-TTS.
* **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript, Marked.js, Lucide Icons.
* **Database/Cache:** Local File System (Backend) & IndexedDB (Frontend).

## ⚙️ Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/alsheikhghanem/AudiobookProject.git](https://github.com/alsheikhghanem/AudiobookProject.git)
   cd AudiobookProject

2. **Create a virtual environment:**
```bash
python -m venv .venv

```


3. **Activate the virtual environment:**
* **Windows:** `.venv\Scripts\activate`
* **Mac/Linux:** `source .venv/bin/activate`


4. **Install the dependencies:**
```bash
pip install -r requirements.txt

```


*Dependencies include: `fastapi`, `pydantic`, `edge-tts`, `uvicorn*`.

## 🏃‍♂️ Running the Project

You can run both the backend server and the frontend client simultaneously using the provided batch script or Python runner:

**Option 1 (Windows Batch Script):**
Simply double-click `start_project.bat` or run it in the terminal:

```bash
start_project.bat

```

**Option 2 (Python Runner):**

```bash
python run_project.py

```

* The API will run on `http://127.0.0.1:8000`
* The Client interface will run on `http://localhost:8080`

## 🧹 Maintenance

To clean the generated audio files and Python cache (`__pycache__`), run:

```bash
clean_cache.bat

```

## 💡 Custom Syntax Guide (Dual-Word)

If you want the UI to display a specific word, but the AI to read it with specific phonetics or rules (very useful for correct Arabic pronunciation or acronyms), use this syntax:

```text
{{VisualText::PhoneticText}}

```

**Example:**
`Welcome to the {{AI::A.I.}} Text {{Studio::Stoodio}}.`

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
