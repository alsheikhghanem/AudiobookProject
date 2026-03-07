export class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        console.log(`[TRACE] ApiService initialized with baseUrl: ${baseUrl}`);
    }

    async getVoices() {
        console.log(`[TRACE] ApiService.getVoices() called`);
        try {
            const response = await fetch(`${this.baseUrl}/voices`);
            console.log(`[TRACE] ApiService.getVoices() response status: ${response.status}`);
            if (!response.ok) throw new Error(`Network error: ${response.status}`);
            const data = await response.json();
            console.log(`[TRACE] ApiService.getVoices() successfully parsed ${data.voices ? data.voices.length : 0} voices`);
            return data;
        } catch (error) {
            console.error(`[ERROR] ApiService.getVoices() failed`, error);
            throw error;
        }
    }

    async generateTTS(payload) {
        console.log(`[TRACE] ApiService.generateTTS() called. Text length: ${payload.text.length}`);
        const startTime = performance.now();
        try {
            const response = await fetch(`${this.baseUrl}/tts`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            console.log(`[TRACE] ApiService.generateTTS() response status: ${response.status}`);
            if (!response.ok) throw new Error(`Network error: ${response.status}`);
            const data = await response.json();
            const timeTaken = (performance.now() - startTime).toFixed(2);
            console.log(`[TRACE] ApiService.generateTTS() completed in ${timeTaken}ms. Audio Base64 length: ${data.audio ? data.audio.length : 0}, Boundaries count: ${data.boundaries ? data.boundaries.length : 0}`);
            return data;
        } catch (error) {
            console.error(`[ERROR] ApiService.generateTTS() failed`, error);
            throw error;
        }
    }
}