# 開発プロセス記録 (Process.md)

## 2026-01-16: Skills 雛形の作成

### 概要
エージェントの機能を拡張するための「Skills」の雛形と仮ファイルを作成する。

### 実行内容
- `.agent/skills/template/SKILL.md`: スキル作成の基準となるテンプレートを作成。
- `.agent/skills/hello-world/`
  - [x] ディレクトリ構造の決定と作成
  - [x] `SKILL.md` のテンプレート作成
  - [x] 仮のスキル例（hello-worldなど）の作成
  - [x] Process.md の更新
- 全ての項目が完了。

### 今後の活用
- 新しいツールや特定の制約をエージェントに課したい場合、`template/SKILL.md` をコピーして新しいスキルを定義できます。
