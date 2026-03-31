# ⚡ 발전설비 — 비상발전기 용량 산정 PWA
**MANMIN-Ver3.0 · NFTC 602 / NFPC 602 · KDS 31 60 20**

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-배포됨-blue?logo=github)](https://manminkim-eng.github.io/generator-calc/)
[![PWA](https://img.shields.io/badge/PWA-설치가능-green?logo=pwa)](https://manminkim-eng.github.io/generator-calc/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 🚀 바로가기

> **[⚡ 발전설비 열기](https://manminkim-eng.github.io/generator-calc/)**
>
> 홈 화면에 "**발전설비**" 이름으로 바로가기 설치 지원 (Android/iOS/PC)

---

## 📱 기기별 PWA 설치 방법

| 기기 | 설치 방법 |
|------|-----------|
| **Android Chrome** | 주소창 우측 `⋮` → **앱 설치** |
| **iPhone / iPad Safari** | 공유 버튼 `↑` → **홈 화면에 추가** |
| **PC Chrome** | 주소창 우측 `⊞` 설치 아이콘 클릭 |
| **PC Edge** | 주소창 우측 `...` → **앱 설치** |

설치 후 바로가기 이름: **"발전설비"**

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| ⚡ 비상발전기 용량 산정 | NFTC 602 기준 kVA 자동 계산 |
| 📋 부하 목록 관리 | 부하 항목 추가/삭제/정렬 |
| 🔗 타 계산기 연동 | URL 파라미터 자동 데이터 수신 |
| 🖨️ A4 계산서 출력 | PDF 저장 / 인쇄 지원 |
| 📴 오프라인 사용 | Service Worker 캐시 |
| 📲 PWA 설치 | 홈화면 바로가기 "발전설비" |

---

## 📐 산정 기준

- **NFTC 602** — 소방시설용 비상전원수전설비의 화재안전기술기준 (소방청공고 제2022-240호)
- **NFPC 602** — 소방시설용 비상전원수전설비의 화재안전성능기준 (소방청고시 제2022-63호)
- **KDS 31 60 20** — 예비전원설비 건설기준 (국토교통부)

---

## 📁 파일 구조

```
generator-calc/
├── index.html          # 메인 앱 (반응형)
├── manifest.json       # PWA 매니페스트 — "발전설비" 바로가기
├── sw.js               # Service Worker (오프라인 캐시)
├── 404.html            # GitHub Pages SPA 라우팅
├── .nojekyll           # Jekyll 빌드 비활성화
├── README.md           # 이 파일
└── icons/
    ├── favicon.ico
    ├── icon-16x16.png ~ icon-512x512.png
    ├── apple-touch-icon.png
    └── splash-*.png
```

---

## 🔗 MANMIN 소방설계 계산기 시리즈

| 계산기 | 링크 |
|--------|------|
| 🏠 만민 소방설계 홈 | [manminkim-eng.github.io](https://manminkim-eng.github.io/) |
| 🚒 옥내소화전 | [fire-hydrant-calc](https://manminkim-eng.github.io/fire-hydrant-calc/) |
| 💧 스프링클러 | [fire-sprinkler-calc](https://manminkim-eng.github.io/fire-sprinkler-calc/) |
| 💨 제연설비 | [Smoke-Control-System](https://manminkim-eng.github.io/Smoke-Control-System/) |
| ⚡ **발전설비** | **현재 페이지** |

---

## ⚙️ GitHub Pages 배포 방법

```bash
# 1. 저장소 생성: generator-calc
# 2. 파일 업로드
# 3. Settings → Pages → Source: main branch / root
# 4. 접속: https://[username].github.io/generator-calc/
```

---

## 📄 라이선스

MIT License · © 2024 MANMIN Engineering (김만민)

---

<div align="center">
  <sub>⚡ MANMIN-Ver3.0 · NFTC 602 비상발전기 용량 산정 PWA</sub>
</div>
