document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('image-upload');
    const canvas = document.getElementById('preview-canvas');
    const ctx = canvas.getContext('2d');
    const placeholder = document.getElementById('placeholder');

    // 長辺の最大解像度制限
    const MAX_SIZE = 2048;

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // 解像度制限のリサイズ計算
                let width = img.width;
                let height = img.height;

                if (width > MAX_SIZE || height > MAX_SIZE) {
                    if (width > height) {
                        height = Math.floor((height * MAX_SIZE) / width);
                        width = MAX_SIZE;
                    } else {
                        width = Math.floor((width * MAX_SIZE) / height);
                        height = MAX_SIZE;
                    }
                }

                // Canvasのサイズ設定
                canvas.width = width;
                canvas.height = height;

                // 初期描画 (微弱なブラーをここでかける)
                ctx.filter = 'blur(0.5px)';
                ctx.drawImage(img, 0, 0, width, height);
                ctx.filter = 'none';

                // UI表示の切り替え
                placeholder.style.display = 'none';
                canvas.style.display = 'block';

                // 画像処理パイプライン関数を呼び出す
                applyToyCameraEffect(ctx, width, height);
            };

            img.src = event.target.result;
        };

        reader.readAsDataURL(file);
    });
});

/**
 * トイカメラ風エフェクトを適用する純関数的なアプローチ (ImageData操作)
 */
function applyToyCameraEffect(ctx, width, height) {
    // 1. ピクセルデータの取得
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 各種パラメータ設定 (将来的には外部から渡す設計へ)
    const cx = width / 2;
    const cy = height / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);

    // カラーシフト (Kodak風: 暖色寄り)
    const rOffset = 15;
    const gOffset = 5;
    const bOffset = -15;

    // コントラスト
    const contrast = 1.25;
    const intercept = 128 * (1 - contrast);

    // 彩度
    const saturation = 1.15;

    // ノイズ強度
    const noiseStrength = 25;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // --- (A) コントラストとRGBオフセット ---
        r = r * contrast + intercept + rOffset;
        g = g * contrast + intercept + gOffset;
        b = b * contrast + intercept + bOffset;

        // --- (B) 彩度調整 ---
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        r = luma + saturation * (r - luma);
        g = luma + saturation * (g - luma);
        b = luma + saturation * (b - luma);

        // --- (C) ビネット (周辺減光) ---
        const x = (i / 4) % width;
        const y = Math.floor((i / 4) / width);
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

        let vignette = 1.0 - (dist / maxDist) * 0.7; // 周辺部の暗さ
        vignette = Math.pow(Math.max(0, vignette), 0.8); // 少し緩やかに減衰

        r *= vignette;
        g *= vignette;
        b *= vignette;

        // --- (D) 粒子ノイズ ---
        const noise = (Math.random() - 0.5) * noiseStrength;
        r += noise;
        g += noise;
        b += noise;

        // 値のクランプ (0-255内に収める)
        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
        // data[i+3] はアルファ値 (255のまま)
    }

    // 処理したデータをCanvasに書き戻す
    ctx.putImageData(imageData, 0, 0);
}
