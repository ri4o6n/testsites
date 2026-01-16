/**
 * Dice Poker Roguelike - v1.2
 */

class Game {
    constructor() {
        // 基本設定
        this.maxFloor = 10;
        this.diceCount = 6;
        this.diceMap = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' };

        // 役と基本ダメージ
        this.hands = [
            { id: 'straight6', name: 'Straight 6', dmg: 16 },
            { id: 'sixOfAKind', name: 'Six of a Kind', dmg: 15 },
            { id: 'fiveOfAKind', name: 'Five of a Kind', dmg: 13 },
            { id: 'fullHouse33', name: 'Full House (3+3)', dmg: 12 },
            { id: 'fourOfAKind', name: 'Four of a Kind', dmg: 10 },
            { id: 'straight5', name: 'Straight 5', dmg: 9 },
            { id: 'straight4', name: 'Straight 4', dmg: 7 },
            { id: 'allEven', name: 'All Even', dmg: 6 },
            { id: 'allOdd', name: 'All Odd', dmg: 6 },
            { id: 'threeOfAKind', name: 'Three of a Kind', dmg: 5 },
            { id: 'twoPair', name: 'Two Pair', dmg: 4 },
            { id: 'onePair', name: 'One Pair', dmg: 2 },
            { id: 'highCard', name: 'High Card', dmg: 1 }
        ];

        // パークカタログ（データ参照用）
        this.perkCatalog = [
            { id: 'vitality', name: '活力', desc: '最大HP +5。', hooks: { onAfterWin: g => { g.player.maxHp += 5; g.player.hp += 5; } } },
            { id: 'focus', name: '集中', desc: 'キープ可能回数 +1。', hooks: { onAfterWin: g => g.player.keepsBase += 1 } },
            { id: 'luck', name: '強運', desc: 'リロール可能回数 +1。', hooks: { onAfterWin: g => g.player.rerollsBase += 1 } },
            { id: 'power', name: '剛腕', desc: '全てのダメージ +2。', hooks: { onDamageCalc: (g, d) => d + 2 } },
            { id: 'shield', name: '守護', desc: 'ターン開始時に HP 2 回復。', hooks: { onTurnStart: g => g.player.hp = Math.min(g.player.maxHp, g.player.hp + 2) } },
            { id: 'edge', name: '鋭さ', desc: 'ストレート系のダメージ +5。', hooks: { onDamageCalc: (g, d, h) => h.id.includes('straight') ? d + 5 : d } },
            { id: 'heavy', name: '重撃', desc: '4/5/6個の揃い役ダメージ +4。', hooks: { onDamageCalc: (g, d, h) => (h.id.includes('Kind') && !h.id.includes('three')) ? d + 4 : d } },
            { id: 'vampire', name: '吸血', desc: '10以上のダメージを与えると HP 2 回復。', hooks: { onDamageConfirmed: (g, d) => { if (d >= 10) g.player.hp = Math.min(g.player.maxHp, g.player.hp + 2); } } },
            { id: 'sniper', name: '狙撃', desc: '⚅ の目1つにつきダメージ +1。', hooks: { onDamageCalc: (g, d) => d + g.diceValues.filter(v => v === 6).length } },
            { id: 'wall', name: '鉄壁', desc: '受けるダメージ -1。', hooks: { onDamageTaken: (g, d) => Math.max(1, d - 1) } },
            { id: 'wisdom', name: '知恵', desc: 'フロア通過ごとに最大HP +2。', hooks: { onWin: g => { g.player.maxHp += 2; g.player.hp += 2; } } },
            { id: 'berserker', name: '狂戦士', desc: 'HP 10 以下の時、ダメージ +5。', hooks: { onDamageCalc: (g, d) => g.player.hp <= 10 ? d + 5 : d } },
            { id: 'gambler', name: '博徒', desc: '確定時 50%の確率でダメージ +6。', hooks: { onDamageConfirmed: (g, d) => { if (Math.random() < 0.5) { g.addLog("博徒が跳ねた！"); return d + 6; } } } },
            { id: 'thorns', name: '棘', desc: 'ダメージを受けた時、敵に 2 ダメージを返す。', hooks: { onAfterTakenDamage: (g) => { g.enemy.hp -= 2; g.addLog("棘が敵を刺した！"); } } },
            { id: 'scroll', name: '魔導書', desc: '出目の合計ボーナスが2倍。', hooks: { onSumBonusCalc: (g, b, s) => Math.floor(s / 3) } },
            { id: 'pair_master', name: '対の極', desc: 'One Pair / Two Pair のダメージ +4。', hooks: { onDamageCalc: (g, d, h) => h.id.includes('Pair') ? d + 4 : d } },
            { id: 'odd_eye', name: '奇数愛', desc: '全ての目が奇数の時、ダメージ +8。', hooks: { onDamageCalc: (g, d, h) => h.id === 'allOdd' ? d + 8 : d } },
            { id: 'even_eye', name: '偶数愛', desc: '全ての目が偶数の時、ダメージ +8。', hooks: { onDamageCalc: (g, d, h) => h.id === 'allEven' ? d + 8 : d } },
            { id: 'first_shot', name: '速攻', desc: '最初のロールで確定するとダメージ +5。', hooks: { onDamageCalc: (g, d) => g.rollCountThisTurn === 1 ? d + 5 : d } },
            { id: 'survivor', name: '不屈', desc: 'HP 5 以下の時、受けるダメージを半減。', hooks: { onDamageTaken: (g, d) => g.player.hp <= 5 ? Math.ceil(d / 2) : d } }
        ];

        this.init();
    }

