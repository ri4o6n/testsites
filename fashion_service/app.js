/**
 * CLOSET ARCHIVE - アプリケーションコアロジック (OOP)
 * 
 * GEMINI.mdの原則に基づき、厳格なオブジェクト指向プログラミングで設計。
 * 全てのコメントおよびdocstringは日本語で記述。
 * 各ビューは Component 基底クラスを継承し、状態管理と描画をカプセル化。
 */

// --- 1. UIコンポーネント基底クラス ---
class Component {
    /**
     * コンポーネントを初期化する
     * @param {HTMLElement} element - マウント対象となるDOM要素
     * @param {Object} props - 外部から伝達される読み取り専用データ
     */
    constructor(element, props = {}) {
        this.element = element;
        this.props = props;
        this.state = {};
    }

    /**
     * 状態を更新し、コンポーネントの再描画をトリガーする
     * @param {Object} newState - 更新したい状態の差分
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }

    /**
     * 描画を実行する（子クラスで個別にオーバーライド）
     */
    render() {
        this.element.innerHTML = '';
    }
}

// --- 2. 状態（State）の一元管理クラス（Single Source of Truth） ---
class AppState {
    constructor() {
        // アプリケーション全体で共有される初期データ
        this.theme = localStorage.getItem('theme') || 'light';
        this.currentTab = 'journal';
        
        // デジタルクローゼット内の所有アイテム初期データ
        this.closetItems = [
            { id: 'c1', name: 'オーガニックコットン オーバーサイズシャツ', brand: 'YOKE', category: 'Tops', color: 'オフホワイト', colorCode: '#f5f5f4', timesWorn: 14, lastWorn: '2026-05-20', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop' },
            { id: 'c2', name: 'ギャバジン ワイドストレートスラックス', brand: 'Stein', category: 'Bottoms', color: 'チャコールグレー', colorCode: '#44403c', timesWorn: 18, lastWorn: '2026-05-21', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&auto=format&fit=crop' },
            { id: 'c3', name: 'ミニマリスト ウールトレンチコート', brand: 'AURALEE', category: 'Outer', color: 'トープ', colorCode: '#a8a29e', timesWorn: 8, lastWorn: '2026-05-10', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&auto=format&fit=crop' },
            { id: 'c4', name: 'カシミア クルーネックセーター', brand: 'COMOLI', category: 'Tops', color: 'ネイビー', colorCode: '#1e3a8a', timesWorn: 11, lastWorn: '2026-05-12', image: 'https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?w=400&auto=format&fit=crop' },
            { id: 'c5', name: 'レザー トラックソールスニーカー', brand: 'Studio Nicholson', category: 'Shoes', color: 'ブラック', colorCode: '#1c1917', timesWorn: 22, lastWorn: '2026-05-21', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&auto=format&fit=crop' },
            { id: 'c6', name: 'ヘビーウェイト モックネックTシャツ', brand: 'Graphpaper', category: 'Tops', color: 'セージグリーン', colorCode: '#7d9d9c', timesWorn: 19, lastWorn: '2026-05-18', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop' },
            { id: 'c7', name: 'セルビッジ デニムストレートパンツ', brand: 'ciota', category: 'Bottoms', color: 'インディゴブルー', colorCode: '#1d4ed8', timesWorn: 5, lastWorn: '2026-04-15', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&auto=format&fit=crop' }
        ];

        // 日記・コーディネートログ初期データ
        this.journalEntries = [
            {
                id: 'j1',
                date: '2026-05-21',
                weather: '晴れ',
                temp: '22°C',
                mood: '快適',
                description: '新しいSteinのスラックスを主役に、全体をモノトーンにまとめて知的な印象に。足元はスニーカーで程よい抜け感をプラス。',
                image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop',
                items: ['c2', 'c1', 'c5']
            },
            {
                id: 'j2',
                date: '2026-05-18',
                weather: '曇り',
                temp: '19°C',
                mood: '穏やか',
                description: 'Graphpaper of セージグリーンTシャツと、YOKEのシャツをレイヤード。初夏を感じさせるスモーキーな配色で統一しました。',
                image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop',
                items: ['c6', 'c1', 'c5']
            },
            {
                id: 'j3',
                date: '2026-05-12',
                weather: '雨後晴れ',
                temp: '16°C',
                mood: '少し肌寒い',
                description: '気温が低かったためCOMOLIのカシミアセーターを着用。ネイビーとチャコールの組み合わせは一番落ち着く配色。',
                image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop',
                items: ['c4', 'c2', 'c5']
            }
        ];

        // 他のユーザーから届いた匿名の提案データ
        this.receivedSuggestions = [
            {
                id: 's1',
                date: '2026-05-22',
                targetEntryId: 'j1',
                suggestionText: '「モノトーンの非常に美しいバランスですね。この上品なスラックスの足元に、Studio Nicholsonのボリュームのあるレザースニーカーも完璧に合いますが、もしよろしければ、もう少しカチッとした『KLEMANのチロリアンシューズ（ブラック）』を合わせて上品なフレンチカジュアルに振るのもお似合いかと思います！」',
                recommendedItem: { name: 'PADRE チロリアンシューズ', brand: 'KLEMAN' }
            },
            {
                id: 's2',
                date: '2026-05-19',
                targetEntryId: 'j2',
                suggestionText: '「スモーキーな配色が素晴らしく綺麗です！セージグリーンのインナーに対し、羽織りを『AURALEEのシャンブレーギャバジンブルゾン（ベージュ）』にすると、さらに上品なアースカラーのグラデーションが生まれて素敵になりそうです」',
                recommendedItem: { name: 'CHAMBRAY GABARDINE BLOUSON', brand: 'AURALEE' }
            }
        ];

        // 他ユーザーの公開コーディネートフィード（SNSモック用）
        this.publicFeed = [
            {
                id: 'p1',
                userName: 'A. Takahashi',
                userHandle: '@takahashi_arch',
                avatar: 'AT',
                date: '2026-05-22',
                weather: '晴れ',
                temp: '23°C',
                mood: 'インスピレーション',
                description: '今日はAURALEEのトレンチコートに、オフホワイトのワイドデニムを合わせて大人らしいリラックススタイルにしました。全体的にニュートラルな色調ですが、インナーにほんのりアクセントカラーを差し込むか、それともこのまま無機質にまとめるかで迷っています。',
                image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&auto=format&fit=crop',
                likes: 12,
                liked: false,
                suggestions: [
                    {
                        sender: '匿名ユーザー',
                        text: '「素晴らしいシルエットですね！トレンチコートの上品なドレープ感が引き立っています。インナーに差し色を入れるなら、彩度を極限まで抑えた『セージグリーンのシャツ』が、ニュートラルなトーンを崩さず自然に溶け込むかと思います。」',
                        item: 'ヘビーウェイト モックネックTシャツ (セージグリーン)'
                    }
                ],
                publicCloset: [
                    { name: 'ミニマリスト ウールトレンチコート', brand: 'AURALEE', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200' },
                    { name: 'ギャバジン ワイドストレートスラックス', brand: 'Stein', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=200' },
                    { name: 'オーガニックコットン オーバーサイズシャツ', brand: 'YOKE', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200' }
                ]
            },
            {
                id: 'p2',
                userName: 'M. Yamashiro',
                userHandle: '@yamashiro_m',
                avatar: 'MY',
                date: '2026-05-21',
                weather: '曇り',
                temp: '20°C',
                mood: 'ノスタルジー',
                description: 'Steinのオーバーサイズドシャツに、ミリタリー調のオリーブカーゴを合わせました。無骨なボトムスに対して、ドレス仕立てのシャツを合わせることで、静かな緊張感を持たせるのが最近の気分です。',
                image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop',
                likes: 8,
                liked: false,
                suggestions: []
            }
        ];

        // フォロー中（お気に入り）の共鳴者リスト
        this.followedUsers = [];
    }

    /**
     * 他ユーザーの投稿に対する共鳴（いいね）をトグルする
     * @param {string} feedId - 対象の投稿ID
     */
    toggleFeedLike(feedId) {
        const feed = this.publicFeed.find(f => f.id === feedId);
        if (feed) {
            feed.liked = !feed.liked;
            feed.likes += feed.liked ? 1 : -1;
        }
    }

    /**
     * お気に入り共鳴者（フォロー）の登録状態をトグルする
     * @param {string} handle - 対象ユーザーのハンドルネーム
     */
    toggleFollowUser(handle) {
        const index = this.followedUsers.indexOf(handle);
        if (index === -1) {
            this.followedUsers.push(handle);
        } else {
            this.followedUsers.splice(index, 1);
        }
    }

    /**
     * 他ユーザーの投稿へコーディネート提案を送信する
     * @param {string} feedId - 対象の投稿ID
     * @param {Object} suggestion - 提案内容
     */
    addSuggestionToFeed(feedId, suggestion) {
        const feed = this.publicFeed.find(f => f.id === feedId);
        if (feed) {
            feed.suggestions.push(suggestion);
        }
    }

    /**
     * 新しいコーディネートを登録する
     * @param {Object} entry - 新規コーディネートデータ
     */
    addJournalEntry(entry) {
        this.journalEntries.unshift(entry);
        
        // 紐づけられたクローゼットアイテムの着用回数と最終着用日を更新
        entry.items.forEach(itemId => {
            const item = this.closetItems.find(i => i.id === itemId);
            if (item) {
                item.timesWorn += 1;
                item.lastWorn = entry.date;
            }
        });
    }

    /**
     * 新規コーディネートをタイムライン（コミュニティ）に公開し、
     * 数秒後に共鳴（いいね）自動増加、その後に具体的な匿名提案が自動で届く
     * 非同期リアクティブシミュレータ。
     * @param {Object} post - 公開する投稿オブジェクト
     * @param {Function} onUpdate - 状態更新時のコールバック関数
     */
    addFeedPost(post, onUpdate) {
        this.publicFeed.unshift(post);
        
        // 1. リアクティブシミュレータ: 2秒後に共鳴（いいね）が2増える
        setTimeout(() => {
            post.likes += 2;
            post.likedBySimulator = true;
            if (onUpdate) onUpdate();
        }, 2000);

        // 2. リアクティブシミュレータ: 4.5秒後に具体的な匿名提案が相手（自分）の投稿とInboxに届く
        setTimeout(() => {
            // クローゼットから提案用のアイテム名を取得（なければデフォルト）
            const matchedItem = this.closetItems[1] || { name: 'ワイドストレートスラックス', brand: 'Stein' };
            const suggestionText = `「とても素敵なスタイリングですね！全体のトーンが美しくまとまっています。もしよければ、手持ちの『${matchedItem.name}』を合わせて、もう少しドレスライクに仕上げるのも非常に魅力的だと思います！」`;
            
            const newSuggestion = {
                sender: '匿名ユーザー',
                text: suggestionText,
                item: `[${matchedItem.brand}] ${matchedItem.name}`
            };
            post.suggestions.push(newSuggestion);

            // Inbox（自分に届いた提案一覧）の先頭にも追加
            const inboxSuggestion = {
                id: 's_sim_' + Date.now(),
                date: new Date().toISOString().split('T')[0],
                targetEntryId: 'j' + this.journalEntries.length,
                suggestionText: suggestionText,
                recommendedItem: { 
                    name: matchedItem.name, 
                    brand: matchedItem.brand
                }
            };
            this.receivedSuggestions.unshift(inboxSuggestion);
            
            if (onUpdate) onUpdate();
        }, 4500);
    }

    /**
     * クローゼットに新アイテムを追加する
     * @param {Object} item - 新規ワードローブアイテム
     */
    addClosetItem(item) {
        this.closetItems.unshift(item);
    }
}

// --- 3. ジャーナルビュー・コンポーネント (JournalView) ---
class JournalView extends Component {
    constructor(element, props) {
        super(element, props);
        this.state = {
            isUploading: false,
            selectedImage: null,
            aiTags: null,
            tempSelectedItems: [],
            // 表示モードおよびカレンダーの日付状態
            currentViewMode: 'calendar', // 'calendar' | 'timeline'
            currentYear: new Date().getFullYear(),
            currentMonth: new Date().getMonth(), // 0-11
            selectedDate: null // 'YYYY-MM-DD' 形式
        };

        // スワイプ・ドラッグ検知用（非リアクティブデータ）
        this.touchStartX = 0;
        this.dragStartX = 0;
        this.isDragging = false;
        this.dragOffset = 0;
    }

    /**
     * 画像選択時のAI画像認識擬似シミュレータ
     * @param {File} file - アップロードされた画像ファイル
     */
    simulateAiScan(file) {
        this.setState({ isUploading: true, aiTags: null });

        // ローカルプレビュー用の画像読み込み
        const reader = new FileReader();
        reader.onload = (e) => {
            this.state.selectedImage = e.target.result;
            
            // AIスキャン中のローディング効果を演出 (1.5秒待機)
            setTimeout(() => {
                const simulatedTags = {
                    category: 'Tops',
                    color: 'セージグリーン',
                    colorCode: '#7d9d9c',
                    inferredItemName: 'ヘビーウェイト モックネックTシャツ',
                    confidence: '94.8%'
                };
                
                const matchedItem = this.props.appState.closetItems.find(
                    item => item.name.includes('モックネック') || item.color === 'セージグリーン'
                );

                this.setState({
                    isUploading: false,
                    aiTags: simulatedTags,
                    tempSelectedItems: matchedItem ? [matchedItem.id] : []
                });
            }, 1500);
        };
        reader.readAsDataURL(file);
    }

    /**
     * カレンダー表示用のHTMLテンプレートを生成する
     * @returns {string} カレンダーのHTML文字列
     */
    renderCalendarHtml() {
        const appState = this.props.appState;
        const year = this.state.currentYear;
        const month = this.state.currentMonth;

        // 月の最初の日と曜日
        const firstDayIndex = new Date(year, month, 1).getDay(); // 0:日, 1:月...
        // 月の総日数
        const totalDays = new Date(year, month + 1, 0).getDate();
        // 前月の総日数 (空セル埋め用)
        const prevMonthTotalDays = new Date(year, month, 0).getDate();

        // 曜日ヘッダー
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayHeaders = weekdays.map(day => `<div class="calendar-day-header">${day}</div>`).join('');

        // 日付セルの生成
        let dayCells = [];

        // 前月の日付で埋める (empty)
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const dayNum = prevMonthTotalDays - i;
            dayCells.push(`<div class="calendar-day empty">${dayNum}</div>`);
        }

        // 当月の日付
        const today = new Date();
        for (let day = 1; day <= totalDays; day++) {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // 投稿があるかチェック
            const hasPost = appState.journalEntries.some(entry => entry.date === dateString);
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const isActive = this.state.selectedDate === dateString;

            let classes = ['calendar-day'];
            if (isToday) classes.push('today');
            if (isActive) classes.push('active');

            const dotHtml = hasPost ? `<span class="calendar-dot"></span>` : '';

            dayCells.push(`
                <div class="${classes.join(' ')}" data-date="${dateString}">
                    ${day}
                    ${dotHtml}
                </div>
            `);
        }

        // 翌月の日付で埋めて合計42セル(6行)にする
        const totalCells = dayCells.length;
        const nextMonthDaysNeeded = 42 - totalCells;
        for (let day = 1; day <= nextMonthDaysNeeded; day++) {
            dayCells.push(`<div class="calendar-day empty">${day}</div>`);
        }

        const formattedMonth = `${year}年 ${month + 1}月`;

        return `
            <div class="calendar-viewport" id="calendar-viewport">
                <div class="calendar-slider" id="calendar-slider">
                    <div class="calendar-month-sheet">
                        <div class="calendar-nav-header">
                            <button class="calendar-nav-btn" id="cal-prev-btn" aria-label="前月">
                                <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            </button>
                            <div class="calendar-current-month">${formattedMonth}</div>
                            <button class="calendar-nav-btn" id="cal-next-btn" aria-label="翌月">
                                <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                        </div>
                        <div class="calendar-grid">
                            ${dayHeaders}
                            ${dayCells.join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 選択された日付の詳細ドロワーのHTMLを生成する
     * @returns {string} 詳細ドロワーのHTML文字列
     */
    renderDetailDrawerHtml() {
        if (!this.state.selectedDate) return '';

        const appState = this.props.appState;
        const entry = appState.journalEntries.find(j => j.date === this.state.selectedDate);

        if (!entry) {
            return `
                <div class="selected-day-detail card-item" style="margin-top: var(--space-md);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);">
                        <h3 class="section-title" style="font-size: 14px;">${this.state.selectedDate}</h3>
                        <button class="detail-close-btn" id="close-detail-btn">閉じる</button>
                    </div>
                    <p style="font-size: 12px; color: var(--text-secondary);">この日のコーディネートログはありません。</p>
                </div>
            `;
        }

        const wornItems = entry.items.map(itemId => appState.closetItems.find(i => i.id === itemId)).filter(Boolean);

        return `
            <div class="selected-day-detail card-item" style="margin-top: var(--space-md);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm); border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-xs);">
                    <div>
                        <h3 class="section-title" style="font-size: 15px;">${entry.date} の装い</h3>
                        <div class="entry-meta" style="margin-top: 4px;">
                            <span class="meta-tag">${entry.weather}</span>
                            <span class="meta-tag">${entry.temp}</span>
                            <span class="meta-tag">${entry.mood}</span>
                        </div>
                    </div>
                    <button class="detail-close-btn" id="close-detail-btn" style="font-size: 12px;">閉じる</button>
                </div>
                
                <div class="entry-content">
                    <div class="entry-image-container">
                        <img src="${entry.image}" alt="Coordinate">
                        <span class="ai-scan-indicator">
                            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            AI Tagged
                        </span>
                    </div>
                    <div class="entry-details">
                        <p class="entry-desc">${entry.description}</p>
                        
                        <div class="entry-items">
                            <div class="entry-items-title">Worn Items</div>
                            <div class="items-tag-list">
                                ${wornItems.map(item => `
                                    <div class="item-tag" title="着用回数: ${item.timesWorn}回">
                                        <span style="font-weight: 500;">${item.brand}</span> ${item.name}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 月の移動処理を行う
     * @param {number} offset - 移動させる月数 (-1 または 1)
     */
    navigateMonth(offset) {
        let newMonth = this.state.currentMonth + offset;
        let newYear = this.state.currentYear;

        if (newMonth < 0) {
            newMonth = 11;
            newYear -= 1;
        } else if (newMonth > 11) {
            newMonth = 0;
            newYear += 1;
        }

        this.setState({
            currentYear: newYear,
            currentMonth: newMonth,
            selectedDate: null // 月変更時は詳細ドロワーを閉じる
        });
    }

    /**
     * ビューにすべてのイベントリスナーを安全にバインドする
     */
    bindEvents() {
        const appState = this.props.appState;

        // 1. ビューモード（タイムライン・カレンダー）切り替えトグル
        this.element.querySelectorAll('.view-mode-toggle .toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-mode');
                this.setState({ currentViewMode: mode, selectedDate: null });
            });
        });

        // 2. ドラッグ＆ドロップおよびファイルアップロード処理
        const dropzone = this.element.querySelector('#dropzone');
        const fileInput = this.element.querySelector('#file-input');

        if (dropzone && fileInput) {
            dropzone.addEventListener('click', () => fileInput.click());
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.style.borderColor = 'var(--accent-color)';
            });
            dropzone.addEventListener('dragleave', () => {
                dropzone.style.borderColor = 'var(--border-color)';
            });
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                if (e.dataTransfer.files.length > 0) {
                    this.simulateAiScan(e.dataTransfer.files[0]);
                }
            });
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.simulateAiScan(e.target.files[0]);
                }
            });
        }

        // 3. コーディネート登録送信処理
        const submitBtn = this.element.querySelector('#submit-post');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                const weather = this.element.querySelector('#post-weather').value || '晴れ';
                const temp = this.element.querySelector('#post-temp').value || '20°C';
                const mood = this.element.querySelector('#post-mood').value || '日常';
                const description = this.element.querySelector('#post-desc').value || 'コーディネートの記録。';
                
                const itemMatcher = this.element.querySelector('#item-matcher');
                const selectedItems = itemMatcher ? [itemMatcher.value] : [];

                const newEntry = {
                    id: 'j' + (appState.journalEntries.length + 1),
                    date: new Date().toISOString().split('T')[0],
                    weather,
                    temp,
                    mood,
                    description,
                    image: this.state.selectedImage,
                    items: selectedItems
                };

                appState.addJournalEntry(newEntry);

                // Community (タイムライン) への同時公開の処理
                const shareCheck = this.element.querySelector('#post-share-community');
                const shouldShare = shareCheck ? shareCheck.checked : false;
                if (shouldShare) {
                    const newFeedPost = {
                        id: 'p_my_' + Date.now(),
                        userName: 'You',
                        userHandle: '@my_archive',
                        avatar: 'ME',
                        date: newEntry.date,
                        weather,
                        temp,
                        mood,
                        description,
                        image: this.state.selectedImage,
                        likes: 0,
                        liked: false,
                        suggestions: [],
                        publicCloset: appState.closetItems.slice(0, 3).map(item => ({
                            name: item.name,
                            brand: item.brand,
                            image: item.image
                        }))
                    };
                    appState.addFeedPost(newFeedPost, () => {
                        this.props.onStateChange();
                    });
                }
                
                const postDate = new Date(newEntry.date);
                
                this.state = {
                    ...this.state,
                    isUploading: false,
                    selectedImage: null,
                    aiTags: null,
                    tempSelectedItems: [],
                    currentYear: postDate.getFullYear(),
                    currentMonth: postDate.getMonth(),
                    selectedDate: newEntry.date
                };
                
                this.props.onStateChange();
            });
        }

        // 4. カレンダーモード固有のインタラクション
        if (this.state.currentViewMode === 'calendar') {
            const prevBtn = this.element.querySelector('#cal-prev-btn');
            const nextBtn = this.element.querySelector('#cal-next-btn');

            if (prevBtn) prevBtn.addEventListener('click', () => this.navigateMonth(-1));
            if (nextBtn) nextBtn.addEventListener('click', () => this.navigateMonth(1));

            // 日付セルのクリックイベント
            this.element.querySelectorAll('.calendar-day:not(.empty)').forEach(cell => {
                cell.addEventListener('click', () => {
                    const dateStr = cell.getAttribute('data-date');
                    this.setState({ selectedDate: dateStr });
                });
            });

            // 詳細ドロワーの閉じるボタン
            const closeDetailBtn = this.element.querySelector('#close-detail-btn');
            if (closeDetailBtn) {
                closeDetailBtn.addEventListener('click', () => {
                    this.setState({ selectedDate: null });
                });
            }

            // 左右スワイプ / マウスドラッグによる滑らかな月移動
            const viewport = this.element.querySelector('#calendar-viewport');
            const slider = this.element.querySelector('#calendar-slider');

            if (viewport && slider) {
                // タッチイベント (モバイル)
                viewport.addEventListener('touchstart', (e) => {
                    this.touchStartX = e.touches[0].clientX;
                    this.isDragging = true;
                    slider.style.transition = 'none';
                }, { passive: true });

                viewport.addEventListener('touchmove', (e) => {
                    if (!this.isDragging) return;
                    const currentX = e.touches[0].clientX;
                    this.dragOffset = currentX - this.touchStartX;
                    slider.style.transform = `translateX(${this.dragOffset}px)`;
                }, { passive: true });

                viewport.addEventListener('touchend', (e) => {
                    if (!this.isDragging) return;
                    this.isDragging = false;
                    
                    slider.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    slider.style.transform = 'translateX(0)';

                    const diffX = e.changedTouches[0].clientX - this.touchStartX;
                    if (diffX > 50) {
                        this.navigateMonth(-1); // 右スワイプで前月へ
                    } else if (diffX < -50) {
                        this.navigateMonth(1); // 左スワイプで翌月へ
                    }
                });

                // マウスドラッグイベント (PC)
                viewport.addEventListener('mousedown', (e) => {
                    this.dragStartX = e.clientX;
                    this.isDragging = true;
                    slider.style.transition = 'none';
                    viewport.style.cursor = 'grabbing';
                });

                viewport.addEventListener('mousemove', (e) => {
                    if (!this.isDragging) return;
                    const currentX = e.clientX;
                    this.dragOffset = currentX - this.dragStartX;
                    slider.style.transform = `translateX(${this.dragOffset}px)`;
                });

                const endMouseDrag = (e) => {
                    if (!this.isDragging) return;
                    this.isDragging = false;
                    viewport.style.cursor = 'grab';
                    
                    slider.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    slider.style.transform = 'translateX(0)';

                    const diffX = e.clientX - this.dragStartX;
                    if (diffX > 50) {
                        this.navigateMonth(-1); // 右ドラッグで前月へ
                    } else if (diffX < -50) {
                        this.navigateMonth(1); // 左ドラッグで翌月へ
                    }
                };

                viewport.addEventListener('mouseup', endMouseDrag);
                viewport.addEventListener('mouseleave', endMouseDrag);
            }
        }
    }

    render() {
        const appState = this.props.appState;
        
        // 投稿用エリアのHTMLテンプレート（AIスキャンシミュレータ搭載）
        const postFormHtml = `
            <div class="post-form-area card-item">
                <h3 class="section-title" style="font-size: 15px; margin-bottom: var(--space-sm);">New Archive</h3>
                
                <div class="form-grid">
                    <!-- 画像ドラッグ＆ドロップまたはファイル選択 -->
                    <div class="file-dropzone" id="dropzone">
                        ${this.state.isUploading ? `
                            <svg class="animate-spin" viewBox="0 0 24 24" style="animation: spin 1s linear infinite; width:24px; height:24px; stroke:currentColor; stroke-width:1.5; fill:none; margin-bottom:var(--space-xs);">
                                <circle cx="12" cy="12" r="10" stroke="var(--border-color)" stroke-width="2" fill="none"></circle>
                                <path d="M12 2 a10 10 0 0 1 10 10" stroke="var(--accent-color)" stroke-width="3" fill="none"></path>
                            </svg>
                            <p style="font-size: 11px; letter-spacing: 0.1em;">AI IMAGE SCANNING...</p>
                        ` : this.state.selectedImage ? `
                            <img src="${this.state.selectedImage}" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-sm);">
                        ` : `
                            <svg viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <p>画像をドロップ、またはクリックして選択</p>
                            <span style="font-size: 10px; color: var(--text-muted); margin-top: var(--space-xxs);">コーディネート写真を解析</span>
                        `}
                        <input type="file" id="file-input" style="display: none;" accept="image/*">
                    </div>

                    <!-- メタ情報およびAI認識結果 -->
                    <div class="form-fields">
                        <div style="display: flex; gap: var(--space-xs);">
                            <input type="text" id="post-weather" placeholder="天気 (例: 晴れ)" class="input-field" style="flex: 1;">
                            <input type="text" id="post-temp" placeholder="気温 (例: 22°C)" class="input-field" style="flex: 1;">
                        </div>
                        <input type="text" id="post-mood" placeholder="気分や過ごし方 (例: カフェ巡り、リラックス)" class="input-field">
                        <textarea id="post-desc" placeholder="装いの思想やメモを記述..." class="input-field" style="height: 70px; resize: none;"></textarea>
                        
                        <!-- AI認識結果表示領域 -->
                        ${this.state.aiTags ? `
                            <div style="background-color: var(--accent-light); padding: var(--space-xs); border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 11px; animation: fadeIn 0.3s ease;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                    <span style="font-weight: 600; color: var(--accent-color);">✦ AI認識結果 (精度: ${this.state.aiTags.confidence})</span>
                                </div>
                                <div style="color: var(--text-secondary);">
                                    検出: <strong>${this.state.aiTags.color}の${this.state.aiTags.category}</strong> (${this.state.aiTags.inferredItemName} と推測)
                                </div>
                                <div style="margin-top: var(--space-xs); display: flex; align-items: center; gap: var(--space-xs);">
                                    <span>紐付けるクローゼットアイテム:</span>
                                    <select id="item-matcher" class="input-field" style="width: auto; padding: 2px 8px; font-size: 11px; height: auto;">
                                        ${appState.closetItems.map(item => `
                                            <option value="${item.id}" ${this.state.tempSelectedItems.includes(item.id) ? 'selected' : ''}>
                                                [${item.brand}] ${item.name}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                        ` : ''}

                        <label style="font-size: 11px; display: flex; align-items: center; gap: var(--space-xxs); margin: var(--space-xs) 0; cursor: pointer; color: var(--text-secondary); user-select: none;">
                            <input type="checkbox" id="post-share-community" checked style="width: auto; margin-right: 4px; cursor: pointer; accent-color: var(--accent-color);">
                            Community にも同時に公開して提案を募る
                        </label>

                        <button id="submit-post" class="btn-primary" style="margin-top: auto; justify-content: center;" ${!this.state.selectedImage ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                            Archive に登録
                        </button>
                    </div>
                </div>
            </div>
        `;

        const viewModeToggleHtml = `
            <div class="view-mode-toggle" style="margin-bottom: var(--space-md); align-self: flex-start;">
                <button class="toggle-btn ${this.state.currentViewMode === 'calendar' ? 'active' : ''}" data-mode="calendar">カレンダー表示</button>
                <button class="toggle-btn ${this.state.currentViewMode === 'timeline' ? 'active' : ''}" data-mode="timeline">タイムライン表示</button>
            </div>
        `;

        let mainContentHtml = '';
        if (this.state.currentViewMode === 'calendar') {
            mainContentHtml = `
                ${this.renderCalendarHtml()}
                ${this.renderDetailDrawerHtml()}
            `;
        } else {
            const timelineCards = appState.journalEntries.map(entry => {
                const wornItems = entry.items.map(itemId => appState.closetItems.find(i => i.id === itemId)).filter(Boolean);
                return `
                    <div class="card-item" style="margin-bottom: var(--space-md);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-xs); border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-xxs);">
                            <div>
                                <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${entry.date}</span>
                                <div class="entry-meta" style="margin-top: 2px; display: inline-flex; gap: 4px; margin-left: var(--space-xs);">
                                    <span class="meta-tag" style="font-size: 9px; padding: 1px 4px;">${entry.weather}</span>
                                    <span class="meta-tag" style="font-size: 9px; padding: 1px 4px;">${entry.temp}</span>
                                    <span class="meta-tag" style="font-size: 9px; padding: 1px 4px;">${entry.mood}</span>
                                </div>
                            </div>
                        </div>
                        <div class="entry-content">
                            <div class="entry-image-container">
                                <img src="${entry.image}" alt="Coordinate">
                            </div>
                            <div class="entry-details">
                                <p class="entry-desc">${entry.description}</p>
                                <div class="entry-items" style="margin-top: var(--space-xs);">
                                    <div class="entry-items-title">Worn Items</div>
                                    <div class="items-tag-list">
                                        ${wornItems.map(item => `
                                            <div class="item-tag" style="font-size: 10px; padding: 2px 6px;">
                                                <span style="font-weight: 500;">${item.brand}</span> ${item.name}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            mainContentHtml = `
                <div class="journal-timeline">
                    ${timelineCards.length > 0 ? timelineCards : '<p style="text-align: center; color: var(--text-muted); font-size: 12px; padding: var(--space-md) 0;">投稿がありません。</p>'}
                </div>
            `;
        }

        this.element.innerHTML = `
            <div class="section-title-area">
                <div class="section-title-container">
                    <h2 class="section-title">Coordinate Journal</h2>
                </div>
            </div>
            
            ${postFormHtml}
            
            <div style="margin-top: var(--space-lg); display: flex; flex-direction: column;">
                ${viewModeToggleHtml}
                ${mainContentHtml}
            </div>
        `;

        this.bindEvents();
    }
}
// --- 4. クローゼットビュー・コンポーネント (ClosetView) ---
class ClosetView extends Component {
    constructor(element, props) {
        super(element, props);
        this.state = {
            currentFilter: 'All',
            addMethod: 'manual', // 'manual' (テキスト入力) | 'photo' (写真からAIスキャン)
            isUploading: false,
            selectedImage: null,
            aiTags: null
        };
    }

    /**
     * 画像選択時のクローゼットAI画像認識シミュレータ
     * @param {File} file - アップロードされた画像ファイル
     */
    simulateClosetAiScan(file) {
        this.setState({ isUploading: true, aiTags: null });

        // ローカルプレビュー用の画像読み込み
        const reader = new FileReader();
        reader.onload = (e) => {
            this.state.selectedImage = e.target.result;
            
            // AIスキャン中のローディング効果を演出 (1.5秒待機)
            setTimeout(() => {
                const brands = ['AURALEE', 'COMOLI', 'YOKE', 'Stein', 'Graphpaper', 'Studio Nicholson'];
                const names = ['シルクウール オーバーシャツ', 'リネン ドローストリングパンツ', 'ライトデニム カバーオール', 'レザーベルト シューズ', 'バルカラー ウールコート'];
                const categories = ['Tops', 'Bottoms', 'Outer', 'Shoes'];
                const colors = [
                    { name: 'オフホワイト', code: '#f5f5f4' },
                    { name: 'ブラック', code: '#1c1917' },
                    { name: 'ダークグレー', code: '#44403c' },
                    { name: 'カーキ', code: '#576f72' }
                ];

                const randomBrand = brands[Math.floor(Math.random() * brands.length)];
                const randomName = names[Math.floor(Math.random() * names.length)];
                const randomCategory = categories[Math.floor(Math.random() * categories.length)];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];

                const simulatedTags = {
                    brand: randomBrand,
                    name: randomName,
                    category: randomCategory,
                    color: randomColor.name,
                    colorCode: randomColor.code,
                    confidence: '95.2%'
                };

                this.setState({
                    isUploading: false,
                    aiTags: simulatedTags
                });
            }, 1500);
        };
        reader.readAsDataURL(file);
    }

    render() {
        const appState = this.props.appState;
        const categories = ['All', 'Outer', 'Tops', 'Bottoms', 'Shoes'];
        
        const filteredItems = this.state.currentFilter === 'All' 
            ? appState.closetItems 
            : appState.closetItems.filter(item => item.category === this.state.currentFilter);

        const filterTabsHtml = categories.map(cat => `
            <button class="filter-tab-btn ${this.state.currentFilter === cat ? 'active' : ''}" data-filter="${cat}">
                ${cat}
            </button>
        `).join('');

        const gridHtml = filteredItems.map(item => `
            <div class="closet-card card-item">
                <div class="closet-card-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="closet-card-info">
                    <span class="closet-card-brand">${item.brand}</span>
                    <h3 class="closet-card-name">${item.name}</h3>
                    <div class="closet-card-meta">
                        <span class="closet-card-color">
                            <span class="color-dot" style="background-color: ${item.colorCode};"></span>
                            ${item.color}
                        </span>
                        <span>着用: ${item.timesWorn}回</span>
                    </div>
                </div>
            </div>
        `).join('');

        // 新規登録方式切り替えトグル
        const methodToggleHtml = `
            <div class="view-mode-toggle" style="margin-bottom: var(--space-sm); align-self: flex-start;">
                <button class="toggle-btn ${this.state.addMethod === 'manual' ? 'active' : ''}" data-method="manual">テキストで直接追加</button>
                <button class="toggle-btn ${this.state.addMethod === 'photo' ? 'active' : ''}" data-method="photo">写真からAIスキャンで追加</button>
            </div>
        `;

        let formContentHtml = '';
        if (this.state.addMethod === 'manual') {
            formContentHtml = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--space-xs);">
                    <input type="text" id="add-brand" placeholder="ブランド" class="input-field">
                    <input type="text" id="add-name" placeholder="アイテム名" class="input-field">
                    <select id="add-category" class="input-field">
                        <option value="Tops">Tops</option>
                        <option value="Bottoms">Bottoms</option>
                        <option value="Outer">Outer</option>
                        <option value="Shoes">Shoes</option>
                    </select>
                    <select id="add-color" class="input-field">
                        <option value="オフホワイト" data-code="#f5f5f4">オフホワイト</option>
                        <option value="ブラック" data-code="#1c1917">ブラック</option>
                        <option value="ダークグレー" data-code="#44403c">ダークグレー</option>
                        <option value="カーキ" data-code="#576f72">カーキ</option>
                    </select>
                </div>
                <button id="btn-add-item" class="btn-secondary" style="align-self: flex-end; padding: var(--space-xxs) var(--space-sm); font-size: 11px;">追加する</button>
            `;
        } else {
            formContentHtml = `
                <div class="form-grid" style="margin-top: 0; width: 100%;">
                    <!-- 画像ドラッグ＆ドロップまたはファイル選択 -->
                    <div class="file-dropzone" id="closet-dropzone" style="aspect-ratio: 16/9; max-height: 180px;">
                        ${this.state.isUploading ? `
                            <svg class="animate-spin" viewBox="0 0 24 24" style="animation: spin 1s linear infinite; width:24px; height:24px; stroke:currentColor; stroke-width:1.5; fill:none; margin-bottom:var(--space-xs);">
                                <circle cx="12" cy="12" r="10" stroke="var(--border-color)" stroke-width="2" fill="none"></circle>
                                <path d="M12 2 a10 10 0 0 1 10 10" stroke="var(--accent-color)" stroke-width="3" fill="none"></path>
                            </svg>
                            <p style="font-size: 11px; letter-spacing: 0.1em;">AI SCANNING WARDROBE...</p>
                        ` : this.state.selectedImage ? `
                            <img src="${this.state.selectedImage}" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-sm);">
                        ` : `
                            <svg viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <p>写真をドロップ、またはクリックしてクローゼットに追加</p>
                            <span style="font-size: 10px; color: var(--text-muted); margin-top: var(--space-xxs);">服の写真をAIがスキャンし、自動データ化します</span>
                        `}
                        <input type="file" id="closet-file-input" style="display: none;" accept="image/*">
                    </div>

                    <!-- AI認識結果表示領域 & 登録 -->
                    <div class="form-fields">
                        ${this.state.aiTags ? `
                            <div style="background-color: var(--accent-light); padding: var(--space-sm); border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 12px; display: flex; flex-direction: column; gap: var(--space-xxs); animation: fadeIn 0.3s ease;">
                                <div style="font-weight: 600; color: var(--accent-color); margin-bottom: 2px;">✦ AIスキャン完了 (精度: ${this.state.aiTags.confidence})</div>
                                <div style="display: grid; grid-template-columns: 80px 1fr; gap: var(--space-xxs); align-items: center;">
                                    <span style="color: var(--text-secondary);">ブランド:</span>
                                    <strong><input type="text" id="ai-add-brand" value="${this.state.aiTags.brand}" class="input-field" style="padding: 2px 6px; font-size: 12px; height: auto;"></strong>
                                    <span style="color: var(--text-secondary);">アイテム名:</span>
                                    <strong><input type="text" id="ai-add-name" value="${this.state.aiTags.name}" class="input-field" style="padding: 2px 6px; font-size: 12px; height: auto;"></strong>
                                    <span style="color: var(--text-secondary);">カテゴリ:</span>
                                    <strong>
                                        <select id="ai-add-category" class="input-field" style="padding: 2px 6px; font-size: 12px; height: auto; width: 100%;">
                                            <option value="Tops" ${this.state.aiTags.category === 'Tops' ? 'selected' : ''}>Tops</option>
                                            <option value="Bottoms" ${this.state.aiTags.category === 'Bottoms' ? 'selected' : ''}>Bottoms</option>
                                            <option value="Outer" ${this.state.aiTags.category === 'Outer' ? 'selected' : ''}>Outer</option>
                                            <option value="Shoes" ${this.state.aiTags.category === 'Shoes' ? 'selected' : ''}>Shoes</option>
                                        </select>
                                    </strong>
                                    <span style="color: var(--text-secondary);">カラー:</span>
                                    <strong>
                                        <span class="color-dot" style="background-color: ${this.state.aiTags.colorCode}; display: inline-block; vertical-align: middle; margin-right: 4px;"></span>
                                        ${this.state.aiTags.color}
                                    </strong>
                                </div>
                            </div>
                            <button id="btn-add-ai-item" class="btn-primary" style="justify-content: center; margin-top: auto;">
                                この写真をクローゼットへ登録
                            </button>
                        ` : `
                            <p style="font-size: 12px; color: var(--text-secondary); text-align: center; margin: auto;">
                                写真を選択すると、AIが自動的にブランドやアイテムタイプ、色を検出して登録候補を作成します。
                            </p>
                        `}
                    </div>
                </div>
            `;
        }

        const addItemFormHtml = `
            <div class="card-item" style="margin-bottom: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-sm);">
                <h3 style="font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 2px;">✦ ワードローブの新規登録</h3>
                ${methodToggleHtml}
                ${formContentHtml}
            </div>
        `;

        this.element.innerHTML = `
            <div class="section-title-area">
                <div class="section-title-container">
                    <h2 class="section-title">Digital Closet</h2>
                </div>
            </div>
            
            ${addItemFormHtml}

            <div class="closet-controls">
                <div class="closet-filter-tabs">
                    ${filterTabsHtml}
                </div>
                <span style="font-size: 12px; color: var(--text-secondary);">${filteredItems.length} 個のアイテム</span>
            </div>

            <div class="closet-grid">
                ${gridHtml}
            </div>
        `;

        this.element.querySelectorAll('.filter-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setState({ currentFilter: btn.getAttribute('data-filter') });
            });
        });

        // 1. 新規登録方式（手動・写真AIスキャン）切り替えトグル
        this.element.querySelectorAll('.view-mode-toggle .toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const method = btn.getAttribute('data-method');
                this.setState({ addMethod: method, selectedImage: null, aiTags: null });
            });
        });

        // 2. ドラッグ＆ドロップおよびファイルアップロード処理
        const closetDropzone = this.element.querySelector('#closet-dropzone');
        const closetFileInput = this.element.querySelector('#closet-file-input');

        if (closetDropzone && closetFileInput) {
            closetDropzone.addEventListener('click', () => closetFileInput.click());
            closetDropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                closetDropzone.style.borderColor = 'var(--accent-color)';
                closetDropzone.style.backgroundColor = 'var(--accent-light)';
            });
            closetDropzone.addEventListener('dragleave', () => {
                closetDropzone.style.borderColor = 'var(--border-color)';
                closetDropzone.style.backgroundColor = 'var(--bg-secondary)';
            });
            closetDropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                if (e.dataTransfer.files.length > 0) {
                    this.simulateClosetAiScan(e.dataTransfer.files[0]);
                }
            });
            closetFileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.simulateClosetAiScan(e.target.files[0]);
                }
            });
        }

        // 3. AIスキャン結果からの登録実行
        const addAiBtn = this.element.querySelector('#btn-add-ai-item');
        if (addAiBtn) {
            addAiBtn.addEventListener('click', () => {
                const brandInput = this.element.querySelector('#ai-add-brand');
                const nameInput = this.element.querySelector('#ai-add-name');
                const categorySelect = this.element.querySelector('#ai-add-category');

                const brand = brandInput ? brandInput.value : this.state.aiTags.brand;
                const name = nameInput ? nameInput.value : this.state.aiTags.name;
                const category = categorySelect ? categorySelect.value : this.state.aiTags.category;
                
                const color = this.state.aiTags.color;
                const colorCode = this.state.aiTags.colorCode;
                const image = this.state.selectedImage; // アップロードされたBase64画像をバインド

                const newItem = {
                    id: 'c' + (appState.closetItems.length + 1),
                    name,
                    brand,
                    category,
                    color,
                    colorCode,
                    timesWorn: 0,
                    lastWorn: '未着用',
                    image
                };

                appState.addClosetItem(newItem);
                
                // 登録後にステートを初期化
                this.state = {
                    ...this.state,
                    isUploading: false,
                    selectedImage: null,
                    aiTags: null
                };

                this.props.onStateChange();
            });
        }

        // 4. 手動登録実行
        const addBtn = this.element.querySelector('#btn-add-item');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const brand = this.element.querySelector('#add-brand').value || 'NEW BRAND';
                const name = this.element.querySelector('#add-name').value || '無記名アイテム';
                const category = this.element.querySelector('#add-category').value;
                
                const colorSelect = this.element.querySelector('#add-color');
                const color = colorSelect.value;
                const colorCode = colorSelect.options[colorSelect.selectedIndex].getAttribute('data-code');

                let dummyImg = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400';
                if (category === 'Bottoms') dummyImg = 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400';
                if (category === 'Outer') dummyImg = 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400';
                if (category === 'Shoes') dummyImg = 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400';

                const newItem = {
                    id: 'c' + (appState.closetItems.length + 1),
                    name,
                    brand,
                    category,
                    color,
                    colorCode,
                    timesWorn: 0,
                    lastWorn: '未着用',
                    image: dummyImg
                };

                appState.addClosetItem(newItem);
                this.props.onStateChange();
            });
        }
    }
}

// --- 5. 分析ビュー・コンポーネント (AnalyticsView) ---
class AnalyticsView extends Component {
    render() {
        const appState = this.props.appState;
        
        const colorCounts = {};
        appState.closetItems.forEach(item => {
            colorCounts[item.color] = {
                count: (colorCounts[item.color]?.count || 0) + 1,
                code: item.colorCode
            };
        });

        const totalItems = appState.closetItems.length;
        const colorPaletteHtml = Object.keys(colorCounts).map(colorName => {
            const percentage = ((colorCounts[colorName].count / totalItems) * 100).toFixed(1);
            return `
                <div class="color-palette-segment" style="background-color: ${colorCounts[colorName].code}; flex-grow: ${colorCounts[colorName].count};" title="${colorName}: ${percentage}%"></div>
            `;
        }).join('');

        const colorInfoListHtml = Object.keys(colorCounts).map(colorName => {
            const count = colorCounts[colorName].count;
            return `
                <div class="color-palette-item">
                    <span class="color-dot" style="background-color: ${colorCounts[colorName].code}; width: 14px; height: 14px;"></span>
                    <span><strong>${colorName}</strong>: ${count}点 (${((count / totalItems) * 100).toFixed(0)}%)</span>
                </div>
            `;
        }).join('');

        const deadItems = [...appState.closetItems]
            .sort((a, b) => a.timesWorn - b.timesWorn)
            .slice(0, 3);

        const deadItemsHtml = deadItems.map(item => {
            const lastWornString = item.lastWorn === '未着用' ? '一度も着用されていません' : `最終着用日: ${item.lastWorn}`;
            return `
                <div class="dead-item-row">
                    <div class="dead-item-image">
                        <img src="${item.image}">
                    </div>
                    <div class="dead-item-details">
                        <span style="font-weight: 500;">[${item.brand}] ${item.name}</span>
                        <span class="dead-item-days">${lastWornString} (通算着用: ${item.timesWorn}回)</span>
                    </div>
                </div>
            `;
        }).join('');

        this.element.innerHTML = `
            <div class="section-title-area">
                <div class="section-title-container">
                    <h2 class="section-title">Style Analytics</h2>
                </div>
            </div>

            <div class="analytics-grid">
                <div class="analytics-card card-item">
                    <h3 class="entry-items-title" style="font-size:12px;">Color Palette</h3>
                    <p style="font-size: 11px; color: var(--text-secondary); margin-bottom: var(--space-xs);">
                        クローゼットを占める服の色分布です。無駄な買い足しを防ぎ、調和の取れたワードローブ構築に役立ちます。
                    </p>
                    <div class="color-palette-bar">
                        ${colorPaletteHtml}
                    </div>
                    <div class="color-palette-info">
                        ${colorInfoListHtml}
                    </div>
                </div>

                <div class="analytics-card card-item">
                    <h3 class="entry-items-title" style="font-size:12px; color: var(--accent-color);">✦ Attention</h3>
                    <p style="font-size: 11px; color: var(--text-secondary);">
                        直近で着用頻度の低いアイテムです。AIが「これらのアイテムを用いた新しい着回しパターン」を提案するか、あるいは手放すことを検討させます。
                    </p>
                    <div class="dead-items-list">
                        ${deadItemsHtml}
                    </div>
                    <button class="btn-secondary" style="margin-top: var(--space-sm); font-size:11px; align-self: flex-start;">
                        これらのアイテムの着回しをAIに相談
                    </button>
                </div>
            </div>
        `;
    }
}

// --- 6. コミュニティビュー・コンポーネント (CommunityView) ---
// --- 6. コミュニティビュー・コンポーネント (CommunityView) ---
class CommunityView extends Component {
    constructor(element, props) {
        super(element, props);
        this.state = {
            activeRecommendFeedId: null, // 提案フォームを展開しているパブリックフィードのID
            activeClosetUserHandle: null // 公開クローゼットを展開しているユーザーのハンドル名
        };
    }

    render() {
        const appState = this.props.appState;

        // パブリックフィード（SNSタイムライン）の構築
        const feedHtml = appState.publicFeed.map(feed => {
            // 既にこの投稿に送られた提案一覧
            const suggestionsHtml = feed.suggestions.map(s => `
                <div class="feed-suggestion-item">
                    <div class="feed-suggestion-meta">
                        <span>${s.sender}</span>
                    </div>
                    <p class="feed-suggestion-text">${s.text}</p>
                    ${s.item ? `<span class="feed-suggestion-item-tag">✦ 提案アイテム: ${s.item}</span>` : ''}
                </div>
            `).join('');

            const hasSuggestions = feed.suggestions.length > 0;
            const isRecommendOpen = this.state.activeRecommendFeedId === feed.id;
            
            // 公開クローゼットの展開状態チェック
            const isClosetOpen = this.state.activeClosetUserHandle === feed.userHandle;
            const isFollowed = appState.followedUsers.includes(feed.userHandle);

            // 公開クローゼット（ワードローブ3点）のHTML
            const publicClosetHtml = isClosetOpen && feed.publicCloset ? `
                <div class="public-closet-drawer animate-slide-down">
                    <div class="public-closet-header">
                        <span class="public-closet-title">✦ ${feed.userName} の愛用ワードローブ</span>
                        ${feed.userHandle !== '@my_archive' ? `
                            <button class="btn-follow-toggle ${isFollowed ? 'active' : ''}" data-handle="${feed.userHandle}">
                                ${isFollowed ? 'お気に入り解除' : 'お気に入りに追加'}
                            </button>
                        ` : ''}
                    </div>
                    <div class="public-closet-items">
                        ${feed.publicCloset.map(item => `
                            <div class="public-closet-item-card">
                                <div class="public-closet-img-container">
                                    <img src="${item.image}" alt="${item.name}">
                                </div>
                                <div class="public-closet-item-info">
                                    <span class="brand">${item.brand}</span>
                                    <span class="name">${item.name}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : '';

            return `
                <div class="feed-card" data-id="${feed.id}">
                    <!-- ヘッダー (アバターとユーザー情報) -->
                    <div class="feed-header">
                        <div class="feed-avatar feed-avatar-btn" data-handle="${feed.userHandle}" title="アバターをクリックして公開クローゼットを表示">${feed.avatar}</div>
                        <div class="feed-user-info feed-avatar-btn" data-handle="${feed.userHandle}" style="cursor: pointer;" title="クリックして公開クローゼットを表示">
                            <span class="feed-user-name">${feed.userName}</span>
                            <span class="feed-user-handle">${feed.userHandle} ${isFollowed ? '<span style="color:var(--accent-color); font-size:10px; margin-left:4px;">✦ お気に入り</span>' : ''}</span>
                        </div>
                        <span class="feed-date">${feed.date}</span>
                    </div>

                    <!-- 本文と写真 -->
                    <p class="feed-body-desc">${feed.description}</p>
                    <img class="feed-image" src="${feed.image}" alt="Styling">

                    <!-- メタ情報タグ -->
                    <div class="entry-meta" style="margin-top: 4px;">
                        <span class="meta-tag">${feed.weather}</span>
                        <span class="meta-tag">${feed.temp}</span>
                        <span class="meta-tag">${feed.mood}</span>
                    </div>

                    <!-- アクションバー -->
                    <div class="feed-actions">
                        <button class="feed-action-btn feed-like-btn ${feed.liked ? 'active' : ''} ${feed.likedBySimulator ? 'simulated' : ''}" data-id="${feed.id}">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                            </svg>
                            <span>共鳴 (${feed.likes})</span>
                        </button>
                        <button class="feed-action-btn feed-recommend-btn ${isRecommendOpen ? 'active' : ''}" data-id="${feed.id}">
                            <svg viewBox="0 0 24 24">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>匿名で装いを提案する</span>
                        </button>
                    </div>

                    <!-- 公開クローゼットプレビュー表示 -->
                    ${publicClosetHtml}

                    <!-- 提案一覧表示 -->
                    ${hasSuggestions ? `
                        <div class="feed-suggestions">
                            <h4 style="font-size:10px; text-transform:uppercase; color:var(--text-muted); margin-bottom: var(--space-xxs);">寄せられた装いの提案</h4>
                            ${suggestionsHtml}
                        </div>
                    ` : ''}

                    <!-- 提案フォーム (トグル展開) -->
                    ${isRecommendOpen ? `
                        <div class="feed-recommend-form">
                            <h4 style="font-size:11px; font-weight:600; color:var(--accent-color);">✦ 匿名でコーディネートを提案</h4>
                            <p style="font-size:10px; color:var(--text-secondary);">あなたのクローゼットから、このスタイリングに合わせるアイテムを選択して提案できます。</p>
                            
                            <div style="display:flex; flex-direction:column; gap: var(--space-xs); margin-top:var(--space-xxs);">
                                <select class="input-field select-my-item" style="font-size:12px;">
                                    <option value="">提案するアイテムを選択 (任意)</option>
                                    ${appState.closetItems.map(item => `
                                        <option value="[${item.brand}] ${item.name}">[${item.brand}] ${item.name}</option>
                                    `).join('')}
                                </select>
                                <textarea class="input-field recommend-message" placeholder="組み合わせのアイデアや、この服を推薦する理由を記述..." style="height:60px; font-size:12px; resize:none;"></textarea>
                                <button class="btn-primary btn-send-feed-recommend" data-id="${feed.id}" style="align-self:flex-end; font-size:11px; padding: 4px 12px;">提案を送信</button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        // インボックス (自分に届いた匿名コーディネート提案) の構築
        const receivedHtml = appState.receivedSuggestions.map(s => {
            const entry = appState.journalEntries.find(j => j.id === s.targetEntryId);
            return `
                <div class="card-item suggestion-box" style="margin-bottom: var(--space-xs);">
                    <div class="suggestion-header">
                        <span>${s.date} — 記録 (${entry ? entry.date : '共有した投稿'}) への提案</span>
                        <span style="color: var(--accent-color); font-weight: 500;">匿名ユーザー</span>
                    </div>
                    <div class="suggestion-body">
                        ${s.suggestionText}
                    </div>
                    <div style="margin-top: var(--space-xxs);">
                        <span style="font-size: 10px; color: var(--text-muted);">提案アイテム:</span>
                        <a href="#" class="suggestion-item-link" onclick="event.preventDefault(); alert('提携ブランドのECストア（${s.recommendedItem.brand} 公式）へ遷移するダミー処理です。');">
                            ✦ [${s.recommendedItem.brand}] ${s.recommendedItem.name}
                        </a>
                    </div>
                </div>
            `;
        }).join('');

        // フォロー中（お気に入り共鳴者）アバターリストの構築
        const followedAvatarsHtml = appState.followedUsers.length > 0
            ? appState.followedUsers.map(handle => {
                const feed = appState.publicFeed.find(f => f.userHandle === handle);
                const name = feed ? feed.userName : handle;
                const avatar = feed ? feed.avatar : '?';
                return `
                    <div class="followed-user-badge" data-handle="${handle}" title="${name} (${handle})">
                        <div class="followed-user-avatar">${avatar}</div>
                        <span class="followed-user-name-label">${name.split(' ')[0]}</span>
                    </div>
                `;
            }).join('')
            : '<p style="font-size: 11px; color: var(--text-muted); font-style: italic; padding: var(--space-xxs) 0;">登録されている共鳴者はまだいません。</p>';

        this.element.innerHTML = `
            <div class="section-title-area">
                <div class="section-title-container">
                    <h2 class="section-title">Community & Recommendations</h2>
                </div>
            </div>

            <div class="community-layout">
                <!-- 左カラム: 公開フィード (タイムライン) -->
                <div class="timeline-section">
                    <h3 class="entry-items-title" style="font-size: 11px; margin-bottom: var(--space-xxs);">Public Feed</h3>
                    ${feedHtml}
                </div>

                <!-- 右カラム: インボックス & お気に入り共鳴者 -->
                <div class="suggestions-area">
                    <!-- お気に入り共鳴者（フォロー中） -->
                    <div class="followed-users-section card-item" style="margin-bottom: var(--space-md);">
                        <h3 class="entry-items-title" style="font-size: 11px; margin-bottom: var(--space-xs);">Favorites</h3>
                        <div class="followed-users-list">
                            ${followedAvatarsHtml}
                        </div>
                    </div>

                    <!-- 自分に届いた提案一覧 -->
                    <div class="inbox-section">
                        <h3 class="entry-items-title" style="font-size: 11px; margin-bottom: var(--space-sm);">Inbox</h3>
                        <div class="suggestions-list">
                            ${receivedHtml.length > 0 ? receivedHtml : '<p style="text-align: center; color: var(--text-muted); font-size: 11px; padding: var(--space-md) 0;">届いた提案はありません。</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const appState = this.props.appState;

        // 1. 共鳴 (Like) ボタンのバインド
        this.element.querySelectorAll('.feed-like-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const feedId = btn.getAttribute('data-id');
                appState.toggleFeedLike(feedId);
                this.render(); // 再描画
            });
        });

        // 2. 提案フォームの展開・折りたたみ
        this.element.querySelectorAll('.feed-recommend-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const feedId = btn.getAttribute('data-id');
                const nextId = this.state.activeRecommendFeedId === feedId ? null : feedId;
                this.setState({ activeRecommendFeedId: nextId });
            });
        });

        // 3. 提案の送信
        this.element.querySelectorAll('.btn-send-feed-recommend').forEach(btn => {
            btn.addEventListener('click', () => {
                const feedId = btn.getAttribute('data-id');
                const card = btn.closest('.feed-card');
                const selectItem = card.querySelector('.select-my-item').value;
                const message = card.querySelector('.recommend-message').value;

                if (!message) {
                    alert('提案メッセージを入力してください。');
                    return;
                }

                // 提案オブジェクトの構築
                const suggestion = {
                    sender: '匿名ユーザー (あなた)',
                    text: message,
                    item: selectItem || null
                };

                appState.addSuggestionToFeed(feedId, suggestion);
                
                // 送信完了後、フォームを閉じて再描画
                this.setState({ activeRecommendFeedId: null });
                alert('コーディネート提案を送信しました。');
            });
        });

        // 4. アバターまたはユーザー名クリックによる「公開クローゼット」トグル
        this.element.querySelectorAll('.feed-avatar-btn').forEach(el => {
            el.addEventListener('click', () => {
                const handle = el.getAttribute('data-handle');
                const nextHandle = this.state.activeClosetUserHandle === handle ? null : handle;
                this.setState({ activeClosetUserHandle: nextHandle });
            });
        });

        // 5. フォロー（お気に入り共鳴者）トグルボタンのバインド
        this.element.querySelectorAll('.btn-follow-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // バブル防止
                const handle = btn.getAttribute('data-handle');
                appState.toggleFollowUser(handle);
                this.render(); // 再描画
            });
        });

        // 6. お気に入り共鳴者リスト内のバッジクリックで、その人のクローゼットをタイムライン上でハイライト/トグル
        this.element.querySelectorAll('.followed-user-badge').forEach(badge => {
            badge.addEventListener('click', () => {
                const handle = badge.getAttribute('data-handle');
                // そのユーザーの投稿までスクロールするか、クローゼットをトグル表示する
                const nextHandle = this.state.activeClosetUserHandle === handle ? null : handle;
                this.setState({ activeClosetUserHandle: nextHandle });

                // 対象ユーザーのカードへスクロール
                const targetCard = this.element.querySelector(`.feed-card[data-id] .feed-user-handle`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });
    }
}

// --- 7. 全体のオーケストレーター (App クラス) ---
class App {
    constructor() {
        this.appState = new AppState();
        this.initTheme();
        this.initNavigation();
        this.initComponents();
    }

    /**
     * ダークモード/ライトモードの初期設定
     */
    initTheme() {
        const toggleBtn = document.getElementById('theme-toggle');
        const applyTheme = (theme) => {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            this.appState.theme = theme;
        };

        applyTheme(this.appState.theme);

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const nextTheme = this.appState.theme === 'light' ? 'dark' : 'light';
                applyTheme(nextTheme);
            });
        }
    }

    /**
     * SPAルーティング（タブ切り替え）の初期設定
     */
    initNavigation() {
        const tabsContainer = document.getElementById('nav-tabs');
        
        if (tabsContainer) {
            tabsContainer.addEventListener('click', (e) => {
                const tabBtn = e.target.closest('.nav-tab-btn');
                if (!tabBtn) return;

                const targetTab = tabBtn.getAttribute('data-tab');
                
                tabsContainer.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
                tabBtn.classList.add('active');

                document.querySelectorAll('.view-section').forEach(view => {
                    view.classList.remove('active');
                });
                
                const activeView = document.getElementById(`${targetTab}-view`);
                if (activeView) {
                    activeView.classList.add('active');
                }

                this.appState.currentTab = targetTab;
                this.renderActiveComponent();
            });
        }
    }

    /**
     * 各ビューのコンポーネントクラスをインスタンス化
     */
    initComponents() {
        const onStateChange = () => this.renderActiveComponent();

        this.journalView = new JournalView(document.getElementById('journal-view'), {
            appState: this.appState,
            onStateChange
        });

        this.closetView = new ClosetView(document.getElementById('closet-view'), {
            appState: this.appState,
            onStateChange
        });

        this.analyticsView = new AnalyticsView(document.getElementById('analytics-view'), {
            appState: this.appState,
            onStateChange
        });

        this.communityView = new CommunityView(document.getElementById('community-view'), {
            appState: this.appState,
            onStateChange
        });

        this.renderActiveComponent();
    }

    /**
     * 現在アクティブなコンポーネントのみを再描画する
     */
    renderActiveComponent() {
        switch (this.appState.currentTab) {
            case 'journal':
                this.journalView.render();
                break;
            case 'closet':
                this.closetView.render();
                break;
            case 'analytics':
                this.analyticsView.render();
                break;
            case 'community':
                this.communityView.render();
                break;
        }
    }
}

// ドキュメント読み込み完了時にアプリを起動
document.addEventListener('DOMContentLoaded', () => {
    window.appInstance = new App();
});
