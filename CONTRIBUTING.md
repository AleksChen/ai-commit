# Contributing to ai-commit

Thanks for considering contributing to ai-commit! We welcome contributions from everyone.

## Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/AleksChen/ai-commit.git
    cd ai-commit
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```

## Development Workflow

1.  **Create a branch** for your feature or fix:
    ```bash
    git checkout -b feature/my-awesome-feature
    ```
2.  **Make your changes**.
3.  **Run tests** to ensure everything is working:
    ```bash
    npm test
    ```
4.  **Lint your code** (if applicable):
    ```bash
    npm run lint
    ```

## Project Structure

-   `ai-commit.mjs`: The CLI entry point.
-   `src/`: Source code directory.
    -   `config.js`: Configuration management.
    -   `i18n.js`: Internationalization logic.
    -   `utils.js`: Helper functions (compression, prompt building, etc.).
    -   `locales/`: Language translation files.
-   `tests/`: Unit tests.

## Commit Messages

We use the generated commit messages by this tool itself! But manual commits should follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

-   `feat`: A new feature
-   `fix`: A bug fix
-   `docs`: Documentation only changes
-   `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
-   `refactor`: A code change that neither fixes a bug nor adds a feature
-   `perf`: A code change that improves performance
-   `test`: Adding missing tests or correcting existing tests
-   `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation

## Pull Requests

1.  Push your branch to GitHub.
2.  Open a Pull Request against the `main` branch.
3.  Describe your changes clearly.

Thank you for your contribution!

