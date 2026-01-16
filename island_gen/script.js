/**
 * Island Coastline Generator
 * アルゴリズム: Simplex Noise + フラクタル（FBM）による円形変形
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const islandPath = document.getElementById('island-path');
    const inputSeed = document.getElementById('seed');
    const inputComplexity = document.getElementById('complexity');
    const inputSize = document.getElementById('size');
    const displaySeed = document.getElementById('seed-val');
    const displayComplexity = document.getElementById('complexity-val');
    const displaySize = document.getElementById('size-val');
    const btnRandomize = document.getElementById('randomize');
    const btnDownload = document.getElementById('download-svg');

    // 初期化
    let simplex = new SimplexNoise(inputSeed.value);

    /**
     * 指定されたパラメータで島の形状（SVGパス）を生成する
     */
    function generateIsland() {
        const seed = parseFloat(inputSeed.value);
        const complexity = parseFloat(inputComplexity.value) / 100;
        const baseSize = parseFloat(inputSize.value);

        const centerX = 500;
        const centerY = 500;
        const points = 200; // 海岸線の頂点数
        const pathData = [];

        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;

            // 円形の基本座標
            const x = Math.cos(angle);
            const y = Math.sin(angle);

            // ノイズによる半径の変位計算（複数オクターブの重ね合わせ）
            // x, y を入力にすることで、始点と終点が一致する（閉じたパスになる）
            let noiseVal = 0;
            let frequency = 0.5 + (complexity * 2);
            let amplitude = 1.0;
            let maxValue = 0;

            // 3層のノイズを重ねる
            for (let o = 0; o < 3; o++) {
                // 入力座標にオフセット（シード）を加える
                noiseVal += simplex.noise2D(x * frequency + seed, y * frequency + seed) * amplitude;
                maxValue += amplitude;
                amplitude *= 0.5;
                frequency *= 2;
            }

            // 0~1の範囲に正規化し、複雑さを適用
            const normalizedNoise = (noiseVal / maxValue + 1) / 2;
            const radius = baseSize * (0.8 + normalizedNoise * 0.4);

            const px = centerX + x * radius;
            const py = centerY + y * radius;

            if (i === 0) {
                pathData.push(`M ${px.toFixed(2)},${py.toFixed(2)}`);
            } else {
                pathData.push(`L ${px.toFixed(2)},${py.toFixed(2)}`);
            }
        }

        pathData.push('Z');
        islandPath.setAttribute('d', pathData.join(' '));
    }

    // イベントリスナーの設定
    const update = () => {
        simplex = new SimplexNoise(inputSeed.value);
        displaySeed.textContent = inputSeed.value;
        displayComplexity.textContent = inputComplexity.value;
        displaySize.textContent = inputSize.value;
        generateIsland();
    };

    inputSeed.addEventListener('input', update);
    inputComplexity.addEventListener('input', update);
    inputSize.addEventListener('input', update);

    btnRandomize.addEventListener('click', () => {
        inputSeed.value = Math.floor(Math.random() * 1000);
        inputComplexity.value = Math.floor(Math.random() * 80) + 10;
        inputSize.value = Math.floor(Math.random() * 200) + 150;
        update();
    });

    btnDownload.addEventListener('click', () => {
        const svg = document.getElementById('island-svg');
        const path = document.getElementById('island-path').cloneNode(true);

        // ダウンロード用の軽量なSVGを作成（背景なし、島のパスのみ）
        const exportSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        exportSvg.setAttribute("viewBox", "0 0 1000 1000");
        exportSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

        // パスを中央に配置する等の処理（現状の座標系を維持）
        exportSvg.appendChild(path);

        const svgData = new XMLSerializer().serializeToString(exportSvg);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const svgUrl = URL.createObjectURL(svgBlob);

        const downloadLink = document.createElement("a");
        downloadLink.href = svgUrl;
        downloadLink.download = `island_seed_${inputSeed.value}.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    });

    // 初回描画
    update();
});
