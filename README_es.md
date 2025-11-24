# AI Commit

Una potente herramienta CLI que genera mensajes de **Conventional Commits** a partir de tus cambios en git utilizando APIs compatibles con OpenAI.

Deja de luchar con los mensajes de commit. Deja que la IA los escriba por ti: concisos, estandarizados y significativos.

![License](https://img.shields.io/npm/l/@alekschen/ai-commit)
![Version](https://img.shields.io/npm/v/@alekschen/ai-commit)
![Node](https://img.shields.io/node/v/@alekschen/ai-commit)

## Características

- 🤖 **Generación impulsada por IA**: Analiza tu `git diff` para generar mensajes de commit precisos y descriptivos.
- 📏 **Conventional Commits**: Sigue el formato estándar (feat, fix, chore, etc.) desde el primer momento.
- 🌍 **Soporte Multilingüe**: Completamente localizado en **Inglés**, **Chino**, **Japonés**, **Coreano**, **Español** y **Árabe**.
- 🔧 **Altamente Configurable**: Soporte para APIs personalizadas compatibles con OpenAI (DeepSeek, Azure, etc.), modelos personalizados y prompts.
- 📊 **Seguimiento de Costos**: Estadísticas de uso integradas para rastrear tu consumo de tokens y costos.
- 🚀 **Modo Interactivo**: Revisa, edita, regenera o haz commit directamente desde la CLI.
- 🧠 **Contexto Inteligente**: Comprime automáticamente diffs grandes para ajustarse a los límites de tokens mientras preserva el contexto.

## Instalación

Asegúrate de tener Node.js (>= 16.0.0) instalado.

```bash
# Instalar globalmente vía npm
npm install -g @alekschen/ai-commit
```

## Inicio Rápido

1.  **Inicializar Configuración**
    Ejecuta el comando config para configurar tu clave API (OpenAI o proveedor compatible).

    ```bash
    ai-commit config
    ```

2.  **Generar un Commit**
    Prepara tus cambios (stage) y ejecuta:

    ```bash
    git add .
    ai-commit
    ```

    O simplemente ejecuta `ai-commit` y deja que prepare los cambios por ti.

3.  **Revisar y Confirmar**
    La herramienta generará un mensaje. Puedes:
    - **Confirmar**: Hacer commit inmediatamente.
    - **Editar**: Modificar el mensaje en tu editor predeterminado.
    - **Regenerar**: Pedir a la IA que lo intente de nuevo.

## Uso

### Comandos Básicos

```bash
# Generar mensaje de commit para cambios preparados
ai-commit

# Proporcionar una pista para guiar la generación
ai-commit "refactorizar lógica de autenticación"

# Imprimir el mensaje en stdout sin menú interactivo (útil para scripts)
ai-commit --print

# Ejecutar en modo silencioso (suprimir banners/logs)
ai-commit --quiet
```

### Configuración

Gestiona tus ajustes a través del menú interactivo:

```bash
ai-commit config
```

Puedes configurar:

- **Proveedor de API**: Base URL (por defecto: `https://api.openai.com/v1`) y API Key.
- **Modelo**: Elige cualquier modelo de chat (por defecto: `gpt-3.5-turbo`).
- **Estilo de Prompt**: Elige entre plantillas Predeterminada, Emoji, Simple o Personalizada.
- **Idioma**: Cambiar idioma de la interfaz (Inglés, Chino, Japonés, Coreano, Español, Árabe).

### Ver Estadísticas de Uso

Verifica tu uso de API, conteo de tokens y rendimiento del modelo:

```bash
ai-commit cost
```

## Variables de Entorno

Puedes anular la configuración utilizando variables de entorno, útil para pipelines CI/CD:

| Variable | Descripción |
| --- | --- |
| `AI_COMMIT_API_KEY` | Tu API Key |
| `AI_COMMIT_BASE_URL` | Base URL de API personalizada |
| `AI_COMMIT_MODEL` | Nombre del modelo (ej. `gpt-4`, `deepseek-chat`) |
| `AI_COMMIT_MAX_CHARS` | Caracteres máximos para contexto diff (por defecto: 200000) |
| `AI_COMMIT_AUTO_STAGE` | Establecer a `1` para auto-preparar cambios, `0` para fallar si está vacío |

## Contribuir

¡Las contribuciones son bienvenidas! Por favor lee [CONTRIBUTING.md](CONTRIBUTING.md) para detalles sobre nuestro código de conducta y el proceso para enviar pull requests.

1.  Haz un Fork del repositorio
2.  Crea tu rama de funcionalidad (`git checkout -b feature/amazing-feature`)
3.  Haz commit de tus cambios (`git commit -m 'feat: add some amazing feature'`)
4.  Haz Push a la rama (`git push origin feature/amazing-feature`)
5.  Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para más detalles.

