/**
 * レンタカー vs カーシェア 損益分岐点計算
 * 厳格なオブジェクト指向プログラミング(OOP)に基づいた実装
 */

/**
 * 料金プランの基底クラス
 */
class BasePlan {
    constructor(provider, planName, distancePrice, fixedFee) {
        this.provider = provider;
        this.planName = planName;
        this.distancePrice = parseFloat(distancePrice) || 0;
        this.fixedFee = parseFloat(fixedFee) || 0;
    }

    /**
     * 合計料金を計算する（サブクラスでオーバーライド）
     * @param {number} hours 利用時間
     * @param {number} distance 走行距離
     */
    calculateTotal(hours, distance) {
        throw new Error("calculateTotal must be implemented");
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(Math.round(amount));
    }
}

/**
 * カーシェアプランの計算クラス
 */
class CarSharePlan extends BasePlan {
    constructor(provider, planName, timeUnitMin, timePrice, distancePrice, fixedFee) {
        super(provider, planName, distancePrice, fixedFee);
        this.timeUnitMin = parseInt(timeUnitMin) || 15;
        this.timePrice = parseFloat(timePrice) || 0;
    }

    calculateTotal(hours, distance) {
        const totalMinutes = hours * 60;
        const timeUnits = Math.ceil(totalMinutes / this.timeUnitMin);
        const timeFee = timeUnits * this.timePrice;
        const distanceFee = distance * this.distancePrice;
        return this.fixedFee + timeFee + distanceFee;
    }
}

/**
 * レンタカープランの計算クラス
 */
class RentalPlan extends BasePlan {
    constructor(provider, planName, baseHours, basePrice, extraHourPrice, distancePrice, fixedFee) {
        super(provider, planName, distancePrice, fixedFee);
        this.baseHours = parseFloat(baseHours) || 0;
        this.basePrice = parseFloat(basePrice) || 0;
        this.extraHourPrice = parseFloat(extraHourPrice) || 0;
    }

    calculateTotal(hours, distance) {
        const extraHours = Math.max(0, Math.ceil(hours - this.baseHours));
        const timeFee = this.basePrice + (extraHours * this.extraHourPrice);
        const distanceFee = distance * this.distancePrice;
        return this.fixedFee + timeFee + distanceFee;
    }
}

/**
 * UIと計算ロジックを制御するマネジャークラス
 */
class AppManager {
    constructor() {
        this.carSharePlans = [];
        this.rentalPlans = [];
        this.initEventListeners();
    }

    initEventListeners() {
        document.getElementById('carshare-csv').addEventListener('change', (e) => this.handleFileUpload(e, 'carshare'));
        document.getElementById('rental-csv').addEventListener('change', (e) => this.handleFileUpload(e, 'rental'));
        document.getElementById('calculate-btn').addEventListener('click', () => this.calculate());
        document.getElementById('load-samples').addEventListener('click', () => this.loadSamples());
    }

