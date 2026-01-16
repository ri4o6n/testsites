# 計画書: レンタカー vs カーシェア損益分岐点計算アプリ

このドキュメントは、プロジェクトの設計方針と仕様をまとめたものです。

## 1. 概要
ユーザーが利用時間と利用距離を入力することで、事前にアップロードしたCSV（カーシェア/レンタカー各プラン）を元に最適なプランを提案し、距離軸での損益分岐点を算出するWebアプリケーション。

## 2. 構成ファイル
- `index.html`: UI構造（セマンティックHTML）
- `style.css`: プレミアムデザイン（CSS変数によるテーマ管理）
- `app.js`: 計算ロジック及びUI制御（OOP設計）

## 3. クラス設計 (JavaScript)
- `PlanFactory`: CSV行から適切なPlanオブジェクトを生成。
- `CarSharePlan`: カーシェア料金計算ロジック（時間単位切り上げ、距離課金、固定費）。
- `RentalPlan`: レンタカー料金計算ロジック（基本時間、超過料金、距離課金、固定費）。
- `CalculatorEngine`: 二つのプランを比較し、分岐点を探索。
- `UIManager`: DOM操作、CSVパース、計算結果のレンダリング。

## 4. 計算ロジック
- **カーシェア (CarShare)**
  - 時間料金 = `ceil(分 / time_unit_min) * time_price_yen`
  - 距離料金 = `distance * distance_price_yen_per_km`
  - 合計 = `fixed_fee_yen + 時間料金 + 距離料金`
- **レンタカー (Rental)**
  - 時間料金 = `base_price_yen + ceil(max(0, hours - base_hours)) * extra_hour_price_yen`
  - 距離料金 = `distance * distance_price_yen_per_km`
  - 合計 = `fixed_fee_yen + 時間料金 + 距離料金`

## 5. UI/UX デザイン方針
- **カラーテーマ**: 信頼感のあるダーク/ライトモード（デフォルトは洗練されたダークテーマ）。
- **アニメーション**: 結果表示時のフェードインやホバー時のマイクロアニメーション。
- **レスポンシブ**: モバイルファーストで設計。

## 6. 検証プラン
- 0kmから500kmまでの1km刻みの走査が正しく動作することを確認。
- 不正なCSVデータのバリデーション。
- サンプルデータによる即時動作確認。
