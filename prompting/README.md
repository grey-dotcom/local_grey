# Prompting CLI

자연어로 로컬 개발 환경을 제어하는 CLI 도구

## 실행

```bash
cd prompting-cli
node cli.js
```

## 명령어

| 명령어 | 설명 |
|--------|------|
| `/help` | 명령어 목록 |
| `/projects` | 프로젝트 목록 보기 |
| `/project [이름]` | 프로젝트 전환 |
| `/history` | 대화 히스토리 보기 |
| `/reset` | 대화 초기화 |
| `/exit` | 종료 |

## 디렉토리 구조

```
prompting/
├── prompting-cli/        ← CLI 엔진
│   ├── cli.js            ← 진입점 + 명령어 처리
│   ├── chat.js           ← Claude API + 멀티턴 히스토리
│   └── context/
│       └── base.js       ← 공통 시스템 프롬프트
│
└── projects/             ← 작업 프로젝트들
    ├── app_screenshot/
    │   └── context.js    ← 프로젝트별 컨텍스트
    ├── project-2/
    └── project-3/
```

## 새 프로젝트 추가

1. `projects/` 아래 폴더 생성
2. `context.js` 파일에 프로젝트 설명 작성
3. `/project [폴더명]` 으로 전환

## 환경변수

`.env` 파일에 API 키 설정:
```
ANTHROPIC_API_KEY=sk-ant-...
```
