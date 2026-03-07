export class AudioEngine {
    constructor(audioPlayerElement, apiService) {
        this.player = audioPlayerElement;
        this.api = apiService;
        this.queue = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.currentBoundaries = [];
        this.animationFrameId = null;
        this.currentActiveSpanId = null;
        this.voice = "";
        this.rate = "";
        this.targetSpanToSeek = null;
        this.onPlaybackStart = null;
        this.onPlaybackEnd = null;

        this.isUserScrolling = false;
        this.scrollTimeout = null;

        const handleUserScroll = () => {
            this.isUserScrolling = true;
            if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
            this.scrollTimeout = setTimeout(() => { this.isUserScrolling = false; }, 3000);
        };

        window.addEventListener('wheel', handleUserScroll, { passive: true });
        window.addEventListener('touchmove', handleUserScroll, { passive: true });

        this.player.addEventListener('play', () => this.startHighlightEngine());
        this.player.addEventListener('pause', () => this.stopHighlightEngine());
        this.player.addEventListener('ended', async () => { await this.playNextChunk(); });
    }

    async startQueue(chunks, voice, rate, startSpanId = null) {
        this.hardReset();
        this.queue = JSON.parse(JSON.stringify(chunks)).map(c => ({
            ...c, audioBase64: null, apiBoundaries: null, isFetching: false
        }));

        this.voice = voice;
        this.rate = rate;
        this.isPlaying = true;

        let startChunkIndex = 0;
        if (startSpanId) {
            for (let i = 0; i < this.queue.length; i++) {
                if (this.queue[i].spanIds.includes(startSpanId)) {
                    startChunkIndex = i;
                    this.targetSpanToSeek = startSpanId;
                    break;
                }
            }
        }

        this.currentIndex = startChunkIndex;
        if (this.onPlaybackStart) this.onPlaybackStart();

        await this.fetchChunk(startChunkIndex);
        await this.playNextChunk();
        this.preloadBuffer().catch(() => {});
    }

    async jumpToSpan(spanId) {
        if (this.queue.length === 0) return;
        let targetIdx = this.queue.findIndex(q => q.spanIds.includes(spanId));
        if (targetIdx === -1) return;

        this.player.pause();
        this.resetHighlighting();

        this.currentIndex = targetIdx;
        this.targetSpanToSeek = spanId;
        this.isPlaying = true;

        if (this.onPlaybackStart) this.onPlaybackStart();
        await this.playNextChunk();
    }

    async fetchChunk(index, retries = 3) {
        if (index >= this.queue.length) return;
        const chunk = this.queue[index];
        if (chunk.audioBase64 || chunk.isFetching) return;
        chunk.isFetching = true;
        for (let i = 1; i <= retries; i++) {
            try {
                const data = await this.api.generateTTS({ text: chunk.text, voice: this.voice, rate: this.rate });
                chunk.audioBase64 = data['audio'];
                chunk.apiBoundaries = data['boundaries'];
                chunk.isFetching = false;
                return;
            } catch (e) {
                if (i === retries) { chunk.audioBase64 = "ERROR"; chunk.isFetching = false; }
                await new Promise(r => setTimeout(r, 1000 * i));
            }
        }
    }

    async playNextChunk() {
        if (this.currentIndex >= this.queue.length || !this.isPlaying) {
            const hasFinished = this.currentIndex >= this.queue.length;

            this.isPlaying = false;
            this.player.pause();
            this.resetHighlighting();
            if (this.onPlaybackEnd) this.onPlaybackEnd();

            if (hasFinished) {
                this.currentIndex = 0;
                this.player.removeAttribute('src');
            }
            return;
        }

        const chunk = this.queue[this.currentIndex];
        if (!chunk.audioBase64) {
            await this.fetchChunk(this.currentIndex);
        }
        if (chunk.audioBase64 === "ERROR") {
            this.currentIndex++;
            return this.playNextChunk();
        }

        this.player.src = "data:audio/mp3;base64," + chunk.audioBase64;
        this.player.onloadedmetadata = () => {
            const duration = this.player.duration * 1000;
            this.currentBoundaries = (chunk.apiBoundaries && chunk.apiBoundaries.length > 0)
                ? this.alignBoundariesToMemoryMap(chunk.apiBoundaries, chunk.words, chunk.spanIds)
                : this.generateAutomatedWeightedBoundaries(duration, chunk.words, chunk.spanIds);

            if (this.targetSpanToSeek) {
                const b = this.currentBoundaries.find(x => x.spanId === this.targetSpanToSeek);
                this.player.currentTime = b ? b.startMs / 1000 : 0;
                this.targetSpanToSeek = null;
            } else { this.player.currentTime = 0; }
            this.player.play();
            this.currentIndex++;
            this.preloadBuffer().catch(() => {});
        };
    }

    async preloadBuffer() {
        for (let i = this.currentIndex; i < Math.min(this.currentIndex + 3, this.queue.length); i++) {
            await this.fetchChunk(i);
        }
    }

    stop() {
        this.isPlaying = false;
        this.player.pause();
        this.resetHighlighting();
        if (this.onPlaybackEnd) this.onPlaybackEnd();
    }

    hardReset() {
        this.stop();
        this.player.removeAttribute('src');
        this.queue = [];
        this.currentIndex = 0;
    }

    alignBoundariesToMemoryMap(apiB, words, spanIds) {
        const res = [];
        let sIdx = 0;
        const clean = (t) => t.replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, '').toLowerCase();
        for (let b of apiB) {
            const apiT = clean(b['text'] || "");
            if (!apiT) continue;
            for (let i = sIdx; i < Math.min(sIdx + 15, words.length); i++) {
                if (clean(words[i]).includes(apiT) || apiT.includes(clean(words[i]))) {
                    res.push({ startMs: b['offset']/10000, endMs: (b['offset']+b['duration'])/10000, spanId: spanIds[i] });
                    sIdx = i + 1;
                    break;
                }
            }
        }
        return res;
    }

    generateAutomatedWeightedBoundaries(dur, words, spanIds) {
        let tw = 0;
        const ws = words.map(w => { let x = w.length*10; if(/[.,!?؛،:]/.test(w)) x+=50; tw+=x; return x; });
        let cur = 0;
        return ws.map((w, i) => { const d = (w/tw)*dur; const b = {startMs:cur, endMs:cur+d, spanId:spanIds[i]}; cur+=d; return b; });
    }

    startHighlightEngine() {
        const sync = () => {
            if (this.player.paused || this.player.ended) return;
            const time = this.player.currentTime * 1000;
            const active = this.currentBoundaries.find(b => time >= b.startMs && time <= b.endMs);
            if (active && active.spanId !== this.currentActiveSpanId) {
                if (this.currentActiveSpanId) {
                    const old = document.getElementById(this.currentActiveSpanId);
                    if (old) old.className = old.getAttribute('data-original-class');
                }
                const el = document.getElementById(active.spanId);
                if (el) {
                    el.className = "word-glow transition-all duration-200 ease-out inline-block";
                    if (!this.isUserScrolling) {
                        const r = el.getBoundingClientRect();
                        if (r.top > window.innerHeight * 0.7 || r.bottom < window.innerHeight * 0.2) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                }
                this.currentActiveSpanId = active.spanId;
            }
            this.animationFrameId = requestAnimationFrame(sync);
        };
        this.animationFrameId = requestAnimationFrame(sync);
    }

    stopHighlightEngine() { if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId); }

    resetHighlighting() {
        this.stopHighlightEngine();
        if (this.currentActiveSpanId) {
            const el = document.getElementById(this.currentActiveSpanId);
            if (el) el.className = el.getAttribute('data-original-class');
        }
        this.currentActiveSpanId = null;
    }
}