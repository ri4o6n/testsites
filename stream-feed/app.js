/**
 * Stream Feed - Logic & Interaction
 * API連携、フィルタリング、JST変換、自動更新を管理
 */

const CONFIG = {
    API_URL: 'https://stream-feed-api.ri4o6n-exm.workers.dev/api/feed',
    BOOTSTRAP_URL: 'https://stream-feed-api.ri4o6n-exm.workers.dev/api/bootstrap',
    UPSERT_URL: 'https://stream-feed-api.ri4o6n-exm.workers.dev/api/sources/upsert',
    RESOLVE_YT_URL: 'https://stream-feed-api.ri4o6n-exm.workers.dev/api/resolve/youtube',
    POLLING_INTERVAL: 300000, // 5分
};

let state = {
    items: [],
    updatedAt: null,
    userToken: null,
    readToken: null,
    systemStatus: null,
    filter: {
        platform: 'all',
        liveOnly: false
    },
    isLoading: false
};

/**
 * 初期化
 */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initFilters();
    initAuthPanel();
    initChannelForm();
    startPolling();
});

/**
 * テーマ初期化・切り替え
 */
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    const currentTheme = localStorage.getItem('theme') || 'light';

    document.documentElement.setAttribute('data-theme', currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

/**
 * フィルタ設定
 */
function initFilters() {
    const platformBtns = document.querySelectorAll('.filter-btn');
    const liveOnlyToggle = document.getElementById('live-only-filter');

    platformBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            platformBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.filter.platform = btn.dataset.platform;
            render();
        });
    });

    liveOnlyToggle.addEventListener('change', (e) => {
        state.filter.liveOnly = e.target.checked;
        render();
    });
}

/**
 * ポーリング開始
 */
function startPolling() {
    fetchFeed();
    setInterval(fetchFeed, CONFIG.POLLING_INTERVAL);
}

/**
 * HTML特殊文字のエスケープ（XSS対策）
 */
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}

/**
 * URLバリデーション（http/httpsのみ許可）
 */
function sanitizeUrl(rawUrl, fallback = '#') {
    if (!rawUrl) return fallback;
    try {
        const parsed = new URL(rawUrl, window.location.href);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.toString();
        }
        return fallback;
    } catch {
        return fallback;
    }
}

/**
 * トークン管理
 */
function initAuthPanel() {
    const bootstrapBtn = document.getElementById('bootstrap-btn');
    const clearBtn = document.getElementById('clear-token-btn');
    const saveBtn = document.getElementById('save-token-btn');
    const tokenInput = document.getElementById('token-input');
    const copyIdBtn = document.getElementById('copy-id-btn');
    const copyReadUrlBtn = document.getElementById('copy-read-url-btn');

    const stored = localStorage.getItem('streamFeedToken');
    const storedRead = localStorage.getItem('streamFeedReadToken');

    const url = new URL(window.location.href);
    const urlToken = url.searchParams.get('token');
    if (urlToken) {
        setActiveToken(urlToken, storedRead || null);
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.toString());
    } else if (stored) {
        setActiveToken(stored, storedRead);
    }

    bootstrapBtn.addEventListener('click', async () => {
        bootstrapBtn.disabled = true;
        const result = await fetch(CONFIG.BOOTSTRAP_URL, { method: 'POST' }).then((r) => r.json());
        bootstrapBtn.disabled = false;

        if (!result.ok) {
            updateStatus(`Bootstrap failed: ${result.error || 'unknown'}`, true);
            return;
        }
        setActiveToken(result.ownerToken, result.readToken);
        updateStatus('New user created. Welcome!', false);
        fetchFeed();
    });

    clearBtn.addEventListener('click', () => {
        setActiveToken(null, null);
        updateStatus('Token cleared.', false);
        render();
    });

    saveBtn.addEventListener('click', () => {
        const value = tokenInput.value.trim();
        if (!value) {
            updateStatus('Token is empty.', true);
            return;
        }
        setActiveToken(value, storedRead || null);
        updateStatus('Token saved.', false);
        fetchFeed();
    });

    copyIdBtn.addEventListener('click', () => {
        if (!state.userToken) {
            updateStatus('Token がありません。', true);
            return;
        }
        copyToClipboard(state.userToken, 'ID copied.');
    });

    copyReadUrlBtn.addEventListener('click', () => {
        if (!state.readToken) {
            updateStatus('Read token がありません。', true);
            return;
        }
        const url = new URL(window.location.href);
        url.searchParams.set('token', state.readToken);
        copyToClipboard(url.toString(), 'Read URL copied.');
    });
}