    init() {
        // プレイヤー状態
        this.player = {
            hp: 20,
            maxHp: 20,
            perks: [],
            rerollsBase: 2,
            keepsBase: 3
        };

        // ラン状態
        this.floor = 1;
        this.enemy = null;
        this.turn = 0;

        // ターン内リソース
        this.rollsLeft = 0;
        this.keepsLeft = 0;
        this.rollCountThisTurn = 0;
        this.diceValues = Array(this.diceCount).fill(1);
        this.heldDice = Array(this.diceCount).fill(false);
        this.hasRolledThisTurn = false;
        this.isRolling = false;
        this.isGameOver = false;

        this.initDOM();
        this.spawnEnemy();
        this.startTurn();
    }

    initDOM() {
        this.dom = {
            floor: document.getElementById('floor-num'),
            playerHp: document.getElementById('player-hp'),
            playerMaxHp: document.getElementById('player-max-hp'),
            playerHpBar: document.getElementById('player-hp-bar'),
            playerHpBarText: document.getElementById('player-hp-bar-text'),
            enemyName: document.getElementById('enemy-name'),
            enemyHp: document.getElementById('enemy-hp'),
            enemyMaxHp: document.getElementById('enemy-max-hp'),
            enemyHpBar: document.getElementById('enemy-hp-bar'),
            enemyIntent: document.getElementById('enemy-intent'),
            log: document.getElementById('game-log'),
            rolls: document.getElementById('rolls-left'),
            keeps: document.getElementById('keeps-left'),
            diceContainer: document.getElementById('dice-container'),
            handName: document.getElementById('hand-name'),
            predictedDamage: document.getElementById('predicted-damage'),
            perkIcons: document.getElementById('perk-icons'),
            rollBtn: document.getElementById('roll-button'),
            confirmBtn: document.getElementById('confirm-button'),
            overlay: document.getElementById('overlay'),
            overlayTitle: document.getElementById('overlay-title'),
            overlayDesc: document.getElementById('overlay-desc'),
            perkChoices: document.getElementById('perk-choices'),
            nextBtn: document.getElementById('next-button'),
            restartBtn: document.getElementById('restart-button'),
            // ルールブック
            rulebookBtn: document.getElementById('rulebook-btn'),
            rulebookModal: document.getElementById('rulebook-modal'),
            rulebookBody: document.getElementById('rulebook-body'),
            rulebookClose: document.getElementById('rulebook-close')
        };

        this.dom.rollBtn.onclick = () => this.roll();
        this.dom.confirmBtn.onclick = () => this.confirm();
        this.dom.restartBtn.onclick = () => location.reload();
        this.dom.nextBtn.onclick = () => this.nextFloor();

        // ルールブックイベント
        this.dom.rulebookBtn.onclick = () => this.toggleRulebook(true);
        this.dom.rulebookClose.onclick = () => this.toggleRulebook(false);

        this.renderDice();
    }

    spawnEnemy() {
        if (this.floor === 10) {
            this.enemy = {
                name: "VOID EATER (BOSS)",
                hp: 120,
                maxHp: 120,
                atk: 10,
                isBoss: true
            };
        } else {
            const h = 18 + this.floor * 4;
            this.enemy = {
                name: `Enemy Lv.${this.floor}`,
                hp: h,
                maxHp: h,
                atk: 3 + this.floor,
                isBoss: false
            };
        }
        this.addLog(`${this.enemy.name} が現れた！`);
        this.updateUI();
    }

