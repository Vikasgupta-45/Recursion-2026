document.addEventListener('DOMContentLoaded', () => {
    const urlForm = document.getElementById('url-form');
    const youtubeInput = document.getElementById('youtube-url');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const processingSec = document.getElementById('processing');
    const resultsSec = document.getElementById('results');
    const clipsGrid = document.getElementById('clips-grid');
    const errorMessage = document.getElementById('error-message');
    const clipCountEl = document.getElementById('clip-count');

    let currentJobId = null;
    let pollInterval = null;

    // Handle URL submission
    urlForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = youtubeInput.value.trim();
        if (!url) return;

        startProcessing();
        try {
            const response = await fetch('/api/process/youtube', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ youtube_url: url })
            });
            const data = await response.json();
            currentJobId = data.job_id;
            startPolling();
        } catch (err) {
            showError("Failed to start processing: " + err.message);
        }
    });

    // Handle File Selection
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    // Drag and Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary)';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#494454';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#494454';
        handleFile(e.dataTransfer.files[0]);
    });

    async function handleFile(file) {
        if (!file) return;
        if (file.size > 100 * 1024 * 1024) {
            showError("File too large (Max 100MB)");
            return;
        }

        startProcessing();
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/process/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            currentJobId = data.job_id;
            startPolling();
        } catch (err) {
            showError("Upload failed: " + err.message);
        }
    }

    function startProcessing() {
        errorMessage.classList.add('hidden');
        processingSec.style.display = 'flex';
        resultsSec.classList.add('hidden');
        clipsGrid.innerHTML = '';
        updateStages('download');
    }

    function updateStages(status) {
        const stages = ['download', 'transcribe', 'score', 'clip'];
        const statusMap = {
            'downloading': 'download',
            'transcribing': 'transcribe',
            'scoring': 'score',
            'clipping': 'clip',
            'completed': 'done'
        };

        const currentStage = statusMap[status] || 'download';
        let foundCurrent = false;

        stages.forEach(s => {
            const el = document.getElementById(`stage-${s}`);
            el.classList.remove('active', 'complete');
            if (s === currentStage) {
                el.classList.add('active');
                foundCurrent = true;
            } else if (!foundCurrent || currentStage === 'done') {
                el.classList.add('complete');
            }
        });
    }

    function startPolling() {
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(checkStatus, 2000);
    }

    async function checkStatus() {
        if (!currentJobId) return;

        try {
            const response = await fetch(`/api/status/${currentJobId}`);
            const data = await response.json();

            updateStages(data.status);

            if (data.status === 'completed') {
                clearInterval(pollInterval);
                renderResults(data.clips);
            } else if (data.status === 'failed') {
                clearInterval(pollInterval);
                showError("Processing failed: " + data.error);
            }
        } catch (err) {
            console.error("Status check failed", err);
        }
    }

    function renderResults(clips) {
        processingSec.style.display = 'none';
        resultsSec.classList.remove('hidden');
        clipCountEl.textContent = `${clips.length} Clips Found`;

        const template = document.getElementById('clip-template');

        clips.sort((a, b) => b.total_score - a.total_score).forEach(clip => {
            const clone = template.content.cloneNode(true);

            const video = clone.querySelector('video');
            video.src = clip.video_url;
            video.poster = clip.thumbnail_url;

            clone.querySelector('.clip-title').textContent = clip.title;
            clone.querySelector('.clip-reasoning').textContent = clip.reasoning;

            // Set scores
            setScore(clone, 'virality', clip.scores.virality_score);
            setScore(clone, 'hook', clip.scores.hook_score);
            setScore(clone, 'engagement', clip.scores.engagement_score);

            const downloadBtn = clone.querySelector('.btn-download');
            downloadBtn.href = clip.video_url;
            downloadBtn.setAttribute('download', `${clip.title.replace(/\s+/g, '_')}.mp4`);

            clipsGrid.appendChild(clone);
        });
    }

    function setScore(el, type, value) {
        const scoreItem = el.querySelector(`.score-item[data-type="${type}"]`);
        if (scoreItem) {
            scoreItem.querySelector('.score-value').textContent = value;
            const fill = scoreItem.querySelector('.progress-fill');
            fill.style.width = (value * 10) + '%';
        }
    }

    function showError(msg) {
        processingSec.style.display = 'none';
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    }
});