function setActiveToken(token, readToken) {
    state.userToken = token;
    state.readToken = readToken;
    if (token) {
        localStorage.setItem('streamFeedToken', token);
    } else {
        localStorage.removeItem('streamFeedToken');
    }
    if (readToken) {
        localStorage.setItem('streamFeedReadToken', readToken);
    } else {
        localStorage.removeItem('streamFeedReadToken');
    }
    updateTokenDisplay();
    state.systemStatus = null;
}

function updateTokenDisplay() {
    const activeEl = document.getElementById('active-token');
    const readEl = document.getElementById('read-token');
    activeEl.textContent = state.userToken ? maskToken(state.userToken) : 'Not set';
    readEl.textContent = state.readToken ? maskToken(state.readToken) : '--';
}

function maskToken(token) {
    if (!token || token.length < 8) return token || '';
    return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

function updateStatus(message, isError) {
    const errorDisplay = document.getElementById('error-display');
    errorDisplay.textContent = message;
    errorDisplay.style.color = isError ? 'var(--status-live)' : 'var(--accent)';
    errorDisplay.style.opacity = '1';

    // 5秒後に自然に消える
    if (window.statusTimeout) clearTimeout(window.statusTimeout);
    window.statusTimeout = setTimeout(() => {
        errorDisplay.style.opacity = '0';
    }, 5000);
}

async function copyToClipboard(text, message) {
    try {
        await navigator.clipboard.writeText(text);
        updateStatus(message, false);
    } catch {
        updateStatus('Copy failed.', true);
    }
}

/**
 * チャンネル追加
 */
function initChannelForm() {
    const form = document.getElementById('add-channel-form');
    const result = document.getElementById('channel-result');
    const nameEl = document.getElementById('channel-name');
    const urlEl = document.getElementById('channel-url');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        result.textContent = '';
        const submitBtn = form.querySelector('button[type="submit"]');

        if (!state.userToken) {
            updateStatus('Token がありません。先に作成/保存してください。', true);
            return;
        }

        const rawUrl = urlEl.value.trim();
        const displayName = nameEl.value.trim();

        if (!rawUrl) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            const parsed = await parseChannelUrl(rawUrl);
            if (!parsed) {
                updateStatus('対応していないURLです。YouTube/TwitchのチャンネルURLのみ対応。', true);
                return;
            }

            const { platform, handle, url } = parsed;
            const id = makeSourceId(platform, handle);

            const body = {
                id,
                platform,
                handle,
                display_name: displayName || null,
                url: url || null,
                enabled: 1
            };

            const res = await fetch(CONFIG.UPSERT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-USER-TOKEN': state.userToken
                },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (!data.ok) {
                updateStatus(`Add failed: ${data.error || 'unknown'}`, true);
                return;
            }

            updateStatus(`Saved: ${handle}`, false);
            nameEl.value = '';
            urlEl.value = '';
            fetchFeed();
        } catch (err) {
            updateStatus('Failed to save channel.', true);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add / Update';
        }
    });
}

function makeSourceId(platform, handle) {
    const clean = handle.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    return `${platform}-${clean}`;
}

async function parseChannelUrl(input) {
    let url;
    try {
        url = new URL(input);
    } catch {
        return null;
    }

    const host = url.hostname.replace('www.', '');
    if (host === 'youtube.com' || host === 'm.youtube.com') {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts[0] === 'channel' && parts[1] && parts[1].startsWith('UC')) {
            return {
                platform: 'youtube',
                handle: parts[1],
                url: `https://www.youtube.com/channel/${parts[1]}`
            };
        }
        if (parts[0] && parts[0].startsWith('@')) {
            const resolved = await resolveYoutubeChannel(url.toString());
            return resolved;
        }
        return null;
    }

    if (host === 'twitch.tv') {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts[0]) {
            return {
                platform: 'twitch',
                handle: parts[0].toLowerCase(),
                url: `https://www.twitch.tv/${parts[0]}`
            };
        }
    }

    return null;
}

async function resolveYoutubeChannel(rawUrl) {
    if (!state.userToken) return null;
    try {
        const res = await fetch(CONFIG.RESOLVE_YT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-USER-TOKEN': state.userToken
            },
            body: JSON.stringify({ url: rawUrl })
        });
        const data = await res.json();
        if (!data.ok || !data.channelId) return null;
        return {
            platform: 'youtube',
            handle: data.channelId,
            url: data.url || `https://www.youtube.com/channel/${data.channelId}`
        };
    } catch {
        return null;
    }
}

/**
 * APIからフィード取得
 */
