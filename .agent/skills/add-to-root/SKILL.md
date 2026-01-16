---
name: add-to-root
description: 新しいツールを追加した際に testsites/index.html へカードを安全に追記する
---

# 対象ファイル
- testsites/index.html

# 現在のHTML構造（前提）
- <main class="projects-grid"> の中に、複数のカードが並ぶ
- カードには2種類ある:
  1) 実ツールカード: <a href="./{slug}/index.html" class="project-card"> ... </a>
  2) Placeholderカード: <div class="project-card" style="border-style: dashed; opacity: 0.5;"> ... </div>
- 追加するカードは「実ツールカード」で、常に Placeholder の直前に挿入する（Placeholder が無い場合は main の末尾に追加）

# 入力パラメータ（skills実行時に与える情報）
- slug: 例 "char_counter"（フォルダ名。リンク先は ./slug/index.html）
- category: 例 "Utility / Writing"
- title: 例 "Character Counter"
- description: 例 "半角・全角・空白・改行・UTF-8バイト数をリアルタイムで計測。"
- optional: comment_label（HTMLコメントのラベル）例 "Character Counter"（未指定なら title を使用）

# 出力（index.htmlに追加するHTMLブロック）
以下のテンプレを生成して挿入する（インデント・改行含めて既存に合わせること）:

            <!-- {comment_label} -->
            <a href="./{slug}/index.html" class="project-card">
                <span class="category">{category}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <div class="card-link">View Application</div>
            </a>

# ルール（重要）
1) 既存の実ツールカードとPlaceholderは削除・変更しない
2) 追加するカードの順序は「既存の実カード群の末尾（ただしPlaceholderの直前）」になる
3) 既に同じ slug の href="./{slug}/index.html" が存在する場合は二重追加しない（代わりにそのカード内容を更新する）
   - 更新対象: category / title / description / comment_label（コメントは置換できるなら置換、難しければコメントは維持でも可）
4) 文字列はHTMLエスケープを考慮（特に description に <, >, & が入っても壊れない）
5) 相対パスは必ず ./{slug}/index.html
6) 失敗時は「何が原因でどこまで処理できたか」を簡潔に返す

# 実装方式（どれでも可）
- Node.js でも Python でもシェルでもよい
- ただしパーサが無いなら、文字列操作で安全に行う:
  - <main class="projects-grid"> ... </main> 範囲を特定
  - その中で Placeholder の開始位置（<div class="project-card" style="border-style: dashed; opacity: 0.5;">）を探し、その直前に挿入
  - Placeholder が見つからなければ </main> の直前に挿入
  - 既存カードの重複チェックは href を検索して判定

# 期待する成果物
- 「新ツール情報を入力 → index.htmlが正しく更新される」こと
- 最低限、以下のテストケースを想定して動作確認すること:
  - A) Placeholderあり（現状）: 直前に挿入される
  - B) Placeholderなし: main末尾に挿入される
  - C) 同slugが既に存在: 二重追加されず、内容更新になる
