# ⚡ 발전설비 — 비상발전기 용량 산정 PWA
**MANMIN-Ver3.0 · NFTC 602 / NFPC 602 · KDS 31 60 20**

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-blue?logo=github)](https://manminkim-eng.github.io/generator-calc/)
[![PWA Ready](https://img.shields.io/badge/PWA-설치가능-brightgreen)](https://manminkim-eng.github.io/generator-calc/)

---

## 🚀 바로가기

**[⚡ 발전설비 열기 →](https://manminkim-eng.github.io/generator-calc/)**

홈 화면 바로가기 이름: **"발전설비"**

---

## 📱 PWA 설치 방법

| 기기 | 방법 |
|------|------|
| **Android Chrome** | 주소창 `⋮` → **앱 설치** 또는 하단 설치 배너 |
| **iPhone / iPad Safari** | 공유 `↑` → **홈 화면에 추가** |
| **PC Chrome** | 주소창 우측 `⊞` 설치 아이콘 |
| **PC Edge** | 주소창 우측 `...` → **앱으로 설치** |

> 설치 후 홈 화면 바로가기 이름: **발전설비**

---

## 📁 파일 구조

```
generator-calc/
├── index.html          ← 메인 앱 (반응형 · 모든 수정 완료)
├── manifest.json       ← PWA 매니페스트 ("발전설비" 바로가기)
├── sw.js               ← Service Worker (오프라인 캐시)
├── 404.html            ← GitHub Pages SPA 라우팅
├── .nojekyll           ← Jekyll 빌드 차단
├── README.md
└── icons/
    ├── favicon.ico
    ├── icon-16x16.png ~ icon-512x512.png  (12종)
    ├── apple-touch-icon.png
    └── splash-*.png  (4종)
```

---

## ⚙️ GitHub Pages 배포

```bash
# 1. 저장소 생성 (예: generator-calc)
# 2. 이 폴더의 모든 파일 업로드
# 3. Settings → Pages → Source: main / (root)
# 4. 접속: https://<username>.github.io/generator-calc/
```

---

## 🔗 MANMIN 소방설계 계산기 시리즈

| 계산기 | 링크 |
|--------|------|
| 🏠 홈페이지 | [manminkim-eng.github.io/KIMMANMIN](https://manminkim-eng.github.io/KIMMANMIN/) |
| 🚒 옥내소화전 | [fire-hydrant-calc](https://manminkim-eng.github.io/fire-hydrant-calc/) |
| 💧 스프링클러 | [fire-sprinkler-calc](https://manminkim-eng.github.io/fire-sprinkler-calc/) |
| 💨 제연설비 | [Smoke-Control-System](https://manminkim-eng.github.io/Smoke-Control-System/) |
| ⚡ **발전설비** | **현재 저장소** |

---

© MANMIN Engineering (김만민) · MIT License