async function fetchFeed() {
    state.isLoading = true;
    const errorDisplay = document.getElementById('error-display');
    errorDisplay.textContent = '';

    try {
        if (!state.userToken) {
            state.items = [];
            state.updatedAt = null;
            state.systemStatus = 'no-token';
            updateStatus('Token を設定してください。', true);
            return;
        }

        const response = await fetch(CONFIG.API_URL, {
            headers: { 'X-USER-TOKEN': state.userToken }
        });
        if (response.status === 503) {
            state.items = [];
            state.updatedAt = null;
            state.systemStatus = 'maintenance';
            updateStatus('Maintenance mode. Please try again later.', true);
            return;
        }
        const data = await response.json();

        if (data.ok) {
            state.items = data.items;
            state.updatedAt = data.updatedAt;
            state.systemStatus = null;
            if (data.errors && data.errors.length > 0) {
                // エラーオブジェクトからメッセージを抽出して表示
                const errorMessages = data.errors.map(e => e.message || 'Unknown error').join(', ');
                errorDisplay.textContent = `Partial Error: ${errorMessages}`;
            }
        } else {
            throw new Error('API Response not OK');
        }
    } catch (err) {
        console.error('Fetch error:', err);
        state.systemStatus = 'error';
        errorDisplay.textContent = 'Oops! Failed to update feed. Retrying...';
    } finally {
        state.isLoading = false;
        render();
    }
}

/**
 * JST 変換・フォーマット
 */
function formatToJST(isoString, includeTime = true) {
    if (!isoString) return '時刻未定';

    try {
        const date = new Date(isoString);
        return date.toLocaleString('ja-JP', {
            timeZone: 'Asia/Tokyo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: includeTime ? '2-digit' : undefined,
            minute: includeTime ? '2-digit' : undefined,
        });
    } catch (e) {
        return '時刻形式エラー';
    }
}

/**
 * UIレンダリング
 */
function render() {
    const container = document.getElementById('feed-container');
    const updatedLabel = document.getElementById('last-updated');

    // 最終更新時刻の更新
    if (state.updatedAt) {
        updatedLabel.textContent = `Updated: ${formatToJST(state.updatedAt)}`;
    }

    // フィルタリング
    const filteredItems = state.items.filter(item => {
        const platformMatch = state.filter.platform === 'all' || item.platform === state.filter.platform;
        const liveMatch = !state.filter.liveOnly || item.status === 'live';
        return platformMatch && liveMatch;
    });

    if (state.systemStatus === 'maintenance') {
        container.innerHTML = `
            <div class="loading-state">
                <p>Maintenance mode. Please try again later.</p>
            </div>
        `;
        return;
    }

    if (state.systemStatus === 'no-token') {
        container.innerHTML = `
            <div class="loading-state">
                <p>Token が未設定です。</p>
            </div>
        `;
        return;
    }

    if (state.systemStatus === 'error') {
        container.innerHTML = `
            <div class="loading-state">
                <p>Network error. Please retry.</p>
            </div>
        `;
        return;
    }

    // コンテンツ生成
    if (filteredItems.length === 0) {
        container.innerHTML = `
            <div class="loading-state">
                <p>${state.isLoading ? 'Updating...' : 'No streams found.'}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredItems.map((item, index) => {
        const startTime = formatToJST(item.startAt);
        const badgeClass = item.status === 'live' ? 'live' : (item.status === 'scheduled' ? 'scheduled' : 'archive');

        // サムネイルのフォールバック
        const thumbUrl = sanitizeUrl(item.thumbnailUrl, 'https://placehold.co/640x360?text=No+Thumbnail');
        const streamUrl = sanitizeUrl(item.url, '#');

        // スタッガーアニメーションの遅延設定
        const delay = index * 0.05;

        return `
            <article class="card" style="animation-delay: ${delay}s">
                <a href="${streamUrl}" target="_blank" rel="noopener" class="card-link-overlay"></a>
                <div class="thumb-container">
                    <img src="${thumbUrl}" alt="${escapeHTML(item.title)}" class="thumbnail" loading="lazy">
                    <span class="status-badge ${badgeClass}">${escapeHTML(item.status)}</span>
                </div>
                <div class="card-content">
                    <span class="platform-icon">${escapeHTML(item.platform)}</span>
                    <h3 class="stream-title">${escapeHTML(item.title)}</h3>
                    <p class="channel-name">${escapeHTML(item.channelName)}</p>
                    <p class="start-time">Start: ${escapeHTML(startTime)}</p>
                </div>
            </article>
        `;
    }).join('');
}