    startTurn() {
        this.turn++;
        this.rollsLeft = this.player.rerollsBase + 1;
        this.keepsLeft = this.player.keepsBase;
        this.rollCountThisTurn = 0;
        this.heldDice = Array(this.diceCount).fill(false);
        this.hasRolledThisTurn = false;

        // ログの強調解除
        const lines = this.dom.log.querySelectorAll('.log-line');
        lines.forEach(l => l.classList.remove('current'));

        // ボス能力 (フロア10)
        if (this.enemy?.isBoss) {
            this.rollsLeft = Math.max(1, this.rollsLeft - 1);
            this.addLog("虚無の圧力でロール回数が削られた。");
        }

        // パーク: onTurnStart
        this.player.perks.forEach(p => p.hooks?.onTurnStart?.(this));

        // HP クランプ
        this.player.hp = Math.min(this.player.maxHp, this.player.hp);

        this.addLog(`ターン ${this.turn} 開始。`);
        this.updateUI();
    }

    renderDice() {
        this.dom.diceContainer.innerHTML = '';
        this.diceValues.forEach((val, idx) => {
            const d = document.createElement('div');
            d.className = `dice ${this.heldDice[idx] ? 'held' : ''}`;
            d.textContent = this.diceMap[val];
            d.onclick = () => this.toggleHold(idx);
            this.dom.diceContainer.appendChild(d);
        });
    }

    toggleHold(idx) {
        if (!this.hasRolledThisTurn || this.rollsLeft === 0 || this.isRolling || this.isGameOver) return;
        if (this.keepsLeft <= 0) {
            this.addLog("キープ回数が足りません！");
            return;
        }

        this.heldDice[idx] = !this.heldDice[idx];
        this.keepsLeft--;
        this.renderDice();
        this.updateUI();
    }

    async roll() {
        if (this.rollsLeft <= 0 || this.isRolling || this.isGameOver) return;

        this.isRolling = true;
        this.hasRolledThisTurn = true;
        this.rollsLeft--;
        this.rollCountThisTurn++;
        this.dom.rollBtn.disabled = true;

        const diceEls = this.dom.diceContainer.querySelectorAll('.dice');
        const steps = 10;
        for (let i = 0; i < steps; i++) {
            diceEls.forEach((el, idx) => {
                if (!this.heldDice[idx]) {
                    const r = Math.floor(Math.random() * 6) + 1;
                    el.textContent = this.diceMap[r];
                }
            });
            await new Promise(r => setTimeout(r, 50));
        }

        this.diceValues = this.diceValues.map((v, idx) => {
            return this.heldDice[idx] ? v : Math.floor(Math.random() * 6) + 1;
        });

        this.isRolling = false;
        this.dom.rollBtn.disabled = false;
        this.renderDice();
        this.updateUI();
    }

    confirm() {
        if (this.isGameOver || this.isRolling) return;
        if (!this.hasRolledThisTurn) {
            this.addLog("まずはロールしてください。");
            return;
        }
        this.resolveAction();
    }

    resolveAction() {
        const { hand, damage } = this.calculateDamage();
        this.addLog(`${hand.name}！ ${damage} ダメージを与えた。`);

        this.enemy.hp -= damage;
        if (this.enemy.hp <= 0) {
            this.enemy.hp = 0;
            this.updateUI();
            this.win();
        } else {
            this.updateUI();
            this.enemyTurn();
        }
    }

    enemyTurn() {
        if (this.isGameOver) return;
        this.addLog(`${this.enemy.name} の攻撃！`);

        let damage = this.enemy.atk;
        // パーク hook: onDamageTaken
        this.player.perks.forEach(p => {
            if (p.hooks?.onDamageTaken) damage = p.hooks.onDamageTaken(this, damage);
        });

        this.player.hp -= damage;
        this.addLog(`${damage} ダメージを受けた。`);

        // パーク hook: onAfterTakenDamage
        this.player.perks.forEach(p => p.hooks?.onAfterTakenDamage?.(this, damage));

        // 反射ダメージなどで敵が倒れたかチェック
        if (this.enemy.hp <= 0) {
            this.enemy.hp = 0;
            this.updateUI();
            this.win();
            return;
        }

        if (this.player.hp <= 0) {
            this.player.hp = 0;
            this.updateUI();
            this.gameOver();
        } else {
            this.startTurn();
        }
    }

