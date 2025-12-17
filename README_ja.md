# AI Commit

**[English](README.md) | [简体中文](README_zh.md) | [日本語](README_ja.md) | [한국어](README_ko.md) | [Español](README_es.md) | [العربية](README_ar.md)**

OpenAI互換APIを使用して、gitの変更から**Conventional Commits**メッセージを生成する強力なCLIツールです。コミットメッセージに悩むのはもうやめましょう。簡潔で、標準化された、意味のあるメッセージをAIに書いてもらいましょう。**🔒 絶対安全 | 🛡️ プライバシー優先 | 🆓 100% 無料・オープンソース**

![License](https://img.shields.io/npm/l/@alekschen/ai-commit)
![Version](https://img.shields.io/npm/v/@alekschen/ai-commit)
![Node](https://img.shields.io/node/v/@alekschen/ai-commit)

## 特徴

- 🔒 **プライバシー優先**: コードは設定されたAPIプロバイダーに直接送信されます。中間サーバーや追跡はありません。**完全オープンソース**なので、監査も可能です。設定はローカルに保存され、バックドアのない絶対的なセキュリティを保証します。
- 🤖 **AIによる生成**: `git diff`を分析し、正確で説明的なコミットメッセージを生成します。
- 📏 **Conventional Commits**: 標準フォーマット（feat, fix, choreなど）に即座に対応します。
- 🎯 **複数のオプション**: 選択可能な複数のコミットメッセージバリエーションを生成します。
- 🌍 **多言語サポート**: **英語**、**中国語**、**日本語**、**韓国語**、**スペイン語**、**アラビア語**に完全対応。
- 🔧 **高度な設定**: カスタムOpenAI互換API（DeepSeek, Azureなど）、カスタムモデル、プロンプトをサポート。
- 📊 **コスト追跡**: トークン消費量とコストを追跡するための使用統計機能を内蔵。
- 🚀 **インタラクティブモード**: CLIから直接レビュー、編集、再生成、コミットが可能。
- 🧠 **スマートコンテキスト**: コンテキストを保持しながら、トークン制限内に収まるように大きなdiffを自動的に圧縮します。
- 🎨 **楽しいアスキーアート**: 起動バナーをカスタマイズ可能（コダック、トトロ、猫など）。
- 🪝 **Gitフックのサポート**: `prepare-commit-msg`フックとして、または他のGitツールと組み合わせて使用​​できます。

## インストール

Node.js (>= 18.0.0) がインストールされていることを確認してください。

```bash
# npm経由でグローバルにインストール
npm install -g @alekschen/ai-commit
```

## 更新

このツールは自動的に更新をチェックし、新しいバージョンが利用可能な場合に通知します。手動で更新するには：

```bash
npm install -g @alekschen/ai-commit@latest
```

## クイックスタート

1.  **設定の初期化**
    configコマンドを実行してAPIキー（OpenAIまたは互換プロバイダー）を設定します。

    ```bash
    ai-commit config
    ```

    ![How to Set](assets/how-to-set.gif)

2.  **コミットの生成**
    変更をステージングして実行します:

    ```bash
    git add .
    ai-commit
    ```

    または単に `ai-commit` を実行して、変更を自動的にステージングさせることもできます。

    ![How to Use](assets/how-to-use.gif)

3.  **レビューとコミット**
    ツールがメッセージを生成します。以下の操作が可能です:
    - **選択**: 好みのメッセージを選択します。
    - **編集**: デフォルトのエディタでメッセージを修正します。
    - **再生成**: AIにもう一度試行させます。

## 使用法

### 基本コマンド

```bash
# ステージングされた変更に対してコミットメッセージを生成
ai-commit

# 生成をガイドするためのヒントを提供
ai-commit "認証ロジックのリファクタリング"

# インタラクティブメニューなしでメッセージをstdoutに出力（スクリプト用）
ai-commit --print

# メッセージをファイルに書き込む（prepare-commit-msgなどのgitフックに便利）
ai-commit --write .git/COMMIT_EDITMSG

# 静音モードで実行（バナー/ログを抑制）
ai-commit --quiet
```

### 設定

インタラクティブメニューから設定を管理します:

```bash
ai-commit config
```

以下を設定できます:

- **API プロバイダー**: Base URL (デフォルト: `https://api.openai.com/v1`) および API Key。
- **モデル**: 任意のチャットモデルを選択 (デフォルト: `gpt-3.5-turbo`)。
- **プロンプトスタイル**: デフォルト、絵文字、シンプル、またはカスタムテンプレートから選択。
- **ASCIIアート**: 起動バナーをカスタマイズ。
- **言語**: UI言語の切り替え（英語、中国語、日本語、韓国語、スペイン語、アラビア語に対応）。

### 使用統計の表示

APIの使用状況、トークン数、モデルのパフォーマンスを確認します:

```bash
ai-commit cost
```

## 環境変数

環境変数を使用して設定を上書きできます。これはCI/CDパイプラインに役立ちます:

| 変数 | 説明 |
| --- | --- |
| `AI_COMMIT_API_KEY` | あなたの API Key |
| `AI_COMMIT_BASE_URL` | カスタム API Base URL |
| `AI_COMMIT_MODEL` | モデル名 (例: `gpt-4`, `deepseek-chat`) |
| `AI_COMMIT_MAX_CHARS` | diffコンテキストの最大文字数 (デフォルト: 200000) |
| `AI_COMMIT_MAX_FILES` | 処理する最大ファイル数 (デフォルト: 50) |
| `AI_COMMIT_MAX_LINES` | ファイルごとに含める最大行数 (デフォルト: 15) |
| `AI_COMMIT_INCLUDE_SNIPPETS` | `0` に設定すると、プロンプト内のコードスニペットが無効になります |
| `AI_COMMIT_AUTO_STAGE` | `1` に設定すると変更を自動ステージング、`0` で空の場合は失敗 |
| `AI_COMMIT_SIGN` | `1` に設定するとコミットに署名 (`git commit -S`) |
| `AI_COMMIT_AMEND` | `1` に設定するとコミットを修正 (`git commit --amend`) |

## 貢献

貢献は大歓迎です！行動規範やプルリクエストの送信プロセスについては、[CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。

1.  リポジトリをフォークする
2.  機能ブランチを作成する (`git checkout -b feature/amazing-feature`)
3.  変更をコミットする (`git commit -m 'feat: add some amazing feature'`)
4.  ブランチにプッシュする (`git push origin feature/amazing-feature`)
5.  プルリクエストを開く

## ライセンス

このプロジェクトは MIT ライセンスの下でライセンスされています - 詳細は [LICENSE](LICENSE) ファイルをご覧ください。
