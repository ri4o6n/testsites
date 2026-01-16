/**
 * 文字数カウンター アプリケーションロジック
 */

class TextAnalyzer {
    /**
     * テキストを解析し、各種カウント結果を返す
     * @param {string} text 解析対象のテキスト
     * @returns {Object} カウント結果
     */
    static analyze(text) {
        // CRLFをLFに正規化
        const normalizedText = text.replace(/\r\n/g, '\n');
        
        // 文字列をUnicodeコードポイントの配列に変換（サロゲートペアを正しく扱う）
        const chars = Array.from(normalizedText);
        
        const result = {
            totalChars: chars.length,
            fullWidthChars: 0,
            halfWidthChars: 0,
            halfSpaces: 0,
            fullSpaces: 0,
            lineBreaks: 0,
            lineCount: 0,
            byteCount: 0
        };

        // バイト数計算 (UTF-8)
        result.byteCount = new TextEncoder().encode(normalizedText).length;

        // 改行数と行数
        if (normalizedText === '') {
            result.lineCount = 1;
        } else {
            const lines = normalizedText.split('\n');
            result.lineBreaks = lines.length - 1;
            result.lineCount = lines.length;
        }

        // 文字ごとの判定
        for (const char of chars) {
            if (char === ' ') {
                result.halfSpaces++;
                result.halfWidthChars++;
            } else if (char === '　') {
                result.fullSpaces++;
                result.fullWidthChars++;
            } else if (char === '\n') {
                // 改行は文字数に含めるが、全角・半角判定からは除外する場合も多い
                // 今回は要件に従い「全文字数」には含める
            } else {
                if (this.isFullWidth(char)) {
                    result.fullWidthChars++;
                } else {
                    result.halfWidthChars++;
                }
            }
        }

        return result;
    }

    /**
     * 文字が全角かどうかを判定する (East Asian Widthの簡易実装)
     * @param {string} char 判定する1文字
     * @returns {boolean} 全角ならtrue
     */
    static isFullWidth(char) {
        const code = char.charCodeAt(0);
        
        // 半角ASCIIおよび半角カタカナの範囲外を全角とみなす簡易判定
        // 本来はユニコードの範囲を細かく見る必要があるが、一般的な日本語用途ではこれで十分なことが多い
        if ((code >= 0x0000 && code <= 0x007e) || // ASCII
            (code === 0x00a5) || // Yen symbol
            (code === 0x203e) || // Overline
            (code >= 0xff61 && code <= 0xff9f) // half-width katakana
        ) {
            return false;
        }
        return true;
    }
}

/**
 * UI制御
 */
document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('textInput');
    const displayIds = {
        totalChars: 'totalChars',
        fullWidthChars: 'fullWidthChars',
        halfWidthChars: 'halfWidthChars',
        halfSpaces: 'halfSpaces',
        fullSpaces: 'fullSpaces',
        lineBreaks: 'lineBreaks',
        lineCount: 'lineCount',
        byteCount: 'byteCount'
    };

    const updateResults = () => {
        const text = textInput.value;
        const results = TextAnalyzer.analyze(text);

        for (const [key, id] of Object.entries(displayIds)) {
            const element = document.getElementById(id);
            if (element) {
                // アニメーション効果なし、即座に更新 (ミニマル)
                element.textContent = results[key].toLocaleString();
            }
        }
    };

    // 入力イベントでリアルタイム更新
    textInput.addEventListener('input', updateResults);
    
    // 初期表示
    updateResults();
});
