/* =============================================================
   Gloversal — content-data.js  [managed by admin panel]
   ============================================================= */
window.__GLV_CONTENT__ = {
  "insights": [
    {
      "slug": "e2e-roundtrip-test",
      "date": "2026-07",
      "dateLabel": {
        "ja": "2026�N7��",
        "en": "July 2026"
      },
      "tag": "E2E-UPDATED",
      "title": {
        "ja": "E2E�e�X�g",
        "en": "E2E Test"
      },
      "excerpt": {
        "ja": "�����e�X�g",
        "en": "Roundtrip test"
      },
      "body": {
        "ja": "<p>test</p>",
        "en": "<p>test</p>"
      },
      "media": [],
      "images": [],
      "seo_keywords": [],
      "sources": []
    },
    {
      "slug": "medical-ai-accuracy-gap",
      "date": "2026-04-10",
      "dateLabel": {
        "ja": "2026 · 04",
        "en": "2026 · 04"
      },
      "tag": "Medical AI",
      "title": {
        "ja": "医療AIは「精度」だけでは導入されない",
        "en": "Medical AI isn't adopted for accuracy alone"
      },
      "excerpt": {
        "ja": "導入現場で起きる“精度と運用のズレ”を整理し、PoCを本番運用に橋渡しするためのチェックポイントを解説します。",
        "en": "A breakdown of the field-level gap between accuracy and operations, and the checkpoints that turn a PoC into real production use."
      },
      "body": {
        "ja": "<h2>精度と導入のギャップ</h2><p>医療AI製品は設計上「感度・特異度」で評価されることが多いが、導入の可否を決めるのはそれだけではない。現場の臨床ワークフローに実際に組み込んだときに、「精度は高いが、使えない」という現象が起きる。その背景には、表示速度、アラート設計、既存システムとの統合負荷、放射線科医や臨床検査技師の業務負担増といった「運用側の現実」がある。</p><h2>なぜ臨床ワークフローが「精度の高いAI」を拒絶するのか</h2><p>多くの医療AIが精度検証は通過するが、現場導入に至らない最大の理由は、「現場側のワークフローを変えるコスト」を過小評価しているからだ。読影医の判読フローにアラートが入ると、そのアラートの「信頼性の判断」自体が新たな業務になる。また、AIの結果をそのまま採用するのか、参考にとどめるのかという「運用ポリシー」の欠如が導入を阻む典型的なパターンである。</p><h2>PoCから本番運用へのチェックポイント</h2><p>PoCを本番運用に移行させるためには、以下の3つのチェックポイントを初期から設計する必要がある。第一に、「誰が、いつ、どの画面で」そのAIの結果を見るのかという利用シーンの明確化。第二に、「誤検知・見落とし」時の運用フローと責任分担の設計。第三に、既存のRIS/PACSシステムとのインテグレーション設計である。これらを「後からやる」と、ほぼ確実にPoC止まりになる。</p><h2>戦略アドバイザーの役割</h2><p>医療AIの導入において、技術チームと現場をつなぐ「翻訳者」の存在が不可欠である。開発者は精度指標で話し、現場は業務負担で話す。その間に入り、「このAIが現場でどう使われるか」を具体的な運用像に落とし込み、両者が合意できる地点を見つけること——それが戦略アドバイザーの価値である。精度と運用の橋渡しなくして、医療AIの社会実装は進まない。</p>",
        "en": "<h2>The accuracy-deployment gap</h2><p>Medical AI products are typically evaluated on sensitivity and specificity, but adoption decisions depend on far more. When embedded into real clinical workflows, a product with high accuracy can still be deemed 'unusable'. Behind this lies the reality of display latency, alert design, integration burden with existing systems, and increased workload for radiologists and technicians -- the operational side that bench-level metrics never capture.</p><h2>Why clinical workflows reject accurate AI</h2><p>The primary reason many medical AI products pass validation yet never reach deployment is the underestimation of workflow-change costs. When an AI alert enters a radiologist's reading flow, the very act of judging 'whether to trust this alert' becomes a new task. The absence of an operational policy -- whether to adopt AI results directly or treat them as references -- is a textbook pattern that blocks adoption before it starts.</p><h2>Key checkpoints for PoC-to-production</h2><p>Three design checkpoints must be addressed from day one to move a PoC into production. First, clarify the usage scene: who sees the AI output, when, and on which screen. Second, design the workflow and responsibility split for false positives and misses. Third, plan integration with existing RIS/PACS systems. Leaving these for 'later' almost guarantees the project stalls at PoC.</p><h2>The role of a strategy advisor</h2><p>In medical AI deployment, a translator between the engineering team and the clinical floor is indispensable. Developers speak in accuracy metrics; clinicians speak in workload impact. Stepping into that gap, translating 'how this AI actually gets used on site' into a concrete operational picture, and finding ground both sides can agree on -- that is where a strategy advisor creates value. Without bridging accuracy and operations, medical AI cannot move toward real-world implementation.</p>"
      }
    },
    {
      "slug": "global-healthtech-japan-stalls",
      "date": "2026-03-18",
      "dateLabel": {
        "ja": "2026 · 03",
        "en": "2026 · 03"
      },
      "tag": "Market Entry",
      "title": {
        "ja": "海外ヘルステック企業が日本でつまずく5つの論点",
        "en": "Five reasons global healthtech stalls in Japan"
      },
      "excerpt": {
        "ja": "価格設計、商習慣、医療機関との関係性、制度理解、現場運用。海外発サービスが日本で詰まりやすい5つの論点を整理。",
        "en": "Pricing design, business customs, hospital relationships, regulation, and on-site operations -- five recurring sticking points for overseas-born services."
      },
      "body": {
        "ja": "<h2>日本市場の特殊性を理解する</h2><p>海外のヘルステック企業が日本市場に参入する際、まず直面するのが価格設計の壁である。日本の医療制度は診療報酬が公定されており、SaaS型の月額課金モデルがそのまま適用できるとは限らない。また、導入決定までの意思決定プロセスが長く、合議制で進むため、“デモ→即導入”という海外の営業スタイルが通用しない。</p><h2>商習慣と信頼構築</h2><p>日本の医療機関との取引では、技術的優位性よりも「信頼関係」が重視される。紹介者を介した導入が一般的であり、コールドコール型のアプローチは敵意を持たれやすい。また、契約前のトライアル期間が求められることが多く、その間のサポート体制が導入判断に直結する。</p><h2>制度と運用の壁</h2><p>医療機器規制、個人情報保護法、医療情報システムのガイドラインなど、日本特有の制度環境に対応する必要がある。さらに、現場レベルでは日本語でのサポート、日本語のUI、日本の臨床ワークフローに合わせたカスタマイズが求められる。これらは単なる「ローカライズ」ではなく、サービスそのものの再設計を意味する。</p><h2>乗り越えるためのアプローチ</h2><p>これらの論点を乗り越えるには、日本市場に精通したアドバイザーを初期から巻き込み、「制度×商習慣×現場運用」を一体で整理することが最も効果的である。単なる「言語の翻訳」ではなく、「事業の翻訳」が必要なのだ。</p>",
        "en": "<h2>Understanding Japan's market specificity</h2><p>When global healthtech companies enter Japan, the first wall they hit is pricing design. Japan's healthcare system operates on publicly determined reimbursement fees, meaning a standard SaaS subscription model may not apply directly. Additionally, the decision-making process before adoption is long and consensus-driven, so the overseas 'demo to immediate adoption' sales style simply does not work.</p><h2>Business customs and trust-building</h2><p>In dealings with Japanese medical institutions, 'trust relationships' outweigh technical superiority. Introduction through referrers is standard practice, and cold-call approaches are often met with resistance. Pre-contract trial periods are frequently requested, and the quality of support during that trial directly determines the adoption decision.</p><h2>Regulatory and operational barriers</h2><p>Companies must navigate Japan-specific regulatory environments including medical device regulations, personal information protection law, and medical information system guidelines. At the operational level, Japanese-language support, Japanese UI, and customization to Japanese clinical workflows are expected. This is not mere 'localization' -- it means redesigning the service itself.</p><h2>An approach to overcome these barriers</h2><p>The most effective approach is to involve a Japan-market-fluent advisor from the early stages who can address regulation, business customs, and on-site operations as an integrated whole. What is needed is not linguistic translation but business translation.</p>"
      }
    },
    {
      "slug": "poc-stall-hospital-business",
      "date": "2026-03-05",
      "dateLabel": {
        "ja": "2026 · 03",
        "en": "2026 · 03"
      },
      "tag": "Business Development",
      "title": {
        "ja": "医療機関向け新規事業は、なぜPoC止まりになるのか",
        "en": "Why new businesses for hospitals stall at PoC"
      },
      "excerpt": {
        "ja": "PoCを事業化に進めるには、検討主体、評価指標、現場合意形成の3点を初期から設計する必要があります。",
        "en": "To move a PoC into a real business, decision ownership, evaluation metrics, and on-site consensus must be designed from day one."
      },
      "body": {
        "ja": "<h2>PoCが事業化しない構造的原因</h2><p>医療機関向けの新規事業が「PoCまでは進むが、その先に行かない」という現象は、医療・ヘルステック業界では極めて一般的である。その根本的な原因は、「検討主体が曖昧」「評価指標が定義されていない」「現場合意が後回し」という3つの構造的問題に集約される。</p><h2>検討主体の設計</h2><p>医療機関では、新しいソリューションの導入を誰が主導するかが不明確なことが多い。IT部門、事務局、診療科、経営層のそれぞれが部分的に関与し、「誰が最終的に決めるのか」が曖昧なままPoCが始まるケースが少なくない。その結果、PoC後に「次のステップを誰が推進するか」が決まらず、停滞する。</p><h2>評価指標と現場合意</h2><p>「PoCで何が確認できれば「成功」なのか」を事前に定義していないプロジェクトは、どんなに良い結果が出ても「次に進めない」状態に陥る。同時に、現場のスタッフ（看護師、技師、医師）が「PoCの存在を知らない」まま進行し、本番化段階で初めて反発を受けるというパターンも典型的である。</p><h2>初期設計の重要性</h2><p>これらの問題は、PoCの「後」ではなく「前」に設計する必要がある。検討主体、評価指標、現場ステークホルダーの巻き込みを「PoC設計」の段階で行うことが、事業化への唯一の確実な道筋である。</p>",
        "en": "<h2>Structural reasons PoCs fail to scale</h2><p>The pattern of 'the PoC went fine but nothing happened next' is extremely common in healthcare and healthtech. The root causes converge on three structural problems: ambiguous decision ownership, undefined evaluation criteria, and belated on-site consensus.</p><h2>Designing decision ownership</h2><p>In medical institutions, it is often unclear who leads the adoption of a new solution. IT, administration, clinical departments, and management each participate partially, and PoCs frequently begin without clarity on who ultimately decides. The result: after the PoC, no one drives the next step and the project stalls.</p><h2>Evaluation criteria and on-site consensus</h2><p>A project that has not pre-defined 'what constitutes PoC success' will struggle to move forward no matter how good the results. Equally typical is the pattern where frontline staff -- nurses, technicians, physicians -- are unaware the PoC even exists until the scaling stage, at which point they push back.</p><h2>The importance of upfront design</h2><p>These problems must be designed before the PoC, not after. Incorporating decision ownership, evaluation metrics, and on-site stakeholder involvement at the PoC design stage is the only reliable path to commercialization.</p>"
      }
    },
    {
      "slug": "remote-healthcare-imaging-business",
      "date": "2026-02-12",
      "dateLabel": {
        "ja": "2026 · 02",
        "en": "2026 · 02"
      },
      "tag": "Remote Healthcare",
      "title": {
        "ja": "遠隔医療・画像診断領域で事業を作るときに最初に整理すべきこと",
        "en": "Framing a remote-healthcare or imaging business"
      },
      "excerpt": {
        "ja": "読影フロー、医療機関側の導入責任、保険・費用構造、画像データ連携の4つの軸で事業仮説を組むアプローチ。",
        "en": "Reading workflow, hospital-side ownership, reimbursement structure, and imaging data exchange -- four axes for building a credible hypothesis."
      },
      "body": {
        "ja": "<h2>読影フローの理解</h2><p>遠隔画像診断事業を設計する際、最も重要なのは読影フロー全体を理解することである。依頼元の医療機関から画像が送信され、読影医が判読し、レポートが返却されるまでの一連のプロセスにおいて、各ステップでの技術的・制度的・運用的な課題を把握する必要がある。</p><h2>導入責任と費用構造</h2><p>医療機関側にとって、遠隔読影サービスの導入は「誰の責任で導入し、誰が費用を負担するのか」という問題を含んでいる。保険診療の枠組みの中で、遠隔読影の費用をどう正当化するかが事業性を左右する。</p><h2>画像データ連携の設計</h2><p>DICOM画像の送受信、セキュリティ要件、PACSとの接続、画像の容量と通信品質など、技術的な設計項目は多岐にわたる。これらを「事業価値」とつなげて説明できるかどうかが、医療機関への提案の成否を分ける。</p><h2>4つの軸での事業仮説設計</h2><p>読影フロー、導入責任、費用構造、データ連携。この4つの軸を同時に整理し、それぞれの「現実解」を提示できる事業仮説が、遠隔医療・画像診断領域での事業立ち上げに不可欠である。</p>",
        "en": "<h2>Understanding the reading workflow</h2><p>When designing a remote diagnostic imaging business, the most critical step is understanding the full reading workflow. From the referring institution sending images, to the radiologist interpreting them, to the report being returned -- at each step, technical, regulatory, and operational challenges must be mapped.</p><h2>Adoption responsibility and cost structure</h2><p>For the hospital side, introducing a remote reading service inherently raises the question of 'who is responsible for adoption and who bears the cost'. How remote reading costs are justified within the insurance reimbursement framework determines the viability of the business.</p><h2>Imaging data integration design</h2><p>Technical design items are numerous: DICOM image transmission and reception, security requirements, PACS connectivity, image volume and communication quality. Whether these can be explained in terms of 'business value' -- not just technical specs -- is what separates a winning proposal from a losing one.</p><h2>Building hypotheses on four axes</h2><p>Reading workflow, adoption responsibility, cost structure, and data integration. Organizing these four axes simultaneously and presenting realistic solutions for each is indispensable when launching a business in the remote healthcare and diagnostic imaging space.</p>"
      }
    },
    {
      "slug": "invisible-translation-cost",
      "date": "2026-01-20",
      "dateLabel": {
        "ja": "2026 · 01",
        "en": "2026 · 01"
      },
      "tag": "Healthcare Data",
      "title": {
        "ja": "医療現場と開発チームのあいだにある“見えない翻訳コスト”",
        "en": "The invisible translation cost between clinical and dev teams"
      },
      "excerpt": {
        "ja": "要件定義で見落とされやすい臨床ワークフロー・業務フロー・制度前提を、翻訳者として埋めるための視点。",
        "en": "What requirements discussions tend to miss -- clinical workflow, operational flow, regulatory premises -- and how to fill the gap as a translator."
      },
      "body": {
        "ja": "<h2>見えない翻訳コストとは何か</h2><p>医療系プロダクトの開発では、技術チームと現場のあいだに「見えない翻訳コスト」が存在する。それは、現場が「当たり前」として明言しない前提条件（診療フロー、記録様式、多職種連携の慣行）と、開発側が「言われたことだけを作る」姿勢から生まれる。</p><h2>要件定義で欠落する3つの前提</h2><p>第一に臨床ワークフロー。患者が受付から診察、検査、診断、治療、記録という流れの中で、そのプロダクトがどのタイミングで使われるか。第二に業務フロー。記録の形式、承認の流れ、他システムとの連携タイミングなど。第三に制度前提。個人情報の取扱い、医療機器該当性、保険診療との関係。</p><h2>翻訳者としてのアプローチ</h2><p>このギャップを埋めるには、現場の「暴黙の知識」を開発者が理解できる言葉に変換する「翻訳者」が必要である。それは単なる通訳ではなく、両者の文脈を理解し、「何が「当たり前」として省略されているか」を積極的に問い直し、要件として可視化する役割である。</p>",
        "en": "<h2>What the invisible translation cost is</h2><p>In medical product development, an 'invisible translation cost' exists between the engineering team and the clinical floor. It emerges from the unstated assumptions clinicians take for granted -- care pathways, documentation conventions, multidisciplinary coordination habits -- combined with the engineering team's tendency to build only what has been explicitly stated.</p><h2>Three premises that drop off in requirements</h2><p>First, clinical workflow: within the patient journey from reception to examination, diagnosis, treatment, and documentation, at which point is the product used? Second, operational flow: documentation formats, approval chains, timing of system integration. Third, regulatory premises: personal data handling, medical device classification, relationship to insured care.</p><h2>Approaching the gap as a translator</h2><p>Bridging this gap requires a translator who can convert the clinical floor's tacit knowledge into language developers understand. This is not simple interpretation but a role that involves understanding both contexts, actively questioning what has been omitted as 'obvious', and making those assumptions visible as explicit requirements.</p>"
      }
    },
    {
      "slug": "hospital-startup-alliance-failures",
      "date": "2025-12-08",
      "dateLabel": {
        "ja": "2025 · 12",
        "en": "2025 · 12"
      },
      "tag": "Alliance",
      "title": {
        "ja": "医療機関とスタートアップの協業で起きる典型的な3つの失敗",
        "en": "Three common failures in hospital-startup alliances"
      },
      "excerpt": {
        "ja": "意思決定の主体、成果物の責任、関係者合意の順序。協業初期で最も躓きやすい論点を整理します。",
        "en": "Decision ownership, deliverable responsibility, stakeholder alignment -- three places early-stage partnerships tend to break."
      },
      "body": {
        "ja": "<h2>協業が壊れる3つのパターン</h2><p>医療機関とスタートアップの協業は、その非対称性から特有の難しさがある。意思決定のスピード、リスク許容度、成果の定義が根本的に異なる中で、双方が満足する協業設計を作るには、初期段階での論点整理が不可欠である。</p><h2>失敗パターン１：意思決定の主体不在</h2><p>医療機関側では、「誰がこの協業の最終意思決定者なのか」が曖昧なままプロジェクトが始まることが少なくない。結果、現場のチャンピオンが異動したり、組織改編があったりすると、プロジェクトが突然停止する。</p><h2>失敗パターン２：成果物の責任分担</h2><p>「何を、いつまでに、誰の責任で」を明確にしないまま協業が始まると、成果物の品質と納期をめぐる対立が必ず発生する。特に医療機関側の「協力」が必要な場合、その工数を事前に合意することが不可欠である。</p><h2>失敗パターン３：ステークホルダー合意の順序</h2><p>協業の初期に関係者全員を巻き込まないことで、後から「聞いていない」という反発が起きる。特に、看護部門、事務局、医事課など、直接の当事者以外の関係者の合意を得る順序が重要である。</p>",
        "en": "<h2>Three patterns that break partnerships</h2><p>Hospital-startup partnerships carry inherent difficulties due to their asymmetric nature. Decision speed, risk tolerance, and outcome definitions are fundamentally different. Designing a partnership that satisfies both sides requires upfront issue framing at the earliest stage.</p><h2>Failure pattern 1: Absent decision ownership</h2><p>On the hospital side, projects frequently start without clarity on who is the ultimate decision-maker for the partnership. When the on-site champion transfers or an organizational restructuring occurs, the project suddenly halts.</p><h2>Failure pattern 2: Deliverable responsibility</h2><p>Starting a partnership without clarifying 'what, by when, and under whose responsibility' inevitably leads to conflict over deliverable quality and timelines. Especially when hospital-side 'cooperation' is required, pre-agreeing on the effort involved is essential.</p><h2>Failure pattern 3: Stakeholder alignment order</h2><p>Failing to involve all stakeholders at the partnership's inception causes late-stage pushback of the 'we were never told about this' variety. The order of gaining consensus from nursing, administration, and medical affairs -- not just the direct counterparts -- is critical.</p>"
      }
    }
  ],
  "speaking": [
    {
      "slug": "medical-ai-business-keynote",
      "date": "2026-04-15",
      "dateLabel": {
        "ja": "2026 · 04",
        "en": "2026 · 04"
      },
      "tag": "Keynote",
      "title": {
        "ja": "医療AIのビジネス実装カンファレンス 基調講演",
        "en": "Keynote -- Medical AI Business Implementation Conference"
      },
      "summary": {
        "ja": "医療AIの社会実装に向けた論点整理と、PoCから事業化へのステップを講演。",
        "en": "Framing the social implementation of medical AI and the steps from PoC to real business."
      },
      "body": {
        "ja": "<h2>イベント概要</h2><p>本カンファレンスは、医療AIの社会実装をテーマに、医療機器メーカー、AIスタートアップ、医療機関の意思決定者が一堂に会する年次イベントである。基調講演では、医療AIが「技術的に完成しているのに現場で使われない」という構造的な問題を取り上げた。</p><h2>講演のテーマ</h2><p>講演では、「PoCの精度は十分なのに、なぜ導入が進まないのか」という問いを起点に、現場運用設計、制度対応、意思決定者の巻き込み方の3つの軸から「実装に必要な条件」を整理した。具体的なケースを交えながら、「精度だけでは導入されない」現実を示した。</p><h2>主なテイクアウェイ</h2><p>参加者から特に反響が大きかったのは、「現場の運用フローをデザインすること自体がプロダクト設計の一部である」という視点である。AIの性能だけでなく、導入環境全体を設計する必要性が、多くの参加者に新たな気づきを提供した。</p>",
        "en": "<h2>Event overview</h2><p>This annual conference brings together medical device manufacturers, AI startups, and hospital decision-makers under the theme of medical AI social implementation. The keynote addressed the structural problem of medical AI being 'technically complete yet unused on the ground'.</p><h2>Presentation theme</h2><p>Starting from the question 'why does adoption stall when PoC accuracy is sufficient?', the talk organized the conditions for implementation across three axes: on-site operational design, regulatory alignment, and decision-maker engagement. Drawing on concrete cases, it demonstrated the reality that accuracy alone is not enough for adoption.</p><h2>Key takeaways</h2><p>The perspective that resonated most with attendees was that 'designing the on-site operational flow is itself part of product design'. The necessity of designing the entire deployment environment -- not just AI performance -- provided fresh insight for many participants.</p>"
      }
    },
    {
      "slug": "global-medtech-japan-webinar",
      "date": "2026-03-22",
      "dateLabel": {
        "ja": "2026 · 03",
        "en": "2026 · 03"
      },
      "tag": "Webinar",
      "title": {
        "ja": "グローバル医療機器事業の日本展開ウェビナー",
        "en": "Webinar -- Japan market entry for global medical technology"
      },
      "summary": {
        "ja": "海外ヘルステック企業向けに、日本市場の特殊性と参入戦略を解説。",
        "en": "For international healthtech companies: Japan market specifics and entry strategy."
      },
      "body": {
        "ja": "<h2>ウェビナーの背景</h2><p>日本市場への参入を検討する海外ヘルステック企業が増加する中、日本の医療制度、商習慣、意思決定プロセスの特殊性を包括的に解説するウェビナーを開催した。参加企業は北米・欧州・イスラエルから約30社。</p><h2>講演内容</h2><p>日本の医療制度の概要、価格設計の制約、医療機関との信頼構築の方法、そして「ローカライズ」と「サービス再設計」の違いについて解説した。実際の日本展開支援の事例を交え、具体的なステップを示した。</p><h2>反響と成果</h2><p>ウェビナー後、参加企業のうち5社から具体的な日本展開の相談が寄せられ、うち1社は実際のアドバイザリー契約に至った。「制度×商習慣×現場運用」を一体で整理するアプローチの有効性が確認できた。</p>",
        "en": "<h2>Webinar background</h2><p>As more international healthtech companies consider entering the Japanese market, this webinar was organized to provide a comprehensive overview of Japan's healthcare system, business customs, and decision-making processes. Around 30 companies from North America, Europe, and Israel participated.</p><h2>Presentation content</h2><p>Topics covered included the Japanese healthcare system overview, pricing design constraints, methods for building trust with medical institutions, and the difference between 'localization' and 'service redesign'. Drawing on real Japan-entry advisory cases, the presentation outlined concrete steps.</p><h2>Response and outcomes</h2><p>Following the webinar, five participating companies reached out with specific Japan-entry inquiries, and one proceeded to an actual advisory contract. The effectiveness of the integrated approach -- addressing regulation, business customs, and on-site operations as one -- was confirmed.</p>"
      }
    },
    {
      "slug": "healthtech-magazine-interview",
      "date": "2026-02-10",
      "dateLabel": {
        "ja": "2026 · 02",
        "en": "2026 · 02"
      },
      "tag": "Article",
      "title": {
        "ja": "ヘルステック業界誌 インタビュー寄稿",
        "en": "Feature interview -- Healthtech industry magazine"
      },
      "summary": {
        "ja": "医療とテクノロジーの翻訳者としての役割、アライアンス設計の実例を紹介。",
        "en": "The role of a translator between healthcare and technology, with concrete examples of alliance design."
      },
      "body": {
        "ja": "<h2>寄稿の背景</h2><p>ヘルステック業界誌からの依頼を受け、「医療とテクノロジーの翻訳者」としての役割と、アライアンス設計の実例をインタビュー形式で寄稿した。医療現場と事業の両方を理解するアドバイザーの必要性について語った。</p><h2>記事の主な論点</h2><p>記事では、海外ヘルステック企業の日本展開支援の実例、医療機関とスタートアップの協業設計、そして「技術があるのに現場で使われない」問題の構造的原因について探った。「翻訳」とは、言語の翻訳ではなく、事業構造と現場運用の翻訳であることを強調した。</p>",
        "en": "<h2>Background</h2><p>Invited by a healthtech industry magazine, this feature interview explored the role of a 'translator between healthcare and technology' and shared concrete examples of alliance design. The piece discussed the necessity of advisors who understand both the clinical floor and business realities.</p><h2>Key points in the article</h2><p>The article covered real cases of supporting global healthtech companies' Japan market entry, designing hospital-startup partnerships, and the structural reasons behind the 'technology exists but is not used on site' problem. 'Translation' was emphasized as not linguistic translation but translation of business structure and operational reality.</p>"
      }
    },
    {
      "slug": "university-hospital-startup-workshop",
      "date": "2026-01-25",
      "dateLabel": {
        "ja": "2026 · 01",
        "en": "2026 · 01"
      },
      "tag": "Workshop",
      "title": {
        "ja": "大学病院×スタートアップ 合同ワークショップ",
        "en": "Joint workshop -- University hospital x startup"
      },
      "summary": {
        "ja": "臨床現場の課題からプロダクト要件を抽出するセッションを設計・ファシリテート。",
        "en": "Designing and facilitating a session to extract product requirements from clinical field issues."
      },
      "body": {
        "ja": "<h2>ワークショップの目的</h2><p>大学病院の臨床現場とスタートアップの開発チームが共同で、現場の課題からプロダクトの要件を抽出するセッションを設計・ファシリテートした。「現場の困りごと」と「技術で解決できること」の接続点を見つけることが目的であった。</p><h2>プログラム設計</h2><p>前半では医師・看護師・技師が「日常業務のペインポイント」を共有。後半でスタートアップのエンジニアがそれを「技術的に解決可能な課題」に変換。私はその間をつなぐ「翻訳者」として、両者の語彙の差を埋める役割を担った。</p><h2>成果</h2><p>ワークショップから、具体的なプロダクト要件が3件抽出され、うち1件は実際に開発プロジェクトとして始動した。「現場と開発のあいだに翻訳者が入ることで、要件の解像度が格段に上がる」というフィードバックを得た。</p>",
        "en": "<h2>Workshop purpose</h2><p>Clinical staff at a university hospital and a startup development team jointly designed a session to extract product requirements from on-site challenges. The goal was to find the connection point between 'daily frustrations in clinical work' and 'what technology can solve'.</p><h2>Program design</h2><p>The first half had physicians, nurses, and technicians share their 'daily pain points'. In the second half, startup engineers converted these into 'technically solvable challenges'. I served as the translator between both sides, bridging the vocabulary gap.</p><h2>Outcomes</h2><p>Three concrete product requirements were extracted from the workshop, and one actually launched as a development project. The feedback received was that 'having a translator between the field and development dramatically increases requirements resolution'.</p>"
      }
    },
    {
      "slug": "ai-agent-executive-seminar",
      "date": "2025-12-15",
      "dateLabel": {
        "ja": "2025 · 12",
        "en": "2025 · 12"
      },
      "tag": "Seminar",
      "title": {
        "ja": "経営者向けAIエージェント活用セミナー",
        "en": "Executive seminar -- AI agents in practice"
      },
      "summary": {
        "ja": "LangGraph/CrewAI等を用いた自律型AI組織の可能性と実装上の論点を共有。",
        "en": "Autonomous AI organizations built on LangGraph/CrewAI: opportunities and implementation issues."
      },
      "body": {
        "ja": "<h2>セミナーの背景</h2><p>AIエージェント技術の急速な進化を受け、経営者層向けに「自律型AI組織」の可能性と実装上の論点を共有するセミナーを開催した。LangGraph、CrewAI、Ollama等のスタックを用いた具体例を交え、「人間がやるべきこと」と「AIが担えること」の境界線を描いた。</p><h2>主な議論テーマ</h2><p>「AIエージェントは人を置き換えるのか？」という問いに対し、「置き換えるのではなく、人間の判断を拡張する」という位置づけで議論を展開。特に医療領域では、AIエージェントの自律性と人間の監督のバランスが重要であることを強調した。</p>",
        "en": "<h2>Seminar background</h2><p>Responding to the rapid evolution of AI agent technology, this executive-level seminar shared the potential of 'autonomous AI organizations' and practical implementation issues. Using concrete examples built on LangGraph, CrewAI, and Ollama stacks, the session mapped the boundary between 'what humans should do' and 'what AI can handle'.</p><h2>Key discussion themes</h2><p>In response to the question 'Will AI agents replace people?', the discussion was framed around 'not replacing but extending human judgment'. Especially in healthcare, the balance between AI agent autonomy and human oversight was emphasized as critical.</p>"
      }
    },
    {
      "slug": "overseas-startup-mentorship",
      "date": "2025-11-08",
      "dateLabel": {
        "ja": "2025 · 11",
        "en": "2025 · 11"
      },
      "tag": "Mentor",
      "title": {
        "ja": "海外スタートアップ向けメンター活動",
        "en": "Mentorship -- Overseas startups"
      },
      "summary": {
        "ja": "日本進出を検討する海外ヘルステック企業のピッチ支援と戦略アドバイザリー。",
        "en": "Pitch coaching and strategic advisory for overseas healthtech companies exploring Japan."
      },
      "body": {
        "ja": "<h2>メンター活動の概要</h2><p>海外のヘルステックアクセラレーターと連携し、日本進出を検討する3社のメンタリングを担当。ピッチ資料の日本市場向けリフレーミング、提携先候補の選定、初回面談の論点設計を支援した。</p><h2>支援内容と成果</h2><p>3社それぞれのプロダクトとターゲット市場に応じたメッセージングを設計し、日本側のパートナー候補との接続を支援。結果として、2社が日本の医療機関との初回面談に成功し、そのうち1社はパイロットプロジェクトを開始した。</p>",
        "en": "<h2>Mentorship overview</h2><p>Partnering with an overseas healthtech accelerator, I mentored three companies considering Japan market entry. Support included reframing pitch materials for the Japanese market, selecting partnership candidates, and designing first-meeting discussion points.</p><h2>Support content and outcomes</h2><p>For each of the three companies, I designed messaging tailored to their product and target market, and facilitated connections with Japanese-side partner candidates. As a result, two companies secured initial meetings with Japanese medical institutions, and one of them launched a pilot project.</p>"
      }
    }
  ],
  "cases": [
    {
      "slug": "global-healthtech-japan-entry",
      "num": "01",
      "date": "2026-03-01",
      "tag": "Market Entry",
      "title": {
        "ja": "海外ヘルステック企業の日本市場展開支援",
        "en": "Japan market entry for a global healthtech"
      },
      "issue": {
        "ja": "日本市場の導入ハードルが高く、訴求先と価値提案が曖昧。",
        "en": "High barriers to entry in the Japanese market; unclear value proposition and target buyers."
      },
      "work": {
        "ja": "市場整理、提携仮説設計、訴求再定義、面談論点整理。",
        "en": "Market mapping, alliance hypothesis design, narrative re-framing, and meeting preparation."
      },
      "result": {
        "ja": "営業ストーリーの明確化、提携候補との対話前進、初期商談の質向上。",
        "en": "A clearer sales story, real progress with alliance candidates, and higher quality early conversations."
      },
      "body": {
        "ja": "<h2>背景と課題</h2><p>海外発のヘルステック企業が日本市場への参入を検討していたが、日本の医療制度・商習慣・価格設計の特殊性から、「誰に、何を、どう売るのか」が明確になっていなかった。現地の商習慣を理解せずに営業活動を始めた結果、初回商談が空回りする状態が続いていた。</p><h2>支援アプローチ</h2><p>まず、日本の医療市場の構造を整理し、同社プロダクトが値を発揮できるセグメントを特定した。次に、提携仮説を設計し、「誰と組めば日本市場で機能するか」を明確にした。さらに、営業ストーリーを日本市場向けに再構成し、初回面談時の論点を整理した。</p><h2>成果</h2><p>結果として、営業ストーリーが明確化され、提携候補との対話が前進し、初期商談の質が向上した。　3ヶ月以内に2社の提携候補と具体的な協業議論に入ることができた。</p>",
        "en": "<h2>Background and challenge</h2><p>A global healthtech company was evaluating entry into the Japanese market but, due to the specificities of Japan's healthcare system, business customs, and pricing design, could not clarify 'who to sell to, what to sell, and how to sell it'. Having started sales activities without understanding local customs, initial meetings were consistently unproductive.</p><h2>Advisory approach</h2><p>First, we mapped the structure of Japan's healthcare market and identified the segments where the company's product could deliver real value. Next, we designed alliance hypotheses to clarify 'who to partner with for the product to work in Japan'. Finally, we reconstructed the sales story for the Japanese market and organized the discussion points for initial meetings.</p><h2>Outcomes</h2><p>The sales story was clarified, dialogue with alliance candidates advanced, and the quality of early-stage meetings improved. Within three months, concrete partnership discussions began with two alliance candidates.</p>"
      }
    },
    {
      "slug": "medical-imaging-service-framing",
      "num": "02",
      "date": "2026-02-01",
      "tag": "Business Development",
      "title": {
        "ja": "医療画像関連サービスの事業整理と提案設計",
        "en": "Business framing & proposal design for a medical imaging service"
      },
      "issue": {
        "ja": "サービスの価値が伝わりにくく、説明資料が分散していた。",
        "en": "The value of the service was hard to communicate and sales materials were fragmented."
      },
      "work": {
        "ja": "構造整理、訴求軸再設計、資料ストーリー化、導入メリットの言語化。",
        "en": "Structural framing, value-axis redesign, narrative material design, and articulation of customer benefits."
      },
      "result": {
        "ja": "顧客説明の一貫性向上、営業会話の短縮、説明時の迷い減少。",
        "en": "More consistent customer explanations, shorter sales conversations, and fewer dead-ends in presentations."
      },
      "body": {
        "ja": "<h2>背景と課題</h2><p>医療画像に関わるサービスを提供する企業が、「サービスの価値をうまく伝えられない」という課題を抱えていた。営業資料が複数存在し、それぞれが異なるメッセージを発信しており、顧客への説明に一貫性がなかった。</p><h2>支援アプローチ</h2><p>まずサービスの構造を整理し、「誰に、どの価値を、どう伝えるか」を再定義した。次に、営業提案資料を一本のストーリーラインに再構成し、「課題→解決策→導入メリット」の流れで説明できる形にした。</p><h2>成果</h2><p>営業担当者が「迷わずに説明できるようになった」というフィードバックを得た。顧客説明の時間が短縮され、「何をやっている会社なのか」が明確に伝わるようになった。訴求の再設計により、初回商談の転換率が向上した。</p>",
        "en": "<h2>Background and challenge</h2><p>A company providing medical imaging services was struggling to communicate its value effectively. Multiple sales materials existed, each delivering a different message, resulting in inconsistent customer explanations.</p><h2>Advisory approach</h2><p>We first reorganized the service structure and redefined 'who receives what value, communicated how'. Then, we restructured the sales proposal materials into a single storyline that follows a 'challenge to solution to adoption benefit' flow.</p><h2>Outcomes</h2><p>Sales representatives reported they could now 'explain without hesitation'. Customer explanation time shortened, and 'what the company does' became clearly communicated. The redesigned value proposition improved the conversion rate of initial meetings.</p>"
      }
    },
    {
      "slug": "medical-ai-implementation-planning",
      "num": "03",
      "date": "2026-01-15",
      "tag": "Medical AI",
      "title": {
        "ja": "医療AIプロダクトの導入構想支援",
        "en": "Implementation planning for a medical AI product"
      },
      "issue": {
        "ja": "技術はあるが、導入現場のフローと役割分担が見えない。",
        "en": "Strong technology, but the clinical workflow and role assignments were unclear."
      },
      "work": {
        "ja": "運用整理、PoC設計、導入論点の可視化、現場向け説明整理。",
        "en": "Operational framing, PoC design, implementation issue mapping, and on-site communication."
      },
      "result": {
        "ja": "検討フェーズから実装フェーズへの移行を支援し、社内合意形成を加速。",
        "en": "Moved from evaluation to implementation, accelerating internal consensus."
      },
      "body": {
        "ja": "<h2>背景と課題</h2><p>医療AIプロダクトを持つスタートアップが、「技術はあるが、現場でどう使われるかが見えない」という課題を抱えていた。精度は十分だが、導入現場のワークフロー、役割分担、責任体制が未設計のままだった。</p><h2>支援アプローチ</h2><p>現場の臨床ワークフローをヒアリングし、「AIがどのタイミングで、誰に、どの形で結果を返すのか」を具体化。誤検知・見落とし時の運用フローと責任分担を設計し、既存システムとの統合設計も併せて行った。</p><h2>成果</h2><p>「技術はあるが使い方が見えない」状態から、「現場で具体的にどう使われるか」が明確になり、検討フェーズから実装フェーズへの移行が実現した。社内の意思決定者への説明資料も整備され、合意形成が加速した。</p>",
        "en": "<h2>Background and challenge</h2><p>A startup with a medical AI product was struggling with the gap between 'having the technology' and 'understanding how it would be used on site'. Accuracy was sufficient, but the deployment-side workflow, role assignments, and responsibility structure remained undesigned.</p><h2>Advisory approach</h2><p>We interviewed the clinical workflow to concretize 'at what point, to whom, and in what form does the AI deliver its results'. We designed operational flows for false positives and missed detections with clear responsibility allocation, and also addressed integration design with existing systems.</p><h2>Outcomes</h2><p>The status shifted from 'technology exists but usage is unclear' to 'specifically how it will be used on site' being well-defined. The project moved from evaluation to implementation phase. Explanatory materials for internal decision-makers were also prepared, accelerating consensus building.</p>"
      }
    }
  ]
};
