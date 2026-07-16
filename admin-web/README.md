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

- ログインは IP ごとに 15 分 8 回で 429（KV ベース、ベストエフォート）。
- トークンは HS256 JWT・24h 失効。Bearer ヘッダ方式なので CSRF 対象外。
- `_headers` で noindex / no-store / X-Frame-Options DENY。robots.txt も拒否。
- さらに固くするなら Cloudflare Zero Trust (Access) をこの Worker の
  ルートに被せる（メール OTP など）— 公開サイト側には影響しない。
- `GH_TOKEN` は Worker Secret（書き込み専用ストア）。fine-grained PAT に
  しておけば漏洩時の影響が単一リポジトリに限定される。

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
