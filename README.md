# Gloversal, Inc. — Corporate Website 2026

Gloversal, Inc. のコーポレートサイト。医療・ヘルスケア領域における戦略アドバイザリー、メディカルテクノロジー、事業開発を紹介する公式Webサイト。

- **URL (本番)**: https://www.gloversal.com
- **ホスティング**: Cloudflare Pages
- **初版リリース**: 2026-04-16
- **言語**: 日本語 / 英語（自動検出 + 手動切替）

---

## 目的

旧 Google Sites ベースのサイト (`https://www.gloversal.com/home`) を完全リプレースし、ブランドアイデンティティに沿ったプロフェッショナルなコーポレートサイトを構築する。

### 要件
- 医療×テクノロジー×事業開発をつなぐアドバイザリー企業としてのポジショニング
- JA/EN バイリンガル対応（ブラウザロケール自動検出 + トグル切替）
- ライトモードベース + ダークモード対応
- 全法的ページ（プライバシーポリシー、クッキーポリシー、利用規約、免責事項、法定表示、採用プライバシー）を完備
- フレームワーク不要の Pure HTML/CSS/JS で構築（ビルドステップなし）

---

## アーキテクチャ

### 技術スタック

| レイヤー | 技術 | 備考 |
|---------|------|------|
| マークアップ | HTML5 | セマンティック要素、BEM命名 |
| スタイル | CSS3 Custom Properties | デザイントークン、ライト/ダーク対応 |
| スクリプト | Vanilla JavaScript (ES2020+) | IIFE モジュールパターン、依存ゼロ |
| フォント | Google Fonts (6ファミリー) | Inter, Noto Sans JP, BIZ UDPGothic, IBM Plex Sans, JetBrains Mono, Instrument Serif (装飾用最小限) |
| ホスティング | Cloudflare Pages | 静的サイト、CDN配信 |
| ビルドツール | Python スクリプト (生成用) | 本番デプロイにはビルド不要 |

### ビルドステップなし

`site/` ディレクトリがそのまま本番デプロイ対象。フレームワークやバンドラは使用していない。`build_pages.py` と `build_legal.py` はHTML生成用スクリプトであり、開発時のみ使用する。

---

## デザインシステム

### Gloversal Strategic Light Palette

| カラー | Hex | 用途 |
|--------|-----|------|
| Indigo (Primary) | `#0A165E` | ブランド主色、ヘッダー、フッター、CTA |
| Teal (Secondary) | `#06D6A0` | アクセント、ラベル、ホバー |
| Terra Cotta (Accent) | `#D4A373` | 注意喚起、装飾 |
| Canvas (Background) | `#F9FAFC` | ライトモード背景 |
| Charcoal (Text) | `#1A1D2E` | 本文テキスト |

### タイポグラフィ（2026-04-17 リファイン済み）

**トーン**: Elegant Editorial → **Strategic Editorial Healthcare** へ転換。

| セット | 用途 | フォント | ウェイト |
|--------|------|---------|---------|
| Set A (主軸) | 英語 UI・見出し | Inter | 300–700 |
| Set A (主軸) | 日本語全般 | Noto Sans JP | 400–700 |
| Set B (記事・人物) | 日本語見出し | BIZ UDPGothic | 400–700 |
| Set B (記事・人物) | 英語見出し | IBM Plex Sans | 400–600 |
| 装飾 | ヒーロー `<em>` 等 最小限 | Instrument Serif (italic) | 400 |
| ラベル・コード | モノスペース | JetBrains Mono | 400–500 |

### デザイントーン
- **ストラテジック・エディトリアル**: シャープなボーダー、豊富なホワイトスペース、**サンセリフ主導の見出し**、CTA角丸(10px)、モノスペースラベル
- カスタムカーソル（`mix-blend-mode: difference`）
- IntersectionObserver ベースのスクロールリビールアニメーション

---

## ディレクトリ構成

