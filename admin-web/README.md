# Gloversal Admin — Web版（Cloudflare Worker）

ローカル Docker 版 admin（`admin/`）の Web 移植。ブラウザだけでどこからでも
ニュース（Insights / Activities / Case Studies）の追加・編集・削除、メディア
アップロード、AI Playground、Build & Deploy ができる。

- **Worker 名**: `gloversal-admin`（本番サイトの Pages プロジェクト
  `2026-gloversal-website` とは完全に別プロジェクト — この Worker を
  いくら更新・削除しても公開サイトには影響しない）
- **URL**: https://gloversal-admin.rowbeatz.workers.dev/admin/login.html
- **API 契約**: ローカル FastAPI 版（`admin/backend/main.py`）と同一

## アーキテクチャ

```
ブラウザ → Worker (gloversal-admin)
             ├─ /admin/*  静的フロントエンド（Workers Assets）
             └─ /api/*    Hono API
                  ├─ Content CRUD ─→ GitHub Contents API
                  │                   └→ site/js/content-data.js に commit
                  │                       └→ CF Pages が自動デプロイ
                  ├─ Build & Deploy ─→ GitHub Actions workflow_dispatch
                  │                     (admin-build-deploy.yml =
                  │                      ローカルと同じ python build チェーン)
                  ├─ Media upload ──→ site/assets/images/uploads/ に commit
                  ├─ Settings ─────→ Workers KV（AI プロバイダキー）
                  └─ Playground ───→ 各 AI プロバイダ API
```

コンテンツ保存 = git commit（履歴が全部残る）。一覧ページへの新規カード掲載は
「Deploy」ボタン（= GitHub Actions ビルド）で反映される。詳細ページ・sitemap・
SEO タグも同じビルドで自動生成。

## Secrets（`wrangler secret put <NAME>` で設定）

| 名前 | 内容 |
|------|------|
| `ADMIN_USER` | ログインユーザー名 |
| `ADMIN_PASS` | ログインパスワード（強力なものを使用） |
| `JWT_SECRET` | セッショントークン署名キー（ランダム 32+ 文字） |
| `GH_TOKEN`   | GitHub トークン。**fine-grained PAT 推奨**: 対象リポジトリ `rowbeatz/2026_Gloversal_WebSite` のみ、権限は Contents: Read/Write + Actions: Read/Write |

`vars`（wrangler.jsonc）: `GH_REPO` / `GH_BRANCH` / `GH_WORKFLOW_FILE`。

## デプロイ

```bash
cd admin-web
npm install
npx wrangler deploy
```

## ローカル開発

```bash
cd admin-web
cp .dev.vars.example .dev.vars   # 値を記入
npx wrangler dev                 # http://localhost:8787
```

## セキュリティメモ

2つの独立レビュー（Claude security-auditor / Codex GPT-5.6-Sol）を経て対応済み:

- **認証**: HS256 JWT・24h 失効、Bearer 方式（CSRF 非該当）。トークンは現
  `ADMIN_USER` に束縛（ユーザー名変更で旧トークン失効）。secrets 未設定なら
  ログインを 503 で fail-closed（空パスワード認証を防止）。認証情報比較は
  定時間 HMAC。
- **公開サイト XSS 対策**（`tools/build_detail_pages.py`）: title/tag/excerpt
  等のプレーンフィールドは全て HTML エスケープ、リッチな `body` は依存ゼロの
  allowlist サニタイザ（`<script>`/`on*=`/`javascript:` 除去）、JSON-LD は
  `</script>` ブレイク不能な unicode エスケープ。
- **入力検証**: create/update は section 対応の型スキーマ検証（不正ペイロード
  でビルドが壊れない）。slug は strict kebab-case（パストラバーサル防止）。
- **SSRF/鍵漏洩対策**: クラウドプロバイダの `base_url` は固定（custom/ollama/
  lmstudio のみ変更可）、プロバイダ呼び出しは `redirect: 'manual'`。
- **Cloudflare Access（有効化済み・一次防御）**: workers.dev ルートに
  Cloudflare Access を適用済み。全リクエストがエッジでメール OTP 認証を要求し、
  ポリシーは `rowbeatz@gmail.com` のみ許可。Worker 側でも Access JWT を検証
  （`CF_ACCESS_TEAM_DOMAIN` + `CF_ACCESS_AUD`、`jose`）＝二層。ログイン導線は
  「Access メール OTP →（アプリの username/password）」の二段。これにより KV
  レート制限の非原子性・総当たり耐性の懸念は実質解消（未認証はアプリに到達不能）。
  team domain = `gloversal.cloudflareaccess.com`。無効化は Worker → Domains →
  該当ルートを Public に戻す（公開サイトには無影響）。
- **全レスポンスにセキュリティヘッダ**: Worker が返す API/リダイレクトにも
  nosniff / X-Frame-Options DENY / no-referrer / no-store / noindex を付与
  （`_headers` は静的アセットのみ対象のため二重化）。
- **レート制限**: IP ごと 15 分 8 回で 429（KV ベース）。Access が前段にあるため
  総当たり経路自体が塞がれている。
- `_headers`: CSP（`connect-src 'self'` でトークン持ち出しを遮断）+ noindex /
  no-store / X-Frame-Options DENY。robots.txt も全拒否。
- `GH_TOKEN` は Worker Secret（書き込み専用ストア）。**fine-grained PAT
  （リポジトリ `2026_Gloversal_WebSite` のみ、Contents RW + Actions RW +
  Metadata R）への差し替え済み/推奨** — 漏洩時の影響を単一リポジトリに限定。
  差し替え手順: GitHub → Settings → Developer settings → Fine-grained tokens
  で発行 → `<新PAT> | npx wrangler secret put GH_TOKEN`（`admin-web/` で実行）。

## ローカル版との違い

| 項目 | ローカル (Docker) | Web (Worker) |
|------|------------------|--------------|
| コンテンツ保存 | ファイル直接書き込み | GitHub commit（即 CF Pages 反映） |
| Build | ローカル python | GitHub Actions（同一スクリプト） |
| Deploy | git push | Actions が push（変更なしなら no-op） |
| メディア上限 | 50MB | 20MB（大きい動画は YouTube 推奨） |
| Ollama / LM Studio | 使用可 | 不可（クラウドから届かないため） |
| 設定保存 | settings.json | Workers KV |
| ケース編集 | num/issue/work/result が消える既知バグ | 未知フィールド保持（修正済み） |
