import { ApiService } from './api.js';
import { TextProcessor } from './textProcessor.js';
import { AudioEngine } from './audioEngine.js';

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const elements = {
    textInput: document.getElementById('text-input'),
    markdownDisplay: document.getElementById('markdown-display'),
    voiceSelect: document.getElementById('voice-select'),
    rateSelect: document.getElementById('rate-select'),
    audioPlayer: document.getElementById('audio-player'),
    btnToggleInput: document.getElementById('btn-toggle-input'),
    btnCloseInput: document.getElementById('btn-close-input'),
    panelInput: document.getElementById('panel-input'),
    btnToggleVoice: document.getElementById('btn-toggle-voice'),
    panelVoice: document.getElementById('panel-voice'),
    btnToggleSpeed: document.getElementById('btn-toggle-speed'),
    panelSpeed: document.getElementById('panel-speed'),
    speedLabel: document.getElementById('speed-label'),
    previewBtn: document.getElementById('preview-btn'),
    bottomPlayer: document.getElementById('bottom-player'),
    btnMainPlay: document.getElementById('btn-main-play'),

    wrapperPlay: document.getElementById('wrapper-play'),
    wrapperPause: document.getElementById('wrapper-pause'),
    wrapperLoading: document.getElementById('wrapper-loading')
};

const api = new ApiService(API_BASE_URL);
const textProcessor = new TextProcessor();
const audioEngine = new AudioEngine(elements.audioPlayer, api);
let currentChunks = [];

const cursorDot = document.createElement('div');
const cursorTrail = document.createElement('div');
cursorDot.className = 'cursor-dot'; cursorTrail.className = 'cursor-trail';
document.body.append(cursorDot, cursorTrail);
let mX = 0, mY = 0, tX = 0, tY = 0;
document.addEventListener('mousemove', e => { mX = e.clientX; mY = e.clientY; cursorDot.style.left = `${mX}px`; cursorDot.style.top = `${mY}px`; });
(function anim() { tX += (mX - tX) * 0.15; tY += (mY - tY) * 0.15; cursorTrail.style.left = `${tX}px`; cursorTrail.style.top = `${tY}px`; requestAnimationFrame(anim); })();

function updateCursorInteractions() {
    document.querySelectorAll('button, select, span[id^="md-word-"], textarea').forEach(el => {
        el.onmouseenter = () => document.body.classList.add('hover-active');
        el.onmouseleave = () => document.body.classList.remove('hover-active');
    });
}

function togglePanel(panel) {
    const isHidden = panel.classList.contains('hidden-panel');
    document.querySelectorAll('.floating-panel, aside').forEach(p => { if (p !== panel) { p.classList.add('hidden-panel'); p.style.opacity = '0'; } });
    if (isHidden) { panel.classList.remove('hidden-panel'); setTimeout(() => { panel.style.opacity = '1'; panel.style.transform = 'scale(1) translateY(0)'; }, 10); }
    else { panel.style.opacity = '0'; panel.style.transform = 'scale(0.8) translateY(20px)'; setTimeout(() => panel.classList.add('hidden-panel'), 300); }
}

elements.btnToggleInput.onclick = () => togglePanel(elements.panelInput);
elements.btnCloseInput.onclick = () => togglePanel(elements.panelInput);
elements.btnToggleVoice.onclick = () => togglePanel(elements.panelVoice);
elements.btnToggleSpeed.onclick = () => togglePanel(elements.panelSpeed);

audioEngine.onPlaybackStart = () => {
    elements.wrapperPlay.classList.add('hidden');
    elements.wrapperPause.classList.add('hidden');
    elements.wrapperLoading.classList.remove('hidden');
    elements.bottomPlayer.classList.add('playing-pulse');
};

audioEngine.onPlaybackEnd = () => {
    elements.bottomPlayer.classList.remove('playing-pulse');
    elements.btnMainPlay.style.backgroundColor = '#c15f3c';
    elements.wrapperLoading.classList.add('hidden');
    elements.wrapperPause.classList.add('hidden');
    elements.wrapperPlay.classList.remove('hidden');
};

