/* ═══════════════════════════════════════════════════════════════════
   Poppy AI - Chatbot Builder Logic
   Drag-and-drop node canvas, connections, properties, preview
   ═══════════════════════════════════════════════════════════════════ */

(() => {
    'use strict';

    // ── DOM ──────────────────────────────────────────────────────────
    const canvas = document.getElementById('canvas');
    const canvasContainer = document.getElementById('canvas-container');
    const canvasEmpty = document.getElementById('canvas-empty');
    const connectionsSvg = document.getElementById('connections-svg');
    const botNameInput = document.getElementById('bot-name-input');
    const botList = document.getElementById('bot-list');
    const propsPanel = document.getElementById('properties-panel');
    const propsTitle = document.getElementById('props-title');
    const propsBody = document.getElementById('props-body');
    const previewOverlay = document.getElementById('preview-overlay');
    const pwMessages = document.getElementById('pw-messages');
    const pwInput = document.getElementById('pw-input');
    const pwInputArea = document.getElementById('pw-input-area');

    // ── State ────────────────────────────────────────────────────────
    let currentBotId = null;
    let nodes = [];
    let edges = [];
    let selectedNodeId = null;
    let dragState = null; // { nodeId, offsetX, offsetY }
    let connectState = null; // { sourceId }
    let nodeIdCounter = 0;
    let previewSessionId = null;

    const NODE_META = {
        start:        { icon: '▶️',  label: 'Start',          color: '#48bb78' },
        message:      { icon: '💬',  label: 'Message',        color: '#63b3ed' },
        ai_response:  { icon: '🤖',  label: 'AI Response',   color: '#a882ff' },
        knowledge:    { icon: '📚',  label: 'Knowledge Base', color: '#ec994b' },
        user_input:   { icon: '⌨️',  label: 'User Input',    color: '#f6ad55' },
        condition:    { icon: '🔀',  label: 'Condition',      color: '#4fd1c5' },
        end:          { icon: '🏁',  label: 'End',            color: '#fc8181' },
    };

    // ── Init ─────────────────────────────────────────────────────────
    function init() {
        loadBots();
        bindPaletteEvents();
        bindCanvasEvents();
        bindTopbarEvents();
        bindPreviewEvents();
        bindPropsEvents();
    }

    // ═══════════════════════════════════════════════════════════════
    //  PALETTE DRAG & DROP
    // ═══════════════════════════════════════════════════════════════
    function bindPaletteEvents() {
        document.querySelectorAll('.palette-node').forEach(el => {
            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('nodeType', el.dataset.type);
                e.dataTransfer.effectAllowed = 'copy';
            });
        });

        canvasContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        canvasContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('nodeType');
            if (!type) return;

            const rect = canvasContainer.getBoundingClientRect();
            const x = e.clientX - rect.left + canvasContainer.scrollLeft;
            const y = e.clientY - rect.top + canvasContainer.scrollTop;

            addNode(type, x, y);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    //  NODE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════
    function addNode(type, x, y) {
        const id = 'node_' + (++nodeIdCounter);
        const data = getDefaultData(type);
        const node = { id, type, x, y, data };
        nodes.push(node);
        renderNode(node);
        updateEmptyState();
        selectNode(id);
    }

    function getDefaultData(type) {
        switch (type) {
            case 'start': return {};
            case 'message': return { text: 'Hello! How can I help you today?' };
            case 'ai_response': return { prompt: 'You are a helpful assistant for a creator growth platform. Be concise and actionable.' };
            case 'knowledge': return { source_type: 'text', content: '', youtube_url: '', website_url: '', label: 'My Knowledge' };
            case 'user_input': return { placeholder: 'Type your message...' };
            case 'condition': return { text: 'What would you like help with?', options: ['Content Strategy', 'Analytics', 'Scripting'] };
            case 'end': return { text: 'Thanks for chatting! 👋' };
            default: return {};
        }
    }

    function renderNode(node) {
        const meta = NODE_META[node.type];
        const div = document.createElement('div');
        div.className = 'flow-node';
        div.id = `fn-${node.id}`;
        div.dataset.type = node.type;
        div.style.left = node.x + 'px';
        div.style.top = node.y + 'px';

        let bodyText = '';
        if (node.type === 'message') bodyText = node.data.text || '';
        else if (node.type === 'ai_response') bodyText = '🤖 ' + (node.data.prompt || '').slice(0, 60) + '...';
        else if (node.type === 'knowledge') {
            const st = node.data.source_type || 'text';
            const icons = { text: '📝', youtube: '▶️', website: '🌐' };
            bodyText = (icons[st] || '📚') + ' ' + (node.data.label || st);
        }
        else if (node.type === 'user_input') bodyText = 'Waiting for: ' + (node.data.placeholder || '');
        else if (node.type === 'condition') bodyText = node.data.options?.join(' / ') || '';
        else if (node.type === 'end') bodyText = node.data.text || '';
        else if (node.type === 'start') bodyText = 'Flow begins here';

        div.innerHTML = `
            <div class="port port-in" data-node="${node.id}" data-port="in"></div>
            <div class="fn-header">
                <span class="fn-icon">${meta.icon}</span>
                <span class="fn-type">${meta.label}</span>
            </div>
            <div class="fn-body">
                <div class="fn-body-text">${escapeHtml(bodyText)}</div>
            </div>
            <div class="port port-out" data-node="${node.id}" data-port="out"></div>
        `;

        // Hide certain ports
        if (node.type === 'start') div.querySelector('.port-in').style.display = 'none';
        if (node.type === 'end') div.querySelector('.port-out').style.display = 'none';

        canvas.appendChild(div);
    }

    function deleteNode(nodeId) {
        nodes = nodes.filter(n => n.id !== nodeId);
        edges = edges.filter(e => e.source !== nodeId && e.target !== nodeId);
        const el = document.getElementById(`fn-${nodeId}`);
        if (el) el.remove();
        if (selectedNodeId === nodeId) {
            selectedNodeId = null;
            propsPanel.classList.add('hidden');
        }
        renderConnections();
        updateEmptyState();
    }

    function selectNode(nodeId) {
        document.querySelectorAll('.flow-node').forEach(n => n.classList.remove('selected'));
        selectedNodeId = nodeId;
        const el = document.getElementById(`fn-${nodeId}`);
        if (el) el.classList.add('selected');
        showProperties(nodeId);
    }

    function updateEmptyState() {
        canvasEmpty.classList.toggle('hidden', nodes.length > 0);
    }

    // ═══════════════════════════════════════════════════════════════
    //  CANVAS EVENTS (drag, connect, select)
    // ═══════════════════════════════════════════════════════════════
    function bindCanvasEvents() {
        canvas.addEventListener('mousedown', (e) => {
            const port = e.target.closest('.port');
            const node = e.target.closest('.flow-node');

            if (port && port.dataset.port === 'out') {
                // Start connection
                connectState = { sourceId: port.dataset.node };
                e.stopPropagation();
                return;
            }

            if (node) {
                const nodeId = node.id.replace('fn-', '');
                selectNode(nodeId);

                const rect = node.getBoundingClientRect();
                dragState = {
                    nodeId,
                    offsetX: e.clientX - rect.left,
                    offsetY: e.clientY - rect.top,
                };
                node.classList.add('dragging');
                e.preventDefault();
            } else {
                // Clicked empty canvas - deselect
                selectedNodeId = null;
                document.querySelectorAll('.flow-node').forEach(n => n.classList.remove('selected'));
                propsPanel.classList.add('hidden');
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (dragState) {
                const containerRect = canvasContainer.getBoundingClientRect();
                const x = e.clientX - containerRect.left + canvasContainer.scrollLeft - dragState.offsetX;
                const y = e.clientY - containerRect.top + canvasContainer.scrollTop - dragState.offsetY;

                const nodeObj = nodes.find(n => n.id === dragState.nodeId);
                if (nodeObj) {
                    nodeObj.x = Math.max(0, x);
                    nodeObj.y = Math.max(0, y);
                    const el = document.getElementById(`fn-${dragState.nodeId}`);
                    if (el) {
                        el.style.left = nodeObj.x + 'px';
                        el.style.top = nodeObj.y + 'px';
                    }
                    renderConnections();
                }
            }

            if (connectState) {
                renderTempConnection(e);
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (dragState) {
                const el = document.getElementById(`fn-${dragState.nodeId}`);
                if (el) el.classList.remove('dragging');
                dragState = null;
            }

            if (connectState) {
                const port = e.target.closest('.port');
                if (port && port.dataset.port === 'in') {
                    const targetId = port.dataset.node;
                    if (targetId !== connectState.sourceId) {
                        // Don't duplicate edges
                        const exists = edges.some(e => e.source === connectState.sourceId && e.target === targetId);
                        if (!exists) {
                            edges.push({
                                id: `edge_${connectState.sourceId}_${targetId}`,
                                source: connectState.sourceId,
                                target: targetId,
                                label: '',
                            });
                        }
                    }
                }
                connectState = null;
                removeTempConnection();
                renderConnections();
            }
        });

        // Double-click to delete edge
        connectionsSvg.addEventListener('dblclick', (e) => {
            if (e.target.classList.contains('connection-line')) {
                const edgeId = e.target.dataset.edgeId;
                edges = edges.filter(edge => edge.id !== edgeId);
                renderConnections();
            }
        });
        // Make edges clickable
        connectionsSvg.style.pointerEvents = 'none';
    }

    // ═══════════════════════════════════════════════════════════════
    //  CONNECTIONS RENDERING
    // ═══════════════════════════════════════════════════════════════
    function renderConnections() {
        // Clear existing
        connectionsSvg.innerHTML = '';
        connectionsSvg.style.pointerEvents = 'all';

        edges.forEach(edge => {
            const sourceEl = document.getElementById(`fn-${edge.source}`);
            const targetEl = document.getElementById(`fn-${edge.target}`);
            if (!sourceEl || !targetEl) return;

            const sourcePort = sourceEl.querySelector('.port-out');
            const targetPort = targetEl.querySelector('.port-in');
            if (!sourcePort || !targetPort) return;

            const p1 = getPortCenter(sourcePort);
            const p2 = getPortCenter(targetPort);

            const path = createCurvePath(p1, p2);
            path.classList.add('connection-line');
            path.dataset.edgeId = edge.id;
            connectionsSvg.appendChild(path);
        });
    }

    function renderTempConnection(e) {
        removeTempConnection();
        const sourceEl = document.getElementById(`fn-${connectState.sourceId}`);
        if (!sourceEl) return;

        const port = sourceEl.querySelector('.port-out');
        const p1 = getPortCenter(port);
        const containerRect = canvasContainer.getBoundingClientRect();
        const p2 = {
            x: e.clientX - containerRect.left + canvasContainer.scrollLeft,
            y: e.clientY - containerRect.top + canvasContainer.scrollTop,
        };

        const path = createCurvePath(p1, p2);
        path.classList.add('connection-line', 'connection-temp');
        path.id = 'temp-connection';
        connectionsSvg.appendChild(path);
    }

    function removeTempConnection() {
        const temp = document.getElementById('temp-connection');
        if (temp) temp.remove();
    }

    function getPortCenter(portEl) {
        const nodeEl = portEl.closest('.flow-node');
        const nodeRect = nodeEl.getBoundingClientRect();
        const portRect = portEl.getBoundingClientRect();
        const containerRect = canvasContainer.getBoundingClientRect();

        return {
            x: portRect.left + portRect.width / 2 - containerRect.left + canvasContainer.scrollLeft,
            y: portRect.top + portRect.height / 2 - containerRect.top + canvasContainer.scrollTop,
        };
    }

    function createCurvePath(p1, p2) {
        const dx = Math.abs(p2.x - p1.x);
        const dy = p2.y - p1.y;
        const curveOffset = Math.max(50, Math.min(dy * 0.5, 150));

        const d = `M ${p1.x} ${p1.y} C ${p1.x} ${p1.y + curveOffset}, ${p2.x} ${p2.y - curveOffset}, ${p2.x} ${p2.y}`;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        return path;
    }

    // ═══════════════════════════════════════════════════════════════
    //  PROPERTIES PANEL
    // ═══════════════════════════════════════════════════════════════
    function showProperties(nodeId) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        const meta = NODE_META[node.type];
        propsTitle.textContent = meta.label + ' Properties';
        propsPanel.classList.remove('hidden');

        let html = '';

        if (node.type === 'message') {
            html = `
                <div class="prop-group">
                    <label class="prop-label">Message Text</label>
                    <textarea class="prop-textarea" id="prop-text" placeholder="Enter message...">${escapeHtml(node.data.text || '')}</textarea>
                </div>
            `;
        } else if (node.type === 'ai_response') {
            html = `
                <div class="prop-group">
                    <label class="prop-label">System Prompt</label>
                    <textarea class="prop-textarea" id="prop-prompt" placeholder="Instructions for the AI..." style="min-height:120px">${escapeHtml(node.data.prompt || '')}</textarea>
                </div>
            `;
        } else if (node.type === 'knowledge') {
            const st = node.data.source_type || 'text';
            html = `
                <div class="prop-group">
                    <label class="prop-label">Label</label>
                    <input class="prop-input" id="prop-kb-label" value="${escapeHtml(node.data.label || '')}" placeholder="e.g., Channel Analytics">
                </div>
                <div class="prop-group">
                    <label class="prop-label">Data Source Type</label>
                    <select class="prop-input" id="prop-kb-type">
                        <option value="text" ${st==='text'?'selected':''}>📝 Paste Text / Data</option>
                        <option value="youtube" ${st==='youtube'?'selected':''}>▶️ YouTube URL</option>
                        <option value="website" ${st==='website'?'selected':''}>🌐 Website URL</option>
                    </select>
                </div>
                <div class="prop-group" id="kb-text-group" style="${st==='text'?'':'display:none'}">
                    <label class="prop-label">Knowledge Content</label>
                    <textarea class="prop-textarea" id="prop-kb-content" placeholder="Paste analytics data, channel info, scripts, or any text the AI should know about..." style="min-height:160px">${escapeHtml(node.data.content || '')}</textarea>
                </div>
                <div class="prop-group" id="kb-yt-group" style="${st==='youtube'?'':'display:none'}">
                    <label class="prop-label">YouTube URL</label>
                    <input class="prop-input" id="prop-kb-yt" value="${escapeHtml(node.data.youtube_url || '')}" placeholder="https://youtube.com/watch?v=...">
                    <p style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">The AI will be told about this video. Paste transcript in content for best results.</p>
                </div>
                <div class="prop-group" id="kb-web-group" style="${st==='website'?'':'display:none'}">
                    <label class="prop-label">Website URL</label>
                    <input class="prop-input" id="prop-kb-web" value="${escapeHtml(node.data.website_url || '')}" placeholder="https://example.com">
                    <p style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">Paste the page content into the text field for best results.</p>
                </div>
            `;
            // Bind source type change after render
            setTimeout(() => {
                const sel = document.getElementById('prop-kb-type');
                if (sel) sel.addEventListener('change', () => {
                    const v = sel.value;
                    document.getElementById('kb-text-group').style.display = v==='text'?'':'none';
                    document.getElementById('kb-yt-group').style.display = v==='youtube'?'':'none';
                    document.getElementById('kb-web-group').style.display = v==='website'?'':'none';
                    saveNodeProps(nodeId);
                });
            }, 0);
        } else if (node.type === 'user_input') {
            html = `
                <div class="prop-group">
                    <label class="prop-label">Placeholder Text</label>
                    <input class="prop-input" id="prop-placeholder" value="${escapeHtml(node.data.placeholder || '')}" placeholder="e.g., Type your message...">
                </div>
            `;
        } else if (node.type === 'condition') {
            html = `
                <div class="prop-group">
                    <label class="prop-label">Question</label>
                    <input class="prop-input" id="prop-cond-text" value="${escapeHtml(node.data.text || '')}" placeholder="What would you like?">
                </div>
                <div class="prop-group">
                    <label class="prop-label">Options (one per line)</label>
                    <textarea class="prop-textarea" id="prop-options" placeholder="Option 1&#10;Option 2&#10;Option 3">${(node.data.options || []).join('\n')}</textarea>
                </div>
            `;
        } else if (node.type === 'end') {
            html = `
                <div class="prop-group">
                    <label class="prop-label">Goodbye Message</label>
                    <textarea class="prop-textarea" id="prop-end-text" placeholder="Thanks message...">${escapeHtml(node.data.text || '')}</textarea>
                </div>
            `;
        } else {
            html = '<p style="color:var(--text-muted);font-size:0.85rem;">No configurable properties.</p>';
        }

        propsBody.innerHTML = html;

        // Bind input changes
        propsBody.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', () => saveNodeProps(nodeId));
        });
    }

    function saveNodeProps(nodeId) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        if (node.type === 'message') {
            node.data.text = document.getElementById('prop-text')?.value || '';
        } else if (node.type === 'ai_response') {
            node.data.prompt = document.getElementById('prop-prompt')?.value || '';
        } else if (node.type === 'knowledge') {
            node.data.label = document.getElementById('prop-kb-label')?.value || '';
            node.data.source_type = document.getElementById('prop-kb-type')?.value || 'text';
            node.data.content = document.getElementById('prop-kb-content')?.value || '';
            node.data.youtube_url = document.getElementById('prop-kb-yt')?.value || '';
            node.data.website_url = document.getElementById('prop-kb-web')?.value || '';
        } else if (node.type === 'user_input') {
            node.data.placeholder = document.getElementById('prop-placeholder')?.value || '';
        } else if (node.type === 'condition') {
            node.data.text = document.getElementById('prop-cond-text')?.value || '';
            const optText = document.getElementById('prop-options')?.value || '';
            node.data.options = optText.split('\n').map(s => s.trim()).filter(Boolean);
        } else if (node.type === 'end') {
            node.data.text = document.getElementById('prop-end-text')?.value || '';
        }

        // Update node body text
        refreshNodeBody(nodeId);
    }

    function refreshNodeBody(nodeId) {
        const node = nodes.find(n => n.id === nodeId);
        const el = document.getElementById(`fn-${nodeId}`);
        if (!node || !el) return;

        const bodyEl = el.querySelector('.fn-body-text');
        let text = '';
        if (node.type === 'message') text = node.data.text || '';
        else if (node.type === 'ai_response') text = '🤖 ' + (node.data.prompt || '').slice(0, 60) + '...';
        else if (node.type === 'user_input') text = 'Waiting for: ' + (node.data.placeholder || '');
        else if (node.type === 'condition') text = (node.data.options || []).join(' / ');
        else if (node.type === 'end') text = node.data.text || '';
        bodyEl.textContent = text;
    }

    function bindPropsEvents() {
        document.getElementById('btn-close-props').addEventListener('click', () => {
            propsPanel.classList.add('hidden');
            selectedNodeId = null;
            document.querySelectorAll('.flow-node').forEach(n => n.classList.remove('selected'));
        });

        document.getElementById('btn-delete-node').addEventListener('click', () => {
            if (selectedNodeId) deleteNode(selectedNodeId);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    //  TOPBAR ACTIONS (save, preview, delete bot)
    // ═══════════════════════════════════════════════════════════════
    function bindTopbarEvents() {
        document.getElementById('btn-new-bot').addEventListener('click', createNewBot);
        document.getElementById('btn-save').addEventListener('click', saveBot);
        document.getElementById('btn-preview').addEventListener('click', startPreview);
        document.getElementById('btn-delete-bot').addEventListener('click', deleteCurrentBot);
    }

    async function createNewBot() {
        const config = {
            name: 'New Chatbot',
            nodes: [{ id: 'node_1', type: 'start', x: 400, y: 80, data: {} }],
            edges: [],
        };

        const res = await fetch('/api/bots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        });
        const bot = await res.json();
        currentBotId = bot.id;
        loadBotToCanvas(bot);
        loadBots();
    }

    async function saveBot() {
        if (!currentBotId) {
            await createNewBot();
            return;
        }

        const config = {
            name: botNameInput.value || 'My Chatbot',
            nodes,
            edges,
        };

        await fetch(`/api/bots/${currentBotId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        });

        // Flash save button
        const btn = document.getElementById('btn-save');
        btn.textContent = '✓ Saved!';
        setTimeout(() => { btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save`; }, 1500);

        loadBots();
    }

    async function deleteCurrentBot() {
        if (!currentBotId) return;
        if (!confirm('Delete this chatbot?')) return;

        await fetch(`/api/bots/${currentBotId}`, { method: 'DELETE' });
        currentBotId = null;
        clearCanvas();
        loadBots();
    }

    // ═══════════════════════════════════════════════════════════════
    //  BOT LIST
    // ═══════════════════════════════════════════════════════════════
    async function loadBots() {
        const res = await fetch('/api/bots');
        const bots = await res.json();

        botList.innerHTML = '';
        if (bots.length === 0) {
            botList.innerHTML = '<div class="bot-empty">No chatbots yet</div>';
            return;
        }

        bots.forEach(bot => {
            const div = document.createElement('div');
            div.className = `bot-item ${bot.id === currentBotId ? 'active' : ''}`;
            div.innerHTML = `<span class="bot-item-icon">🤖</span> ${escapeHtml(bot.name)}`;
            div.addEventListener('click', () => loadBotById(bot.id));
            botList.appendChild(div);
        });
    }

    async function loadBotById(botId) {
        const res = await fetch(`/api/bots/${botId}`);
        const bot = await res.json();
        currentBotId = botId;
        loadBotToCanvas(bot);
        loadBots();
    }

    function loadBotToCanvas(bot) {
        clearCanvas();
        botNameInput.value = bot.name || 'My Chatbot';
        nodes = bot.nodes || [];
        edges = bot.edges || [];

        // Find max node id
        nodeIdCounter = 0;
        nodes.forEach(n => {
            const match = n.id.match(/node_(\d+)/);
            if (match) nodeIdCounter = Math.max(nodeIdCounter, parseInt(match[1]));
        });

        nodes.forEach(n => renderNode(n));
        renderConnections();
        updateEmptyState();
    }

    function clearCanvas() {
        canvas.querySelectorAll('.flow-node').forEach(el => el.remove());
        connectionsSvg.innerHTML = '';
        nodes = [];
        edges = [];
        selectedNodeId = null;
        propsPanel.classList.add('hidden');
        botNameInput.value = 'My Chatbot';
        updateEmptyState();
    }

    // ═══════════════════════════════════════════════════════════════
    //  CHAT PREVIEW
    // ═══════════════════════════════════════════════════════════════
    function bindPreviewEvents() {
        document.getElementById('btn-close-preview').addEventListener('click', closePreview);
        previewOverlay.addEventListener('click', (e) => {
            if (e.target === previewOverlay) closePreview();
        });

        document.getElementById('pw-send').addEventListener('click', sendPreviewMessage);
        pwInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendPreviewMessage();
        });

        document.getElementById('pw-restart').addEventListener('click', restartPreview);
    }

    async function startPreview() {
        if (!currentBotId) {
            alert('Save your chatbot first!');
            return;
        }

        // Save first
        await saveBot();

        previewSessionId = null;
        pwMessages.innerHTML = '';
        pwInputArea.classList.remove('disabled');
        previewOverlay.classList.remove('hidden');

        // Send empty message to start the flow
        await executePreviewStep('');
    }

    function closePreview() {
        previewOverlay.classList.add('hidden');
    }

    async function restartPreview() {
        if (previewSessionId) {
            await fetch('/api/chat/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bot_id: currentBotId, session_id: previewSessionId }),
            });
        }
        previewSessionId = null;
        pwMessages.innerHTML = '';
        pwInputArea.classList.remove('disabled');
        await executePreviewStep('');
    }

    async function sendPreviewMessage() {
        const text = pwInput.value.trim();
        if (!text) return;

        addPreviewMessage('user', text);
        pwInput.value = '';

        await executePreviewStep(text);
    }

    async function executePreviewStep(message) {
        // Show typing
        const typingEl = addPreviewTyping();

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bot_id: currentBotId,
                    session_id: previewSessionId,
                    message,
                }),
            });

            const data = await res.json();
            previewSessionId = data.session_id;

            // Remove typing
            typingEl.remove();

            // Render responses
            for (const resp of data.responses) {
                if (resp.type === 'bot') {
                    addPreviewMessage('bot', resp.content, resp.ai);
                } else if (resp.type === 'options') {
                    addPreviewMessage('bot', resp.content);
                    addPreviewOptions(resp.options);
                } else if (resp.type === 'input') {
                    pwInput.placeholder = resp.placeholder;
                    pwInput.focus();
                } else if (resp.type === 'end') {
                    addPreviewMessage('system', '— Flow complete. You can keep chatting! —');
                }
            }

        } catch (err) {
            typingEl.remove();
            addPreviewMessage('system', '⚠️ Error: ' + err.message);
        }
    }

    function addPreviewMessage(type, text, isAi = false) {
        const div = document.createElement('div');
        div.className = `pw-msg ${type}${isAi ? ' ai' : ''}`;
        div.textContent = text;
        pwMessages.appendChild(div);
        pwMessages.scrollTop = pwMessages.scrollHeight;
        return div;
    }

    function addPreviewOptions(options) {
        const container = document.createElement('div');
        container.className = 'pw-options';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'pw-option-btn';
            btn.textContent = opt;
            btn.addEventListener('click', async () => {
                container.remove();
                addPreviewMessage('user', opt);
                await executePreviewStep(opt);
            });
            container.appendChild(btn);
        });
        pwMessages.appendChild(container);
        pwMessages.scrollTop = pwMessages.scrollHeight;
    }

    function addPreviewTyping() {
        const div = document.createElement('div');
        div.className = 'pw-msg bot';
        div.innerHTML = '<div class="pw-typing"><div class="pw-typing-dot"></div><div class="pw-typing-dot"></div><div class="pw-typing-dot"></div></div>';
        pwMessages.appendChild(div);
        pwMessages.scrollTop = pwMessages.scrollHeight;
        return div;
    }

    // ── Utils ────────────────────────────────────────────────────────
    function escapeHtml(text) {
        const d = document.createElement('div');
        d.textContent = text || '';
        return d.innerHTML;
    }

    // ── Start ────────────────────────────────────────────────────────
    init();

})();
