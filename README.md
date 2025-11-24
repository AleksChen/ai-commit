# AI Commit

**[English](README.md) | [简体中文](README_zh.md) | [日本語](README_ja.md) | [한국어](README_ko.md) | [Español](README_es.md) | [العربية](README_ar.md)**

A powerful CLI tool that generates **Conventional Commits** messages from your git changes using OpenAI-compatible APIs.

Stop struggling with commit messages. Let AI write them for you—concise, standardized, and meaningful.

![License](https://img.shields.io/npm/l/@alekschen/ai-commit)
![Version](https://img.shields.io/npm/v/@alekschen/ai-commit)
![Node](https://img.shields.io/node/v/@alekschen/ai-commit)

## Features

- 🤖 **AI-Powered Generation**: Analyzes your `git diff` to generate accurate and descriptive commit messages.
- 📏 **Conventional Commits**: Follows the standard format (feat, fix, chore, etc.) out of the box.
- 🌍 **Multi-Language Support**: Fully localized in **English**, **Chinese**, **Japanese**, **Korean**, **Spanish**, and **Arabic**.
- 🔧 **Highly Configurable**: Support for custom OpenAI-compatible APIs (DeepSeek, Azure, etc.), custom models, and prompts.
- 📊 **Cost Tracking**: Built-in usage statistics to track your token consumption and costs.
- 🚀 **Interactive Mode**: Review, edit, regenerate, or commit directly from the CLI.
- 🧠 **Smart Context**: Automatically compresses large diffs to fit within token limits while preserving context.

## Installation

Ensure you have Node.js (>= 16.0.0) installed.

```bash
# Install globally via npm
npm install -g @alekschen/ai-commit
```

## Quick Start

1.  **Initialize Configuration**
    Run the config command to set up your API key (OpenAI or compatible provider).

    ```bash
    ai-commit config
    ```

2.  **Generate a Commit**
    Stage your changes and run:

    ```bash
    git add .
    ai-commit
    ```

    Or simply run `ai-commit` and let it stage changes for you.

3.  **Review & Commit**
    The tool will generate a message. You can:
    - **Confirm**: Commit immediately.
    - **Edit**: Modify the message in your default editor.
    - **Regenerate**: Ask AI to try again.

## Usage

### Basic Commands

```bash
# Generate commit message for staged changes
ai-commit

# Provide a hint to guide the generation
ai-commit "refactor authentication logic"

# Print the message to stdout without interactive menu (useful for scripts)
ai-commit --print

# Run in quiet mode (suppress banners/logs)
ai-commit --quiet
```

### Configuration

Manage your settings via the interactive menu:

```bash
ai-commit config
```

You can configure:

- **API Provider**: Base URL (default: `https://api.openai.com/v1`) and API Key.
- **Model**: Choose any chat model (default: `gpt-3.5-turbo`).
- **Prompt Style**: Choose from Default, Emoji, Simple, or Custom templates.
- **Language**: Switch UI language (English, Chinese, Japanese, Korean, Spanish, Arabic).

### View Usage Statistics

Check your API usage, token count, and model performance:

```bash
ai-commit cost
```

## Environment Variables

You can override configuration using environment variables, useful for CI/CD pipelines:

| Variable               | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `AI_COMMIT_API_KEY`    | Your API Key                                           |
| `AI_COMMIT_BASE_URL`   | Custom API Base URL                                    |
| `AI_COMMIT_MODEL`      | Model name (e.g., `gpt-4`, `deepseek-chat`)            |
| `AI_COMMIT_MAX_CHARS`  | Max characters for diff context (default: 200000)      |
| `AI_COMMIT_AUTO_STAGE` | Set to `1` to auto-stage changes, `0` to fail if empty |

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
