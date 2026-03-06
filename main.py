import asyncio
import edge_tts

TEXT_FILE = "book.txt"
OUTPUT_FILE = "audiobook.mp3"
VOICE = "ar-SA-HamedNeural"


async def main():
    print(f"Reading text from: {TEXT_FILE}")

    with open(TEXT_FILE, "r", encoding="utf-8") as file:
        text = file.read()

    print("Connecting to Microsoft servers and starting conversion...")

    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save(OUTPUT_FILE)

    print(f"Conversion successful! Saved as: {OUTPUT_FILE}")


if __name__ == "__main__":
    asyncio.run(main())