elements.audioPlayer.addEventListener('play', () => {
    elements.wrapperLoading.classList.add('hidden');
    elements.wrapperPlay.classList.add('hidden');
    elements.wrapperPause.classList.remove('hidden');
    elements.btnMainPlay.style.backgroundColor = '#ef4444';
});

elements.audioPlayer.addEventListener('pause', () => {
    elements.wrapperPause.classList.add('hidden');
    elements.wrapperLoading.classList.add('hidden');
    elements.wrapperPlay.classList.remove('hidden');
    elements.btnMainPlay.style.backgroundColor = '#c15f3c';
});

function checkInputState() {
    const ok = elements.textInput.value.trim().length > 0 && elements.voiceSelect.value;
    elements.btnMainPlay.disabled = !ok;
    elements.btnMainPlay.style.opacity = ok ? "1" : "0.4";
}

function updatePreviewAndChunks() {
    textProcessor.renderLivePreview(elements.textInput.value, elements.markdownDisplay);
    currentChunks = textProcessor.buildMemoryMapAndDOM(elements.markdownDisplay);
    updateCursorInteractions();
}

async function processAndPlay(spanId = null) {
    if (currentChunks.length === 0) return;
    elements.wrapperPlay.classList.add('hidden');
    elements.wrapperLoading.classList.remove('hidden');
    await audioEngine.startQueue(currentChunks, elements.voiceSelect.value, elements.rateSelect.value, spanId);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await api.getVoices();
        const voices = data['voices'] || [];
        elements.voiceSelect.innerHTML = voices.map(v => `<option value="${v['name']}">${v['name']} (${v['gender']})</option>`).join('');
        updatePreviewAndChunks(); checkInputState();
    } catch (e) {
        elements.voiceSelect.innerHTML = '<option>Error loading voices</option>';
    }
});

elements.textInput.oninput = () => {
    audioEngine.hardReset();
    updatePreviewAndChunks();
    checkInputState();
};

elements.voiceSelect.onchange = async () => {
    const sid = audioEngine.currentActiveSpanId;
    audioEngine.hardReset();
    if (sid) await processAndPlay(sid);
    setTimeout(() => togglePanel(elements.panelVoice), 300);
};

elements.rateSelect.onchange = async () => {
    audioEngine.rate = elements.rateSelect.value;
    elements.speedLabel.textContent = elements.rateSelect.options[elements.rateSelect.selectedIndex].text.split(' ')[0];
    const sid = audioEngine.currentActiveSpanId;
    audioEngine.hardReset();
    if (sid) await processAndPlay(sid);
    setTimeout(() => togglePanel(elements.panelSpeed), 300);
};

elements.btnMainPlay.onclick = async () => {
    if (!elements.wrapperLoading.classList.contains('hidden')) return;

    if (audioEngine.queue.length > 0) {
        if (audioEngine.isPlaying) {
            audioEngine.isPlaying = false;
            elements.audioPlayer.pause();
        } else {
            audioEngine.isPlaying = true;
            if (elements.audioPlayer.getAttribute('src')) {
                elements.audioPlayer.play();
            } else {
                if (audioEngine.onPlaybackStart) audioEngine.onPlaybackStart();
                audioEngine.playNextChunk();
            }
        }
        return;
    }
    await processAndPlay();
};

elements.markdownDisplay.onclick = async (e) => {
    const span = e.target.closest('span[id^="md-word-"]');
    if (!span) return;
    if (audioEngine.queue.length === 0) await processAndPlay(span.id);
    else await audioEngine.jumpToSpan(span.id);
};

elements.previewBtn.onclick = async () => {
    audioEngine.hardReset();
    elements.textInput.value = elements.voiceSelect.value.includes('ar-')
        ? "# تجربة حية\nمرحباً بك في {{Studio::سْتُودْيُو}} الذكاء الاصطناعي."
        : "# Live Preview\nWelcome to the AI {{Studio::Studio}}.";
    updatePreviewAndChunks(); checkInputState(); await processAndPlay();
};