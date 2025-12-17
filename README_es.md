# AI Commit

**[English](README.md) | [简体中文](README_zh.md) | [日本語](README_ja.md) | [한국어](README_ko.md) | [Español](README_es.md) | [العربية](README_ar.md)**

Una potente herramienta CLI que genera mensajes de **Conventional Commits** a partir de tus cambios en git utilizando APIs compatibles con OpenAI. Deja de luchar con los mensajes de commit. Deja que la IA los escriba por ti: concisos, estandarizados y significativos. **🔒 Absolutamente Seguro | 🛡️ Privacidad Primero | 🆓 100% Gratis y Código Abierto**

![License](https://img.shields.io/npm/l/@alekschen/ai-commit)
![Version](https://img.shields.io/npm/v/@alekschen/ai-commit)
![Node](https://img.shields.io/node/v/@alekschen/ai-commit)

## Características

- 🔒 **Privacidad Primero**: Tu código se envía directamente a tu proveedor de API configurado. Sin servidores intermedios, sin rastreo. **100% Código Abierto**: audítalo tú mismo. La configuración se almacena localmente, garantizando una seguridad absoluta sin puertas traseras.
- 🤖 **Generación impulsada por IA**: Analiza tu `git diff` para generar mensajes de commit precisos y descriptivos.
- 📏 **Conventional Commits**: Sigue el formato estándar (feat, fix, chore, etc.) desde el primer momento.
- 🎯 **Múltiples Opciones**: Genera múltiples variaciones de mensajes de commit para que elijas.
- 🌍 **Soporte Multilingüe**: Completamente localizado en **Inglés**, **Chino**, **Japonés**, **Coreano**, **Español** y **Árabe**.
- 🔧 **Altamente Configurable**: Soporte para APIs personalizadas compatibles con OpenAI (DeepSeek, Azure, etc.), modelos personalizados y prompts.
- 📊 **Seguimiento de Costos**: Estadísticas de uso integradas para rastrear tu consumo de tokens y costos.
- 🚀 **Modo Interactivo**: Revisa, edita, regenera o haz commit directamente desde la CLI.
- 🧠 **Contexto Inteligente**: Comprime automáticamente diffs grandes para ajustarse a los límites de tokens mientras preserva el contexto.
- 🎨 **Arte ASCII Divertido**: Banner de inicio personalizable (Psyduck, Totoro, Gato, etc.).
- 🪝 **Soporte de Git Hook**: Se puede usar como hook `prepare-commit-msg` o con otras herramientas de git.

## Instalación

Asegúrate de tener Node.js (>= 18.0.0) instalado.

```bash
# Instalar globalmente vía npm
npm install -g @alekschen/ai-commit
```

## Actualización

Esta herramienta verifica automáticamente las actualizaciones y te notificará si hay una nueva versión disponible. Para actualizar manualmente:

```bash
npm install -g @alekschen/ai-commit@latest
```

## Inicio Rápido

1.  **Inicializar Configuración**
    Ejecuta el comando config para configurar tu clave API (OpenAI o proveedor compatible).

    ```bash
    ai-commit config
    ```

    ![How to Set](assets/how-to-set.gif)

2.  **Generar un Commit**
    Prepara tus cambios (stage) y ejecuta:

    ```bash
    git add .
    ai-commit
    ```

    O simplemente ejecuta `ai-commit` y deja que prepare los cambios por ti.

    ![How to Use](assets/how-to-use.gif)

3.  **Revisar y Confirmar**
    La herramienta generará un mensaje. Puedes:
    - **Seleccionar**: Elige tu mensaje preferido.
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

# Escribir mensaje en un archivo (útil para git hooks como prepare-commit-msg)
ai-commit --write .git/COMMIT_EDITMSG

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
- **Arte ASCII**: Personaliza el banner de inicio.
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
| `AI_COMMIT_MAX_FILES` | Máximo de archivos a procesar (por defecto: 50) |
| `AI_COMMIT_MAX_LINES` | Máximo de líneas por archivo a incluir (por defecto: 15) |
| `AI_COMMIT_INCLUDE_SNIPPETS` | Establecer a `0` para deshabilitar fragmentos de código en el prompt |
| `AI_COMMIT_AUTO_STAGE` | Establecer a `1` para auto-preparar cambios, `0` para fallar si está vacío |
| `AI_COMMIT_SIGN` | Establecer a `1` para firmar commits (`git commit -S`) |
| `AI_COMMIT_AMEND` | Establecer a `1` para enmendar commits (`git commit --amend`) |

## Contribuir

¡Las contribuciones son bienvenidas! Por favor lee [CONTRIBUTING.md](CONTRIBUTING.md) para detalles sobre nuestro código de conducta y el proceso para enviar pull requests.

1.  Haz un Fork del repositorio
2.  Crea tu rama de funcionalidad (`git checkout -b feature/amazing-feature`)
3.  Haz commit de tus cambios (`git commit -m 'feat: add some amazing feature'`)
4.  Haz Push a la rama (`git push origin feature/amazing-feature`)
5.  Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para más detalles.
