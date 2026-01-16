/**
 * 呼吸ガイド (4-7-8法) スクリプト
 * 
 * 正確なタイミング制御とUI更新を行う。
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const themeToggle = document.getElementById('themeToggle');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusText = document.getElementById('statusText');
    const counterDisplay = document.getElementById('counter');
    const visualizer = document.getElementById('visualizer');
    const html = document.documentElement;

    // 定数
    const CYCLES = {
        INHALE: { name: 'inhale', text: '鼻から吸って...', duration: 4000 },
        HOLD: { name: 'hold', text: '息を止めて...', duration: 7000 },
        EXHALE: { name: 'exhale', text: '口からゆっくり吐いて...', duration: 8000 }
    };

    // 状態変数
    let isRunning = false;
    let currentPhaseIndex = 0;
    let timerId = null;
    let countIntervalId = null;
    const phases = [CYCLES.INHALE, CYCLES.HOLD, CYCLES.EXHALE];

    /**
     * テーマ切り替え
     */
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
    });

    /**
     * 呼吸サイクルの実行
     */
    function runCycle() {
        if (!isRunning) return;

        const currentPhase = phases[currentPhaseIndex];
        updateUI(currentPhase);

        // 次のフェーズへの遷移
        timerId = setTimeout(() => {
            currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
            runCycle();
        }, currentPhase.duration);
    }

    /**
     * UIの更新
     */
    function updateUI(phase) {
        // ステータスとクラスの更新
        statusText.textContent = phase.text;
        visualizer.className = `visualizer ${phase.name}`;

        // カウントダウンの開始
        startCountdown(phase.duration / 1000);
    }

    /**
     * 秒数のカウント表示
     */
    function startCountdown(seconds) {
        clearInterval(countIntervalId);
        let timeLeft = seconds;
        counterDisplay.textContent = timeLeft;

        countIntervalId = setInterval(() => {
            timeLeft--;
            if (timeLeft >= 0) {
                counterDisplay.textContent = timeLeft;
            } else {
                clearInterval(countIntervalId);
            }
        }, 1000);
    }

    /**
     * ガイドの開始
     */
    startBtn.addEventListener('click', () => {
        isRunning = true;
        currentPhaseIndex = 0;
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        runCycle();
    });

    /**
     * ガイドの停止
     */
    stopBtn.addEventListener('click', () => {
        isRunning = false;
        clearTimeout(timerId);
        clearInterval(countIntervalId);

        // UIのリセット
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        statusText.textContent = '準備完了';
        counterDisplay.textContent = '--';
        visualizer.className = 'visualizer stopped';
    });
});
