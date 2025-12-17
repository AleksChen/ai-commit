# AI Commit

**[English](README.md) | [简体中文](README_zh.md) | [日本語](README_ja.md) | [한국어](README_ko.md) | [Español](README_es.md) | [العربية](README_ar.md)**

OpenAI 호환 API를 사용하여 git 변경 사항에서 **Conventional Commits** 메시지를 생성하는 강력한 CLI 도구입니다. 커밋 메시지로 고민하지 마세요. AI가 간결하고 표준화되었으며 의미 있는 메시지를 작성해 드립니다. **🔒 절대 안전 | 🛡️ 개인정보 보호 우선 | 🆓 100% 무료 및 오픈소스**

![License](https://img.shields.io/npm/l/@alekschen/ai-commit)
![Version](https://img.shields.io/npm/v/@alekschen/ai-commit)
![Node](https://img.shields.io/node/v/@alekschen/ai-commit)

## 주요 기능

- 🔒 **개인 정보 보호 우선**: 코드는 설정된 API 공급자로 직접 전송됩니다. 중간 서버나 추적은 없습니다. **100% 오픈 소스**이므로 직접 감사할 수 있습니다. 설정은 로컬에 저장되며 백도어 없는 완벽한 보안을 보장합니다.
- 🤖 **AI 기반 생성**: `git diff`를 분석하여 정확하고 설명적인 커밋 메시지를 생성합니다.
- 📏 **Conventional Commits**: 표준 형식(feat, fix, chore 등)을 즉시 지원합니다.
- 🎯 **다양한 옵션**: 선택할 수 있는 여러 커밋 메시지 변형을 생성합니다.
- 🌍 **다국어 지원**: **영어**, **중국어**, **일본어**, **한국어**, **스페인어**, **아랍어**를 완벽하게 현지화 지원합니다.
- 🔧 **높은 설정 자유도**: 사용자 정의 OpenAI 호환 API(DeepSeek, Azure 등), 사용자 정의 모델 및 프롬프트 지원.
- 📊 **비용 추적**: 토큰 소비 및 비용을 추적하는 사용 통계 기능 내장.
- 🚀 **대화형 모드**: CLI에서 직접 검토, 편집, 재생성 또는 커밋할 수 있습니다.
- 🧠 **스마트 컨텍스트**: 컨텍스트를 유지하면서 토큰 제한에 맞게 대규모 diff를 자동으로 압축합니다.
- 🎨 **재미있는 아스키 아트**: 시작 배너 사용자 정의 가능 (고라파덕, 토토로, 고양이 등).
- 🪝 **Git Hook 지원**: `prepare-commit-msg` 훅으로 사용하거나 다른 Git 도구와 함께 사용할 수 있습니다.

## 설치

Node.js (>= 18.0.0)가 설치되어 있는지 확인하십시오.

```bash
# npm을 통한 전역 설치
npm install -g @alekschen/ai-commit
```

## 업데이트

이 도구는 자동으로 업데이트를 확인하고 새 버전이 사용 가능한 경우 알림을 표시합니다. 수동으로 업데이트하려면:

```bash
npm install -g @alekschen/ai-commit@latest
```

## 빠른 시작

1.  **설정 초기화**
    config 명령을 실행하여 API 키(OpenAI 또는 호환 공급자)를 설정합니다.

    ```bash
    ai-commit config
    ```

    ![How to Set](assets/how-to-set.gif)

2.  **커밋 생성**
    변경 사항을 스테이징하고 실행합니다:

    ```bash
    git add .
    ai-commit
    ```

    또는 단순히 `ai-commit`을 실행하여 변경 사항을 자동으로 스테이징하게 할 수 있습니다.

    ![How to Use](assets/how-to-use.gif)

3.  **검토 및 커밋**
    도구가 메시지를 생성합니다. 다음 작업을 수행할 수 있습니다:
    - **선택**: 선호하는 메시지를 선택합니다.
    - **편집**: 기본 편집기에서 메시지를 수정합니다.
    - **재생성**: AI에게 다시 시도하도록 요청합니다.

## 사용법

### 기본 명령어

```bash
# 스테이징된 변경 사항에 대한 커밋 메시지 생성
ai-commit

# 생성을 안내하기 위한 힌트 제공
ai-commit "인증 로직 리팩토링"

# 대화형 메뉴 없이 메시지를 stdout으로 출력 (스크립트용)
ai-commit --print

# 메시지를 파일에 쓰기 (prepare-commit-msg 같은 git 훅에 유용)
ai-commit --write .git/COMMIT_EDITMSG

# 조용한 모드로 실행 (배너/로그 숨김)
ai-commit --quiet
```

### 설정

대화형 메뉴를 통해 설정을 관리합니다:

```bash
ai-commit config
```

다음 항목을 구성할 수 있습니다:

- **API 공급자**: Base URL (기본값: `https://api.openai.com/v1`) 및 API Key.
- **모델**: 채팅 모델 선택 (기본값: `gpt-3.5-turbo`).
- **프롬프트 스타일**: 기본, 이모지, 심플, 또는 사용자 정의 템플릿 중에서 선택.
- **아스키 아트**: 시작 배너 사용자 정의.
- **언어**: UI 언어 전환 (영어, 중국어, 일본어, 한국어, 스페인어, 아랍어 지원).

### 사용 통계 보기

API 사용량, 토큰 수 및 모델 성능을 확인합니다:

```bash
ai-commit cost
```

## 환경 변수

환경 변수를 사용하여 구성을 재정의할 수 있으며, 이는 CI/CD 파이프라인에 유용합니다:

| 변수 | 설명 |
| --- | --- |
| `AI_COMMIT_API_KEY` | API Key |
| `AI_COMMIT_BASE_URL` | 사용자 정의 API Base URL |
| `AI_COMMIT_MODEL` | 모델 이름 (예: `gpt-4`, `deepseek-chat`) |
| `AI_COMMIT_MAX_CHARS` | diff 컨텍스트의 최대 문자 수 (기본값: 200000) |
| `AI_COMMIT_MAX_FILES` | 처리할 최대 파일 수 (기본값: 50) |
| `AI_COMMIT_MAX_LINES` | 파일당 포함할 최대 줄 수 (기본값: 15) |
| `AI_COMMIT_INCLUDE_SNIPPETS` | `0`으로 설정하면 프롬프트에서 코드 조각을 비활성화 |
| `AI_COMMIT_AUTO_STAGE` | `1`로 설정 시 자동 스테이징, `0`일 경우 비어 있으면 실패 |
| `AI_COMMIT_SIGN` | `1`로 설정 시 커밋 서명 (`git commit -S`) |
| `AI_COMMIT_AMEND` | `1`로 설정 시 커밋 수정 (`git commit --amend`) |

## 기여하기

기여는 언제나 환영합니다! 행동 강령 및 풀 리퀘스트 제출 절차에 대한 자세한 내용은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참조하십시오.

1.  저장소 포크
2.  기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3.  변경 사항 커밋 (`git commit -m 'feat: add some amazing feature'`)
4.  브랜치에 푸시 (`git push origin feature/amazing-feature`)
5.  풀 리퀘스트 열기

## 라이선스

이 프로젝트는 MIT 라이선스에 따라 라이선스가 부여됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하십시오.
