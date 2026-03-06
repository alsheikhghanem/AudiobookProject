import asyncio
import edge_tts

TEXT_FILE = "book.txt"
OUTPUT_FILE = "audiobook.mp3"
VOICE = "ar-SA-HamedNeural"

# Playback speed percentage (e.g., "+0%" for 1.0x, "+25%" for 1.25x, "+50%" for 1.5x)
RATE = "+50%"

async def main():
    print(f"Reading text from: {TEXT_FILE}")

    with open(TEXT_FILE, "r", encoding="utf-8") as file:
        text = file.read()

    print("Connecting to Microsoft servers and starting conversion...")
    print(f"Using Voice: {VOICE} | Speed Rate: {RATE}")

    # The rate parameter is added here
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
    await communicate.save(OUTPUT_FILE)

    print(f"Conversion successful! Saved as: {OUTPUT_FILE}")

if __name__ == "__main__":
    asyncio.run(main())