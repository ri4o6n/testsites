/**
 * Stream Feed - Logic & Interaction
 * API連携、フィルタリング、JST変換、自動更新を管理
 */

const CONFIG = {
    API_URL: 'https://stream-feed-api.ri4o6n-exm.workers.dev/api/feed',
    POLLING_INTERVAL: 45000, // 45秒
};

let state = {
    items: [],
    updatedAt: null,
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
    startPolling();
});

/**
 * テーマ初期化・切り替え
 */
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
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
 * APIからフィード取得
 */
async function fetchFeed() {
    state.isLoading = true;
    const errorDisplay = document.getElementById('error-display');
    errorDisplay.textContent = '';

    try {
        const response = await fetch(CONFIG.API_URL);
        const data = await response.json();

        if (data.ok) {
            state.items = data.items;
            state.updatedAt = data.updatedAt;
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