```
Gloversal_New_Web_2026/
├── README.md                    ← このファイル
├── .gitignore
├── build_pages.py               # 内部ページ6枚の HTML 生成スクリプト
├── build_legal.py               # 法的ページ6枚の HTML 生成スクリプト
├── gloversal_legal_docs_markdown_2026-04-16/
│   ├── 01_privacy_policy_ja.md
│   ├── 02_cookie_policy_ja.md
│   ├── 03_terms_of_use_ja.md
│   ├── 04_disclaimer_ja.md
│   ├── 05_legal_notice_company_info_ja.md
│   └── 06_recruitment_privacy_notice_ja.md
│
├── functions/                   ← Cloudflare Pages Functions（自動検出）
│   └── api/
│       ├── contact.js           # POST /api/contact — Resend API 経由メール送信
│       └── notion.js            # GET /api/notion — Notion DB プロキシ（CMS）
│
└── site/                        ← デプロイ対象（Cloudflare Pages の Build output）
    ├── index.html               # Home（491行）
    ├── about.html               # About / Profile
    ├── services.html            # Services（6サービス詳細）
    ├── case-studies.html        # Case Studies（3ケース）
    ├── case-detail.html         # Case Study 詳細ページ（動的レンダリング）
    ├── insights.html            # Insights / Articles（6記事）
    ├── insight-detail.html      # Insight 詳細ページ（動的レンダリング）
    ├── speaking.html            # Speaking / Activities（6活動）
    ├── speaking-detail.html     # Activity 詳細ページ（動的レンダリング）
    ├── contact.html             # Contact（実働フォーム付き）
    │
    ├── legal/
    │   ├── privacy.html         # プライバシーポリシー
    │   ├── cookies.html         # クッキーポリシー
    │   ├── terms.html           # サイト利用規約
    │   ├── disclaimer.html      # 免責事項
    │   ├── notice.html          # 会社情報・法定表示
    │   └── recruitment.html     # 採用プライバシー
    │
    ├── css/
    │   ├── tokens.css           # デザイントークン（カラー、タイプ、スペーシング、ダークモード）
    │   ├── base.css             # リセット、タイポグラフィ階層、レイアウトヘルパー、reveal
    │   ├── main.css             # 全コンポーネントスタイル
    │   └── responsive.css       # 4ブレークポイント（1200/960/720/480px）
    │
    ├── js/
    │   ├── i18n.js              # JA/EN 辞書（290+キー）— window.__GLV_I18N__
    │   ├── main.js              # Nav, Reveal, Cursor, Theme, I18n, Marquee, SmoothAnchors, ContactForm
    │   ├── content-data.js      # 記事・活動・ケースの埋め込みデータ — window.__GLV_CONTENT__
    │   └── content.js           # 詳細ページレンダラー、Toast、ScrollProgress、CountUp
    │
    └── assets/
        ├── images/
        │   ├── gloversal-logo.png
        │   ├── gloversal-mark.png   # favicon
        │   ├── calactor.png
        │   ├── calactor-hero.png
        │   ├── calactor-wow.png
        │   └── logo-remix.png
        └── video/
            └── hero-loop.mp4
```

---

## ページ一覧

### メインページ（10ページ）

| ページ | ファイル | 内容 |
|--------|---------|------|
| Home | `index.html` | ヒーロー（動画+統計）、マーキー、What I Do、Why Me、サービス8タイル、テーマ、ケーススタディ抜粋、アバウト抜粋、CTAバンド |
| About | `about.html` | ポートレート、提供価値、専門領域、対象クライアント、スタンス、ロール一覧 |
| Services | `services.html` | 6サービスブロック（詳細+対象+アウトプット） |
| Case Studies | `case-studies.html` | 3ケースカード（課題→実施→成果）→ 詳細クリック可 |
| Case Detail | `case-detail.html` | ケーススタディ詳細（`?slug=xxx` で動的レンダリング） |
| Insights | `insights.html` | 6記事カード → 詳細クリック可 |
| Insight Detail | `insight-detail.html` | インサイト記事詳細（`?slug=xxx` で動的レンダリング） |
| Activities | `speaking.html` | 6活動アイテム（講演・メディア・委員会等）→ 詳細クリック可 |
| Activity Detail | `speaking-detail.html` | 活動詳細（`?slug=xxx` で動的レンダリング） |
| Contact | `contact.html` | 実働お問い合わせフォーム（Resend API 経由メール送信） |

### 法的ページ（6ページ）

| ページ | ファイル | 内容 |
|--------|---------|------|
| Privacy Policy | `legal/privacy.html` | 個人情報の取扱い |
| Cookie Policy | `legal/cookies.html` | クッキーの使用方針 |
| Terms of Use | `legal/terms.html` | サイト利用規約 |
| Disclaimer | `legal/disclaimer.html` | 免責事項・医療情報注意 |
| Legal Notice | `legal/notice.html` | 会社情報・法定表示 |
| Recruitment Privacy | `legal/recruitment.html` | 採用応募者向け個人情報通知 |

---

## JavaScript モジュール構成

`main.js` は IIFE 内に以下のモジュールを含む:

| モジュール | 機能 |
|-----------|------|
| `Nav` | スクロール検出 (`is-scrolled`)、ハンバーガーメニュー、現在ページハイライト |
| `Reveal` | IntersectionObserver によるスクロールリビール（`.reveal` → `.is-visible`） |
| `Cursor` | カスタムドット+リングカーソル（lerp追従、ホバー拡大） |
| `Theme` | ライト/ダーク切替、localStorage 永続化 (`glv-theme`) |
| `I18n` | ブラウザロケール自動検出、`data-i18n` テキストバインディング、`data-i18n-attr` 属性バインディング、localStorage 永続化 (`glv-lang`) |
| `Marquee` | innerHTML 複製によるシームレスループ |
| `SmoothAnchors` | `#` リンクのスムーススクロール（nav高さオフセット考慮） |
| `ContactForm` | フォーム送信 → `POST /api/contact` → Toast 通知 |

### `content.js` モジュール（詳細ページ用）

| モジュール | 機能 |
|-----------|------|
| `Toast` | 通知トースト（success / error / info） |
| `ScrollProgress` | ページスクロール進捗バー |
| `CountUp` | 数値カウントアップアニメーション |
| `ContentRenderer` | `?slug=` パラメータで `__GLV_CONTENT__` からコンテンツ描画 |