    previewDamage() {
        const hand = this.evaluateHand();
        const sumBase = this.diceValues.reduce((a, b) => a + b, 0);
        let sumBonus = Math.floor(sumBase / 6);

        this.player.perks.forEach(p => {
            if (p.hooks?.onSumBonusCalc) sumBonus = p.hooks.onSumBonusCalc(this, sumBonus, sumBase);
        });

        let damage = hand.dmg + sumBonus;

        this.player.perks.forEach(p => {
            if (p.hooks?.onDamageCalc) damage = p.hooks.onDamageCalc(this, damage, hand);
        });

        return { hand, damage };
    }

    calculateDamage() {
        const result = this.previewDamage();
        let totalDamage = result.damage;

        this.player.perks.forEach(p => {
            if (p.hooks?.onDamageConfirmed) {
                totalDamage = p.hooks.onDamageConfirmed(this, totalDamage, result.hand) ?? totalDamage;
            }
        });

        return { hand: result.hand, damage: totalDamage };
    }

    evaluateHand() {
        const counts = {};
        this.diceValues.forEach(v => counts[v] = (counts[v] || 0) + 1);
        const freq = Object.values(counts).sort((a, b) => b - a);
        const vals = Object.keys(counts).map(Number).sort((a, b) => a - b);

        let maxSerial = 1, current = 1;
        for (let i = 1; i < vals.length; i++) {
            if (vals[i] === vals[i - 1] + 1) {
                current++;
                if (current > maxSerial) maxSerial = current;
            } else {
                current = 1;
            }
        }

        if (vals.length === 6 && vals[0] === 1 && vals[5] === 6 && maxSerial === 6) return this.hands[0];
        if (freq[0] === 6) return this.hands[1];
        if (freq[0] === 5) return this.hands[2];
        if (freq[0] === 3 && freq[1] === 3) return this.hands[3];
        if (freq[0] === 4) return this.hands[4];
        if (maxSerial >= 5) return this.hands[5];
        if (maxSerial >= 4) return this.hands[6];
        if (this.diceValues.every(v => v % 2 === 0)) return this.hands[7];
        if (this.diceValues.every(v => v % 2 !== 0)) return this.hands[8];
        if (freq[0] === 3) return this.hands[9];
        if (freq[0] === 2 && freq[1] === 2) return this.hands[10];
        if (freq[0] === 2) return this.hands[11];

        return this.hands[12];
    }

    win() {
        this.isGameOver = true;
        this.addLog(`${this.enemy.name} を倒した！`);

        if (this.floor % 3 === 0) {
            const heal = Math.floor(this.player.maxHp * 0.5);
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
            this.addLog(`休憩により HP が ${heal} 回復した。`);
        }

        this.player.perks.forEach(p => p.hooks?.onWin?.(this));
        this.player.hp = Math.min(this.player.maxHp, this.player.hp);

        if (this.floor === 10) {
            this.showOverlay("VICTORY", "全ての脅威を排除した。世界に静寂が戻る。", false, true);
        } else {
            this.showPerkSelection();
        }
    }

    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    showPerkSelection() {
        this.showOverlay("勝利！", "新たな力を得てください。");
        this.dom.perkChoices.innerHTML = '';
        this.dom.nextBtn.classList.add('hidden');

        const catalog = this.perkCatalog;
        const alreadyHave = this.player.perks.map(p => p.id);
        const available = catalog.filter(p => !alreadyHave.includes(p.id));
        const shuffled = this.shuffle([...available]).slice(0, 3);

        shuffled.forEach(p => {
            const btn = document.createElement('div');
            btn.className = 'perk-btn';
            btn.innerHTML = `<span class="p-name">${p.name}</span><span class="p-desc">${p.desc}</span>`;
            btn.onclick = () => {
                this.player.perks.push(p);
                p.hooks?.onAfterWin?.(this);
                this.addLog(`パーク「${p.name}」を獲得。`);
                this.dom.perkChoices.innerHTML = '';
                this.dom.overlayDesc.textContent = `「${p.name}」を得て、次のフロアへ。`;
                this.dom.nextBtn.classList.remove('hidden');
            };
            this.dom.perkChoices.appendChild(btn);
        });
    }

    nextFloor() {
        this.isGameOver = false;
        this.floor++;
        this.dom.overlay.classList.add('hidden');
        this.spawnEnemy();
        this.turn = 0;
        this.startTurn();
    }

