/**
 * App Logic: Local Supporter Finder
 * 
 * 厳格なOOP原則に基づき、データ管理とUI表示を分離。
 */

class SupporterManager {
    constructor() {
        this.supporters = [];
        this.filteredSupporters = [];
        this.dataUrl = './data/supporters.json';
    }

    /**
     * 初期化: データの読み込み
     */
    async init() {
        try {
            const response = await fetch(this.dataUrl);
            if (!response.ok) throw new Error('Failed to load data');
            this.supporters = await response.json();
            this.filteredSupporters = [...this.supporters];
            this.render();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('データの読み込みに失敗しました。');
        }
    }

    /**
     * 検索実行
     * @param {string} query - 検索文字列（地域名）
     */
    search(query) {
        const normalizedQuery = this.normalize(query);

        if (!normalizedQuery) {
            this.filteredSupporters = [...this.supporters];
        } else {
            this.filteredSupporters = this.supporters.filter(sup => {
                // 対応エリアのいずれかに検索ワードが含まれているか
                return sup.areas.some(area => this.normalize(area).includes(normalizedQuery));
            });
        }

        this.render();
    }

    /**
     * 文字列の正規化（全角半角、大文字小文字などを統一）
     */
    normalize(str) {
        return str.trim()
            .toLowerCase()
            .replace(/[ぁ-ん]/g, s => String.fromCharCode(s.charCodeAt(0) + 0x60)) // ひらがなをカタカナに（必要に応じて）
            .replace(/[ァ-ン]/g, s => String.fromCharCode(s.charCodeAt(0) - 0x60)); // 簡易的な正規化
    }

    /**
     * 描画処理
     */
    render() {
        const resultsContainer = document.getElementById('results-grid');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = '';

        if (this.filteredSupporters.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state animate-fade-in">
                    <p>該当するサポーターが見つかりませんでした。</p>
                    <p class="text-muted">「渋谷」や「横浜」など、地域名の一部でお試しください。</p>
                </div>
            `;
            resultsContainer.style.display = 'block';
            return;
        }

        resultsContainer.style.display = 'grid';
        this.filteredSupporters.forEach((sup, index) => {
            const card = this.createCard(sup);
            card.classList.add('animate-fade-in');
            card.style.animationDelay = `${index * 0.05}s`;
            resultsContainer.appendChild(card);
        });
    }

    /**
     * サポーターカードの生成
     */
    createCard(sup) {
        const card = document.createElement('div');
        card.className = 'card';

        card.innerHTML = `
            <div class="card-header">
                <span class="card-name">${this.escape(sup.displayName)}</span>
                <div class="card-tags">
                    ${sup.modes.map(mode => `<span class="tag">${this.escape(mode)}</span>`).join('')}
                </div>
            </div>
            <div class="card-area text-muted">対応地域: ${sup.areas.join('、')}</div>
            <div class="card-tags" style="margin-top: 4px;">
                ${sup.categories.map(cat => `<span class="tag" style="background: var(--clr-bg); color: var(--clr-text-muted);">${this.escape(cat)}</span>`).join('')}
            </div>
            <p class="card-note">${this.escape(sup.note)}</p>
            <button class="btn btn-outline" style="width: 100%; margin-top: var(--space-s);">詳細を見る</button>
        `;

        return card;
    }

    /**
     * 安全なエスケープ処理
     */
    escape(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    showError(msg) {
        const resultsContainer = document.getElementById('results-grid');
        if (resultsContainer) {
            resultsContainer.innerHTML = `<p class="error">${msg}</p>`;
        }
    }
}

// 起動
document.addEventListener('DOMContentLoaded', () => {
    const manager = new SupporterManager();
    manager.init();

    // 検索フォームの制御
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            manager.search(searchInput.value);
        });

        // リアルタイム検索を希望する場合はここに追加可能
    }
});
