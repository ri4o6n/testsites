# Process: Local Supporter Finder

## 2026-01-21: 設計フェーズ開始

### 1. プロジェクト概要
家族が代理で地域のサポーターを探すための入口となるMVPサイトの構築。
「生活空間に溶け込む、静かで上質なツール」というデザイン思想を体現する。

### 2. デザイン方針
- **静寂とミニマリズム**: 派手な装飾を排し、余白とタイポグラフィで情報を伝える。
- **グローバルテーマ**: `theme.css` で色、フォント、間隔を厳格に管理。
- **アクセントカラー**: 彩度を抑えた寒色系（例: #5A7D9A / Slate Blue）を1色のみ使用。
- **カードデザイン**: 強い影ではなく、繊細な境界線と余白で表現。

### 3. 技術設計
- **vanilla-js**: OOP原則に基づき、UI ComponentとData Managementを分離。
- **supporters.json**: 静的なJSONファイルをデータソースとし、フロントエンドで検索・フィルタリングを行う。
- **Responsive**: モバイルファーストで、どのデバイスでも「静か」な体験を。

### 4. ディレクトリ構成
```
local-supporter-finder/
├── index.html       (Search)
├── about.html       (Concept)
├── service.html     (Guidelines)
├── apply.html       (Recruitment)
├── assets/
│   ├── theme.css    (Global variables)
│   ├── style.css    (Base styles)
│   └── app.js       (Logic/OOP)
└── data/
    └── supporters.json (Data)
```

### 2026-01-22: 詳細表示機能の実装

#### 目的
サポーターカードの「詳細を見る」ボタンから、個別の詳細情報を閲覧できるようにする。
ページ遷移を避け、サイトの「静かさ」を維持するために、滑らかなアニメーションを伴うモーダル形式を採用。

#### 表示項目（予定）
- 自己紹介文（長文）
- 得意なことの深掘り
- 対応可能な時間の目安
- 安心ポイント（本人確認状況、活動実績など：MVP用サンプル）
- 相談ボタン（応募ページへの誘導）