    gameOver() {
        this.isGameOver = true;
        this.showOverlay("GAME OVER", "運命の糸が切れた。", true);
    }

    showOverlay(title, desc, showRestart = false, showClear = false) {
        this.dom.overlay.classList.remove('hidden');
        this.dom.overlayTitle.textContent = title;
        this.dom.overlayDesc.textContent = desc;
        this.dom.perkChoices.innerHTML = '';
        this.dom.nextBtn.classList.add('hidden');
        this.dom.restartBtn.classList.add('hidden');
        this.dom.restartBtn.textContent = "リスタート";

        if (showRestart) this.dom.restartBtn.classList.remove('hidden');
        if (showClear) {
            this.dom.restartBtn.textContent = "最初から遊ぶ";
            this.dom.restartBtn.classList.remove('hidden');
        }
    }

    toggleRulebook(show) {
        if (show) {
            this.renderRulebook();
            this.dom.rulebookModal.classList.remove('hidden');
        } else {
            this.dom.rulebookModal.classList.add('hidden');
        }
    }

    renderRulebook() {
        let html = `
            <div class="rb-section">
                <h3>基本ルール</h3>
                <p>・各ターン、ROLLボタンでダイスを振ります。</p>
                <p>・KEEPS回数の限り、ダイスを固定（キープ）できます。</p>
                <p>・CONFIRMで現在の役に応じたダメージを敵に与えます。</p>
                <p>・攻撃後、敵の反撃を受けます。HPが0になるとゲームオーバーです。</p>
            </div>
            <div class="rb-section">
                <h3>役一覧</h3>
                <ul class="rb-list">
                    ${this.hands.map(h => `
                        <li>
                            <div class="rb-item-head"><span>${h.name}</span><span>DMG: ${h.dmg}</span></div>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div class="rb-section">
                <h3>パーク一覧</h3>
                <ul class="rb-list">
                    ${this.perkCatalog.map(p => `
                        <li>
                            <div class="rb-item-head"><span>${p.name}</span></div>
                            <span class="rb-item-desc">${p.desc}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
        this.dom.rulebookBody.innerHTML = html;
    }

    updateUI() {
        // 基本情報
        this.dom.floor.textContent = this.floor;
        this.dom.playerHp.textContent = this.player.hp;
        this.dom.playerMaxHp.textContent = this.player.maxHp;
        this.dom.enemyName.textContent = this.enemy.name;
        this.dom.enemyHp.textContent = this.enemy.hp;
        this.dom.enemyMaxHp.textContent = this.enemy.maxHp;

        // 敵HPバー
        this.dom.enemyHpBar.style.width = `${(this.enemy.hp / this.enemy.maxHp) * 100}%`;
        this.dom.enemyIntent.textContent = this.enemy.isBoss
            ? `圧力（ロール-1） / 攻撃 (ATK: ${this.enemy.atk})`
            : `攻撃準備中 (ATK: ${this.enemy.atk})`;

        // プレイヤーHPバー
        const p_hpPer = (this.player.hp / this.player.maxHp) * 100;
        this.dom.playerHpBar.style.width = `${p_hpPer}%`;
        this.dom.playerHpBarText.textContent = `${this.player.hp}/${this.player.maxHp}`;
        this.dom.playerHpBar.classList.toggle('warning', p_hpPer < 30);

        // リソース
        this.dom.rolls.textContent = this.rollsLeft;
        this.dom.keeps.textContent = this.keepsLeft;

        // 役とダメージ
        const { hand, damage } = this.previewDamage();
        this.dom.handName.textContent = !this.hasRolledThisTurn ? 'ロール待ち…' : hand.name;
        this.dom.predictedDamage.textContent = `DMG: ${damage}`;

        // パークアイコン
        this.dom.perkIcons.innerHTML = '';
        this.player.perks.forEach(p => {
            const icon = document.createElement('div');
            icon.className = 'perk-icon';
            icon.textContent = p.name[0];
            icon.title = `${p.name}: ${p.desc}`;
            this.dom.perkIcons.appendChild(icon);
        });

        this.dom.rollBtn.disabled = this.rollsLeft === 0 || this.isRolling || this.isGameOver;
    }

    addLog(msg) {
        const line = document.createElement('div');
        line.className = 'log-line current';
        line.textContent = `> ${msg}`;
        this.dom.log.prepend(line);
    }
}

window.onload = () => new Game();