    /**
     * CSVファイルを読み込みパースする
     */
    handleFileUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            this.parseCSV(content, type);
        };
        reader.readAsText(file);
    }

    /**
     * 堅牢なCSVパース (空セル、ダブルクォート、エスケープ対応)
     */
    parseCSV(text, type) {
        if (!text) return;
        const rows = text.trim().split(/\r?\n/);
        const data = [];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row) continue;

            const fields = [];
            let currentField = "";
            let inQuotes = false;

            for (let j = 0; j < row.length; j++) {
                const char = row[j];
                const nextChar = row[j + 1];

                if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                        // エスケープされた二重引用符 ("")
                        currentField += '"';
                        j++;
                    } else {
                        // 引用符の開始または終了
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    // 区切り文字
                    fields.push(currentField);
                    currentField = "";
                } else {
                    currentField += char;
                }
            }
            fields.push(currentField); // 最後のフィールドを追加
            data.push(fields);
        }

        if (type === 'carshare') {
            this.carSharePlans = data.map(v => new CarSharePlan(v[0], v[1], v[2], v[3], v[4], v[5]));
            this.updateSelect('carshare-select', this.carSharePlans);
        } else {
            this.rentalPlans = data.map(v => new RentalPlan(v[0], v[1], v[2], v[3], v[4], v[5], v[6]));
            this.updateSelect('rental-select', this.rentalPlans);
        }
    }

    updateSelect(elementId, plans) {
        const select = document.getElementById(elementId);
        select.innerHTML = plans.map((p, i) => `<option value="${i}">${p.provider} - ${p.planName}</option>`).join('');
    }

    loadSamples() {
        const csSample = "provider,plan_name,time_unit_min,time_price_yen,distance_price_yen_per_km,fixed_fee_yen\nTimes,Basic15,15,220,16,0\nAnyca,Lite6h,360,4000,0,500";
        const rentalSample = "provider,plan_name,base_hours,base_price_yen,extra_hour_price_yen,distance_price_yen_per_km,fixed_fee_yen\nNippon,6h,6,6000,1200,0,0\nToyota,Compact12h,12,7500,1500,0,1000";

        this.parseCSV(csSample, 'carshare');
        this.parseCSV(rentalSample, 'rental');
        alert("サンプルデータを読み込みました。");
    }

    calculate() {
        const hours = parseFloat(document.getElementById('input-hours').value);
        const distance = parseFloat(document.getElementById('input-distance').value);
        const csIdx = document.getElementById('carshare-select').value;
        const rtIdx = document.getElementById('rental-select').value;

        if (isNaN(hours) || isNaN(distance) || csIdx === "" || rtIdx === "") {
            alert("利用時間、走行距離を入力し、プランを選択してください。");
            return;
        }

        if (hours < 0 || distance < 0) {
            alert("利用時間および走行距離には0以上の値を入力してください。");
            return;
        }

        const csPlan = this.carSharePlans[csIdx];
        const rtPlan = this.rentalPlans[rtIdx];

        const csPrice = csPlan.calculateTotal(hours, distance);
        const rtPrice = rtPlan.calculateTotal(hours, distance);

        // 表示の更新
        document.getElementById('result-area').style.display = 'block';
        document.getElementById('res-carshare').textContent = csPlan.formatCurrency(csPrice);
        document.getElementById('res-rental').textContent = rtPlan.formatCurrency(rtPrice);

        const verdict = document.getElementById('res-verdict');
        const diff = Math.abs(csPrice - rtPrice);
        if (csPrice < rtPrice) {
            verdict.className = 'verdict win-carshare';
            verdict.textContent = `カーシェアの方が ${csPlan.formatCurrency(diff)} お得です`;
        } else if (rtPrice < csPrice) {
            verdict.className = 'verdict win-rental';
            verdict.textContent = `レンタカーの方が ${rtPlan.formatCurrency(diff)} お得です`;
        } else {
            verdict.className = 'verdict';
            verdict.textContent = '料金は同額です';
        }

        this.findBreakEven(csPlan, rtPlan, hours);
    }

    findBreakEven(csPlan, rtPlan, hours) {
        let breakEvenPoint = null;
        const logContent = document.getElementById('calc-log');
        logContent.innerHTML = '';

        // 初期の優劣を確認 (d=0)
        let csCheaper = csPlan.calculateTotal(hours, 0) <= rtPlan.calculateTotal(hours, 0);

        for (let d = 0; d <= 500; d++) {
            const p1 = csPlan.calculateTotal(hours, d);
            const p2 = rtPlan.calculateTotal(hours, d);
            const currentCsCheaper = p1 <= p2;

            // 逆転の検知
            if (currentCsCheaper !== csCheaper && breakEvenPoint === null) {
                breakEvenPoint = d;
            }

            // ログの追加 (10kmごと+分岐点)
            if (d % 10 === 0 || d === breakEvenPoint) {
                const entry = document.createElement('div');
                entry.className = 'log-entry';
                entry.textContent = `d=${d}km: CS=${Math.round(p1)}円, RT=${Math.round(p2)}円 ${d === breakEvenPoint ? '★逆転★' : ''}`;
                logContent.appendChild(entry);
            }
        }

        const beValue = document.getElementById('res-breakeven');
        if (breakEvenPoint !== null) {
            beValue.textContent = `${breakEvenPoint} km`;
        } else {
            beValue.textContent = "この範囲（0-500km）では逆転なし";
        }
    }
}

// アプリの起動
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppManager();
});