---

## Cloudflare Pages Functions（サーバーレスAPI）

### POST `/api/contact`
お問い合わせフォームの送信を処理し、Resend API 経由で通知メールを送信する。

### GET `/api/notion`
Notion データベースをプロキシし、Insights / Speaking / Cases のコンテンツを取得する。  
クエリパラメータ: `type=insights|speaking|cases`, `slug=xxx`（任意）。  
`NOTION_API_KEY` 未設定時は `{ ok: false, fallback: true }` を返し、クライアント側で埋め込みデータにフォールバックする。

### 環境変数（Cloudflare Pages Settings → Environment variables）

| 変数名 | 用途 | 必須 |
|--------|------|------|
| `RESEND_API_KEY` | Resend メール送信 API キー | Contact フォーム実働時 |
| `CONTACT_TO_EMAIL` | 通知先メール（デフォルト: info@gloversal.com） | いいえ |
| `NOTION_API_KEY` | Notion Integration トークン | CMS 連携時 |
| `NOTION_DB_INSIGHTS` | Insights データベース ID | CMS 連携時 |
| `NOTION_DB_SPEAKING` | Speaking データベース ID | CMS 連携時 |
| `NOTION_DB_CASES` | Cases データベース ID | CMS 連携時 |

---

## 国際化（i18n）

- **方式**: `data-i18n` 属性 + JavaScript 辞書
- **辞書**: `js/i18n.js` に `window.__GLV_I18N__` として JA/EN 両方を定義
- **キー数**: 290+
- **自動検出**: `navigator.language` から JA/EN を判定
- **手動切替**: ナビゲーションバーの JA/EN トグルボタン
- **永続化**: `localStorage` (`glv-lang`)
- **属性バインディング**: `data-i18n-attr="placeholder:form.name"` 形式で `placeholder` 等の属性も切替可能

---

## レスポンシブ対応

| ブレークポイント | 主な変更 |
|----------------|---------|
| ≤ 1200px | ヒーロー1カラム化、サービスグリッド2列、フッター2列 |
| ≤ 960px | ハンバーガーメニュー表示、全グリッド1カラム化、フォーム1カラム |
| ≤ 720px | システムバー非表示、ロゴ省略表示、カーソル非表示 |
| ≤ 480px | コンテナパディング縮小、ボタンサイズ調整 |

---

## Cloudflare Pages デプロイ設定

### 接続方法
1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. GitHub リポジトリ `rowbeatz/2026_Gloversal_WebSite` を選択

### ビルド設定

| 設定項目 | 値 |
|---------|-----|
| **Framework preset** | `None` |
| **Build command** | _(空欄 — 入力しない)_ |
| **Build output directory** | `site` |
| **Root directory** | `/` _(デフォルト)_ |
| **Build comments** | `Enabled` |

> **重要**: このサイトはビルドステップ不要の静的サイトです。Build command は空欄のまま。`site` ディレクトリが直接デプロイされます。`functions/` ディレクトリ内のファイルは Cloudflare Pages Functions として自動検出・デプロイされます。

### 環境変数（Cloudflare Pages Settings → Environment variables）

| 変数名 | 用途 | 必須 |
|--------|------|------|
| `RESEND_API_KEY` | Resend メール送信 API キー | Contact フォーム実働時 |
| `CONTACT_TO_EMAIL` | 通知先メール（デフォルト: info@gloversal.com） | いいえ |
| `NOTION_API_KEY` | Notion Integration トークン | CMS 連携時 |
| `NOTION_DB_INSIGHTS` | Insights データベース ID | CMS 連携時 |
| `NOTION_DB_SPEAKING` | Speaking データベース ID | CMS 連携時 |
| `NOTION_DB_CASES` | Cases データベース ID | CMS 連携時 |

### カスタムドメイン設定
1. Cloudflare Pages プロジェクト → **Custom domains** → **Set up a custom domain**
2. `www.gloversal.com` を入力
3. DNS が Cloudflare 管理下であれば CNAME が自動設定される
4. SSL/TLS は Cloudflare が自動提供

### プレビューデプロイ
- `main` 以外のブランチへの push で自動的にプレビューURLが生成される
- Build comments が `Enabled` なので、PR にプレビューリンクが自動コメントされる

---

## ローカル開発

```bash
# ローカルサーバー起動
cd site
python -m http.server 8080

# ブラウザで確認
# http://localhost:8080
```

### ページ再生成（必要な場合のみ）

```bash
# 内部ページ6枚を再生成
python build_pages.py

# 法的ページ6枚を再生成（Markdownソースから）
python build_legal.py
```

---

## ブランチ戦略

| ブランチ | 用途 |
|---------|------|
| `main` | 本番（Cloudflare Pages が自動デプロイ） |
| `feature/*` | 機能追加・修正（PR → プレビューデプロイ → マージ） |

---

## 連絡先

- **社内リポジトリ**: https://github.com/rowbeatz/2026_Gloversal_WebSite
- **一般問い合わせ**: info@gloversal.com
- **プライバシー**: privacy@gloversal.com

---

&copy; 2026 Gloversal, Inc. All rights reserved.
