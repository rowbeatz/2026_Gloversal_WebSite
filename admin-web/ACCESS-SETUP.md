# gloversal-admin — Cloudflare Access 有効化ウィザード

管理 Worker(`gloversal-admin`)を「Yoshi だけが到達できる隠しサイト」にする最終ステップ。
JWT ログインは残したまま、その手前に Cloudflare Access(Zero Trust)を被せる二層防御にする。

> **順序が重要**: STEP 2(エージェント E2E 検証)が終わる前に Access を有効化すると
> エージェントの HTTP 検証が塞がれる。上から順に。

## STEP 1 — パスワード受け渡し(Yoshi)

`ADMIN_PASS` の値を次のファイルに保存(1 行・改行なし・ASCII):

```
D:\Claude_Cowork\Gloversal_New_Web_2026\.secrets\GLOVERSAL_ADMIN_PASS.txt
```

`.secrets/` は .gitignore 済み — コミットされない。ADMIN_USER が既定値でない場合は
`GLOVERSAL_ADMIN_USER.txt` も同様に置く。

## STEP 2 — E2E 検証(エージェント)

エージェントが実施: login → コンテンツ一覧 → テスト記事 create → editor で確認 →
delete → (任意) Deploy ボタンの workflow_dispatch 疎通。結果を報告して STEP 3 へ。

## STEP 3 — workers.dev に Access を有効化(Yoshi・1 分)

1. https://dash.cloudflare.com → **Workers & Pages** → **gloversal-admin**
2. **Settings** → **Domains & Routes** → `gloversal-admin.rowbeatz.workers.dev` の行の
   **…メニュー → Enable Cloudflare Access**
3. 自動で Access アプリケーションが作られる。**Manage Cloudflare Access** リンクから
   Zero Trust ダッシュボードを開き、ポリシーを確認:
   - **Allow**: Include → Emails → `rowbeatz@gmail.com`(既定で追加されるログイン方法
     は One-time PIN — そのままで OK)
   - それ以外の Include ルールが付いていたら削除(自分のメールのみに絞る)

## STEP 4 — エージェント用 Service Token(任意・LifeLink と共用)

Access 有効化後もエージェントが運用検証できるようにする場合:

1. Zero Trust → **Access → Service Auth → Service Tokens → Create Service Token**
   - Name: `claude-agent`(**LifeLink 用に作る物と同一トークンを共用** — 既に作成済み
     ならそれを使う。新規作成した場合は Client ID / Secret を
     `LifeLink-Insights-WEB\.secrets\CF_ACCESS_CLIENT_ID.txt` / `CF_ACCESS_CLIENT_SECRET.txt`
     にも保存すれば両プロジェクトで使える)
2. gloversal-admin の Access アプリ → **Policies → Add a policy**
   - Name: `claude-agent-service` / **Action: Service Auth**(Allow ではない)
   - Include: **Service Token** → `claude-agent`

## STEP 5 — 完了報告

「終わった」とエージェントに伝える。エージェントが Access 越し(Service Token あり)
または遮断確認(なし)の最終スモークをして完了。

---

### 運用メモ

- Access は入口の遮断(メール OTP)。その内側の JWT ログイン(ADMIN_USER/PASS)は
  従来通り必要 — 二層のまま運用する。
- ADMIN_PASS のローテーション: `npx wrangler secret put ADMIN_PASS --name gloversal-admin`
  (admin-web/ ディレクトリで実行)。ローテ後は .secrets のファイルも更新。
- この Worker は公開サイト(Pages `2026-gloversal-website`)とは完全に独立 —
  Access 設定ミスでもサイトには無影響。
