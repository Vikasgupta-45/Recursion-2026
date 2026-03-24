/* ═══════════════════════════════════════════════════════════════════
   Viking Clip Generator - Frontend Application Logic
   ═══════════════════════════════════════════════════════════════════ */

(() => {
    'use strict';

    // ── DOM References ──────────────────────────────────────────────
    const form = document.getElementById('generate-form');
    const urlInput = document.getElementById('url-input');
    const generateBtn = document.getElementById('generate-btn');
    const inputSection = document.getElementById('input-section');
    const pipelineSection = document.getElementById('pipeline-section');
    const pipelineMessage = document.getElementById('pipeline-message');
    const errorSection = document.getElementById('error-section');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const resultsSection = document.getElementById('results-section');
    const resultsTitle = document.getElementById('results-title');
    const resultsSubtitle = document.getElementById('results-subtitle');
    const clipsGrid = document.getElementById('clips-grid');

    // Pipeline stages in order
    const STAGES = ['downloading', 'extracting', 'transcribing', 'scoring', 'clipping'];

    let currentJobId = null;
    let pollInterval = null;

    // ── Form Submission ─────────────────────────────────────────────
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const url = urlInput.value.trim();
        if (!url) return;

        // Reset UI
        resetUI();
        showPipeline();
        generateBtn.disabled = true;
        generateBtn.classList.add('loading');

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to start generation');
            }

            const data = await response.json();
            currentJobId = data.job_id;

            // Start polling for status
            startPolling();

        } catch (err) {
            showError(err.message);
        }
    });

    // ── Retry Button ────────────────────────────────────────────────
    retryBtn.addEventListener('click', () => {
        resetUI();
        generateBtn.disabled = false;
        generateBtn.classList.remove('loading');
        urlInput.focus();
    });

    // ── Status Polling ──────────────────────────────────────────────
    function startPolling() {
        pollInterval = setInterval(async () => {
            if (!currentJobId) return;

            try {
                const response = await fetch(`/api/status/${currentJobId}`);
                if (!response.ok) throw new Error('Failed to get status');

                const data = await response.json();
                updatePipeline(data.stage, data.message);

                if (data.stage === 'done' && data.result) {
                    stopPolling();
                    showResults(data.result);
                } else if (data.stage === 'error') {
                    stopPolling();
                    showError(data.message);
                }

            } catch (err) {
                // Retry silently on network errors
                console.warn('Polling error:', err);
            }
        }, 1500);
    }

    function stopPolling() {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    }

    // ── Pipeline UI Updates ─────────────────────────────────────────
    function updatePipeline(stage, message) {
        const stageIndex = STAGES.indexOf(stage);

        STAGES.forEach((s, i) => {
            const stepEl = document.getElementById(`step-${s}`);
            if (!stepEl) return;

            stepEl.classList.remove('active', 'completed');

            if (i < stageIndex) {
                stepEl.classList.add('completed');
            } else if (i === stageIndex) {
                stepEl.classList.add('active');
            }
        });

        // For 'done' stage, mark all as completed
        if (stage === 'done') {
            STAGES.forEach(s => {
                const stepEl = document.getElementById(`step-${s}`);
                if (stepEl) {
                    stepEl.classList.remove('active');
                    stepEl.classList.add('completed');
                }
            });
        }

        pipelineMessage.textContent = message || 'Processing...';
    }

    // ── Show/Hide Sections ──────────────────────────────────────────
    function showPipeline() {
        pipelineSection.classList.remove('hidden');
        errorSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
    }

    function showError(msg) {
        stopPolling();
        pipelineSection.classList.add('hidden');
        errorSection.classList.remove('hidden');
        errorMessage.textContent = msg;
        generateBtn.disabled = false;
        generateBtn.classList.remove('loading');
    }

    function showResults(result) {
        pipelineSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        generateBtn.disabled = false;
        generateBtn.classList.remove('loading');

        resultsTitle.textContent = `Viral Clips — ${result.title || 'Your Video'}`;
        resultsSubtitle.textContent = `${result.clips.length} viral moment${result.clips.length !== 1 ? 's' : ''} found`;

        clipsGrid.innerHTML = '';

        result.clips.forEach((clip) => {
            const card = createClipCard(clip);
            clipsGrid.appendChild(card);
        });
    }

    function resetUI() {
        stopPolling();
        currentJobId = null;

        // Reset pipeline steps
        STAGES.forEach(s => {
            const stepEl = document.getElementById(`step-${s}`);
            if (stepEl) stepEl.classList.remove('active', 'completed');
        });

        pipelineMessage.textContent = 'Initializing...';
        pipelineSection.classList.add('hidden');
        errorSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        clipsGrid.innerHTML = '';
    }

    // ── Create Clip Card ────────────────────────────────────────────
    function createClipCard(clip) {
        const card = document.createElement('div');
        card.className = 'clip-card';

        const startTime = formatTime(clip.start);
        const endTime = formatTime(clip.end);

        card.innerHTML = `
            <div class="clip-video-wrapper">
                <video controls preload="metadata">
                    <source src="${clip.url}" type="video/mp4">
                    Your browser does not support video playback.
                </video>
                <div class="clip-score-badge">
                    🔥 ${clip.score}/10
                </div>
            </div>
            <div class="clip-body">
                <div class="clip-number">${clip.index}</div>
                <h3 class="clip-title">${escapeHtml(clip.title)}</h3>
                <p class="clip-hook">${escapeHtml(clip.hook)}</p>
                <div class="clip-meta">
                    <span class="clip-time">${startTime} — ${endTime}</span>
                    <a href="${clip.url}" download class="btn-download">
                        ⬇ Download
                    </a>
                </div>
            </div>
        `;

        return card;
    }

    // ── Helpers ──────────────────────────────────────────────────────
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

})();
