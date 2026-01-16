/**
 * Dice Poker - Core Logic
 */

class DicePoker {
    constructor() {
        this.diceCount = 6;
        this.maxRolls = 3;
        this.rollsLeft = this.maxRolls;
        this.diceValues = Array(this.diceCount).fill(1);
        this.heldDice = Array(this.diceCount).fill(false);
        this.isRolling = false;

        this.diceMap = {
            1: '⚀',
            2: '⚁',
            3: '⚂',
            4: '⚃',
            5: '⚄',
            6: '⚅'
        };

        this.initElements();
        this.bindEvents();
        this.renderDice();
        this.updateUI();
    }

    initElements() {
        this.container = document.getElementById('dice-container');
        this.rollBtn = document.getElementById('roll-button');
        this.resetBtn = document.getElementById('reset-button');
        this.handDisplay = document.getElementById('hand-name');
        this.countDisplay = document.getElementById('roll-count');
    }

    bindEvents() {
        this.rollBtn.addEventListener('click', () => this.rollDice());
        this.resetBtn.addEventListener('click', () => this.resetGame());
    }

    renderDice() {
        this.container.innerHTML = '';
        this.diceValues.forEach((val, idx) => {
            const diceEl = document.createElement('div');
            diceEl.className = `dice ${this.heldDice[idx] ? 'held' : ''}`;
            diceEl.textContent = this.diceMap[val];
            diceEl.addEventListener('click', () => this.toggleHold(idx));
            this.container.appendChild(diceEl);
        });
    }

    toggleHold(index) {
        if (this.isRolling || this.rollsLeft === this.maxRolls || this.rollsLeft === 0) return;
        this.heldDice[index] = !this.heldDice[index];
        this.renderDice();
    }

    async rollDice() {
        if (this.isRolling || this.rollsLeft === 0) return;

        this.isRolling = true;
        this.rollsLeft--;
        this.rollBtn.disabled = true;

        // アニメーション用クラス追加
        const diceEls = this.container.querySelectorAll('.dice');
        diceEls.forEach((el, idx) => {
            if (!this.heldDice[idx]) {
                el.classList.add('rolling');
            }
        });

        // 実際の値を計算（アニメーション中に変更されるように見せる）
        const rollDuration = 600;
        const interval = 50;
        const steps = rollDuration / interval;

        for (let i = 0; i < steps; i++) {
            diceEls.forEach((el, idx) => {
                if (!this.heldDice[idx]) {
                    const randomVal = Math.floor(Math.random() * 6) + 1;
                    el.textContent = this.diceMap[randomVal];
                }
            });
            await new Promise(r => setTimeout(r, interval));
        }

        // 最終的な値を確定
        this.diceValues = this.diceValues.map((val, idx) => {
            return this.heldDice[idx] ? val : Math.floor(Math.random() * 6) + 1;
        });

        this.isRolling = false;
        this.renderDice();
        this.updateUI();
    }

    resetGame() {
        this.rollsLeft = this.maxRolls;
        this.diceValues = Array(this.diceCount).fill(1);
        this.heldDice = Array(this.diceCount).fill(false);
        this.isRolling = false;
        this.renderDice();
        this.updateUI();
    }

    updateUI() {
        this.rollBtn.disabled = this.rollsLeft === 0;
        this.countDisplay.textContent = `残り ${this.rollsLeft} 回`;
        this.handDisplay.textContent = this.evaluateHand();

        if (this.rollsLeft === 0) {
            this.rollBtn.textContent = '終了';
        } else {
            this.rollBtn.textContent = 'ダイスを振る';
        }
    }

    /**
     * 役の判定
     * 6ダイス用のルール:
     * - 6カード: 6つ同じ
     * - 5カード: 5つ同じ
     * - 4カード: 4つ同じ
     * - フルハウス: 3つ + 3つ または 4つ + 2つ
     * - ストレート: 1-6 すべて
     * - 3カード: 3つ同じ
     * - 2ペア: 2つ + 2つ
     * - 1ペア: 2つ同じ
     */
    evaluateHand() {
        // まだ一度も振っていない場合
        if (this.rollsLeft === this.maxRolls) return '運命を待つ';

        const counts = {};
        this.diceValues.forEach(v => counts[v] = (counts[v] || 0) + 1);
        const freq = Object.values(counts).sort((a, b) => b - a);
        const uniqueValues = Object.keys(counts).length;

        if (freq[0] === 6) return 'シックス・オブ・ア・カインド';
        if (freq[0] === 5) return 'ファイブ・オブ・ア・カインド';
        if (uniqueValues === 6) return 'ストレート';
        if (freq[0] === 4 && freq[1] === 2) return 'フルハウス (4-2)';
        if (freq[0] === 3 && freq[1] === 3) return 'フルハウス (3-3)';
        if (freq[0] === 4) return 'フォー・オブ・ア・カインド';
        if (freq[0] === 3 && freq[1] === 2) return 'フルハウス (3-2)';
        if (freq[0] === 3) return 'スリー・オブ・ア・カインド';
        if (freq[0] === 2 && freq[1] === 2 && freq[2] === 2) return 'スリー・ペア';
        if (freq[0] === 2 && freq[1] === 2) return 'ツー・ペア';
        if (freq[0] === 2) return 'ワン・ペア';

        return 'ノー・ハンド';
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    window.game = new DicePoker();
});
