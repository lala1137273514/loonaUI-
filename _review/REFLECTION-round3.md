# 第三轮增量 · Fresh-Context 反思复审（REFLECTION-round3）

> 复审范围：本轮 5 个优化点（失败/部分成功演示 · persona 拉平 · 控制台加深 · §12 校验跑满全矩阵 · 文档同步）。
> 方法：纯静态审查——读源码/文档、按代码逻辑推演时序、Read 截图 PNG、Node `--check` 语法核验 + Node 复算每条 TTS 全角字宽。**未驱动浏览器**（遵守单一 headless 串行约束）。
> 校验脚本结果（measure 16/16 maxOverflow=0/maxSubOverlap=0、verify 11/11 allPass）作为既给证据采信，但已读 `verify.js`/`measure.js` 确认其断言确实对应所声明的内容。

---

## 裁决：demo-ready = **YES**

5 个优化点全部落地且正确。失败演示是本轮最有分量的补全，逻辑诚实、视觉拆得清楚、时序（默认速度下）正确，截图实证无假回执、无 toast 压盖。persona 拍数全部在 1 行安全预算内（实测口播 1 行可容 ~37 汉字，远超 21 字自律线）。控制台评审结论 + 标注导出 + 两条新契约校验均正确接线，且**对 9 条理想链零误报**（已逐条验证）。

**无 P0、无 P1。** 仅 3 个 P2（文档/代码注释的 273 残留、一条超 21 字口播虽不会真截断但破了自律线、失败 toast 时序在 ≥1.8× 倍速下的边角）。这些都不影响默认速度下的演示。

| 维度 | 分 | 一句话 |
|---|---|---|
| A. 失败模式正确性（REQ-FAIL-001） | **5** | 诚实拆开成功/失败、标谁不知道、永远给下一步、不假称已发、依赖顺序不回滚 —— 全中 |
| B. persona 拉平 & 字幕安全 | **4** | 拍数到位、像真职业；persona 主拍全部 ≤19 字。扣 1 分：meeting 有 1 条 **24 字**口播（虽不真截断但破自律线）|
| C. 控制台加深正确性 | **5** | verdict 持久化+导出、annotations_resolved 双导出口、两条新校验精确且 9 链零误报（含 meeting 外发目标不误触发的正向确认）|
| D. 校验完整性 | **4** | verify/measure 断言与声明一致、矩阵同源、isStandardCard 精确隔离 4 张标准卡。扣 1 分：verify.js 不扫 variants（FailureCard 仅靠 measure 覆盖，README「跑满全矩阵」措辞略满）|
| E. 文档一致性 | **4** | README/CARD_TAXONOMY/UI-SPEC/review-v1.0.html 全同步且互恰。扣 1 分：**EXPLORATION.md §1 + css/loona.css:119 仍残留 273**，与定稿 287 直接打架 |

---

## 逐维度证据

### A. 失败模式正确性 = 5/5

- **引擎 fail 分支**：`js/engine.js:404-410` `_onConfirmAction` 的 `c.outcome==='fail'` 分支：先 `发送中`(sending 图标, `js/components.js:81`) → 1000ms 后 `发送失败`(fail 图标)，**没有**「已发送 ✓ · 查看详情」假回执（成功分支在 412-415 才出）。逻辑诚实。
- **case 重构**：`cases/email_calendar_workflow.js` 拆成 `OPEN`(10-37) + `SUCCESS_TAIL`(40-49) / `FAIL_TAIL`(52-72)；base=全成功(79)，`variants:[{name:'部分失败', events:OPEN.concat(FAIL_TAIL)}]`(80)。前半段共用 → 并排对比 LCS 只在第 2 道门后标差异，叙事干净。
- **依赖顺序不回滚**：`FAIL_TAIL` 的 DECISION_RECORD(70-71)「日程成功、邮件失败不连带回滚日程」；FailureCard(60-66) `completed:['日程已改…']` / `failed:['确认邮件没发出 · 小周还不知道改期']` / `reason:'邮件服务器超时，自动重试两次仍失败'` / `next_options:['重发邮件','改用短信通知小周','我来手动发']`。**谁不知道**（小周）+ **永远给下一步**（三选项）全中 REQ-FAIL-001。
- **组件**：`js/components.js:261-271` `failureCard` 渲染 ✓completed/✕failed/reason/下一步脚注；CSS `css/loona.css:306-310` ✓绿/✕红到位。
- **截图实证**：`_review/_audit/fix_fail_card.png` —— FailureCard 标题「一步成、一步没成」、✓日程已改、✕邮件没发出·小周还不知道改期、reason、下一步三项；**右上 toast 区干净**（发送失败 toast 已被卡渲染收掉）。`fix_fail_compare.png` 左 ListCard / 右 FailureCard 并排，verdict 条在底。
- **时序（默认速度=1）正确**：确认门 `autoWaits` 2000ms 后 `finish('confirm')`→同步调 `_onConfirmAction`（t0：发送中），随后 `_waitUser` resolve→loop 进 FailureCard，其 `gap_ms:1800`(60) 的 `_sleep` 从 t0 起算。t0+1000 发送中→发送失败；t0+1800 FailureCard 渲染→`_dismissToastsOn('card')`(engine.js:199) 收掉发送失败 toast。**发送失败可见 ~800ms 后被卡替换，不压在 FailureCard 上**。toast 带 `dismiss_on:'card'`（engine.js:391）是这条时序成立的关键，已确认。

### B. persona 拉平 & 字幕安全 = 4/5

- **拍数**：天气(主播)/邮件(助理)/餐厅(店长)/会议(参谋)均从 1-2 拍提到 4-5 拍，口吻贴职业（如餐厅「今晚我给你定梧桐边小馆」→距离→为何压过高分那家→「不保证有位」）。
- **字幕真实预算**：字幕 `max-width:74%`×设备 812 ≈ 600px，`font-size:15px`，减 padding 36px ≈ 564px，1 行可容 **~37 汉字**（缩放对 74%/字号同比，比例不变）。`persona_weather_beat.png` 实证 16 字口播 1 行、两侧大量留白。所以 21 字是带厚余量的自律线，**即便超到 24 字也不会真截断**。
- **Node 复算每条结果期口播**（汉字=1、ASCII=0.5）：persona 主拍最大 19 字（meeting「定了的：Companion 做主体验。」），其余 ≤16，**全安全**。
- **扣分点（P2-2）**：`cases/meeting_action.js:33` 的 DRAFT 口播「我先写草稿，不直接发。按决策、风险、下一步三段。」= **24 字**，且该拍播放时 SectionCard 仍在场（确认门未渲染 → `.sub-1line` 生效 → 1 行钳制）。**不会真截断**（24 字 ≈360px ≪ 564px 预算），但**破了本轮"每拍 ≤21 字"自律线**，且这是唯一一条。`email_briefing.js:32`「先垫个草稿：确认收到、四点前回，不多承诺。」= 正好 21，压线。建议各砍到 ≤18 字留余量（与 round2 对 news/travel 的处理一致）。

### C. 控制台加深正确性 = 5/5

- **verdict 条**：`js/console.js:349-381` `_verdictBar`——三投票（更倾向 A/势均力敌/B）+ note textarea，键到 `loona_verdict_<task_id>` localStorage（346-348）。`_renderCompare`(343) 每次渲染都挂。CSS `css/console.css:132-145` 全套（含 `.on` 选中态）。截图 `fix_verdict_bar.png` 实证：A 选中高亮、备注有字、状态「已记 · 更倾向 A，随导出带走」。
- **导出带 verdict + 标注**：`exportAll`(466-473) `review:{verdict:this._loadVerdict(), annotations:resolveAnnotations(...)}` + 每变体 `annotations`；`share`(474-483) `annotations_resolved`；`editor.exportJSON`(editor.js:218-229) 也写 `annotations_resolved`。`resolveAnnotations`(82-88) 自描述（事件号/类型/原文/comp）。三处导出口一致。
- **新校验精确、9 链零误报**（逐条核）：
  - **私域未授权**(`console.js:71`)：仅 `read_private_data && comp==='toast' && !chainDeclaresAuth`。三条私域链 `calendar_today` / `email_briefing` / `email_calendar_workflow` 都在 ROUTER 声明了 `OAuth已连`（calendar_today.js:11、email_briefing.js:11、workflow.js:13）→ `chainDeclaresAuth`(60-65) 命中 → **不亮**。其余 6 链 tool_plan≠read_private_data → 跳过。✓
  - **外发收件人未明确**(`console.js:73-77`)：仅确认门 + action 含发送/外发 + target 空或匹配 `/^(待[填定指].*|未指定|待定|空)$/`。`email_briefing` target=`程楠`、`workflow` target=`小周`(两门) → 不触发。**`meeting_action` action=`外发同步邮件` target=`团队（待你指定收件人）`**：正则锚 `^待`，target 以「团队」开头 → **不匹配 → 不亮**。与预期一致——这是正确行为（该门设计本意就是"收件人你来指定"，不该报警；报警只留给真·纯占位如单独的"待指定"）。✓
  - **E0/E1 低证据**：9 链证据 E2-E5，永不触发。✓
  - **R3+ 缺门**：有 R3 的链都带门；无门链(companion/news/restaurant)最高 R0-R1。✓
- 风险继承修复仍在（`console.js:44-46`）：turn 级 `dr.action_risk` 不污染只读结果卡，结果卡判 R0、不误标"需确认"。

### D. 校验完整性 = 4/5

- **矩阵同源**：`verify.js:35-45` 与 `measure.js:18-28` 的 `MATRIX` 逐字节相同（9 case，皮肤一致）。
- **verify 断言对得上声明**：`isStandardCard`(verify.js:22) = `pop-large && !/news-|scenario-/`。实证只隔离出 **4 张标准卡**（3×ListCard + 1×SectionCard）——`WeatherView`/`RestaurantView`/`TravelView` 带 `scenario-form`(scenario-forms.js:34/113/208)、新闻带 `news-`、ClarifyCard 虽是 pop-large 但每个 case 后面都有真结果卡覆盖 `resultIdx`（companion 无结果卡 → resultIdx=-1 跳过），故不会误测 ClarifyCard 为 430 标准卡。断言 #1/#4/#4.5/#7/#11/#7.1/#11.2/#6 都用全矩阵聚合器（maxOverflow/各 Bad 数组），不是抽查。✓
- **measure variant-aware**：`measure.js:107-110` 扫 `src.variants`，故 FailureCard / 问城市版被覆盖（measure 报该卡 ~261px、0 溢出）。
- **扣分点（P2 提示，非缺陷）**：`verify.js` 只遍历 `src.events`（base），**不扫 variants**。FailureCard、weather ASK 变体的 ClarifyCard 的 token/宽度**未被 verify 断言**，仅靠 measure 的溢出/重叠 sweep 覆盖。README:13「verify **跑满全矩阵**」措辞略满（应理解为"base 9 链全矩阵"）。UI-SPEC §12 #10(314) 措辞更准（明确 measure 含变体 FailureCard）。无功能风险，仅文案精度。

### E. 文档一致性 = 4/5

- **同步且互恰**：README §6(100-101)、CARD_TAXONOMY §6(191-225)、UI-SPEC §14.7(371-373)/不变量#10(393)/§12#10(314)/persona#7(390)/v1.2 footer(395)、review-v1.0.html ⑦(97-103) 全部到位，FailureCard / outcome:fail / verdict / annotations_resolved / 两条校验 / persona 多拍 描述一致，截图引用正确。CardStage=287 在 README/CARD_TAXONOMY/UI-SPEC/review-v1.0.html 一致。
- **扣分点（P2-1）**：**273 残留**与定稿 287 直接打架——见下方 P2。

---

## P0 / P1 / P2

**P0：无。**
**P1：无。**

### P2-1 · 273 残留（文档/注释与定稿 287 自相矛盾）
- `css/loona.css:119` 注释 `任何中心卡/形式高度封顶 = CardStage(273)` —— 紧挨着 **line 115** 正确写「CardStage = 287px 高(375−30−58)」，**同一文件内自打架**，最尴尬。
- `EXPLORATION.md:17` 「CardStage 高度固定 **273px**（375 − top36 − bottom66）」（旧几何）；`:33`「scale 卡片塞进 273」；`:37`「沉浸封面固定 206/236<273 天然安全」。后两处把 273 当作"定稿天花板"陈述，已错。（§1 是历史探索叙事，可辩护，但 line 33/37 描述的是胜出方案，应改。）
- 附带：EXPLORATION §1「封面 206/236」与 UI-SPEC §9(224)「封面 254/224」数字漂移；EXPLORATION:40「14 组合」与本轮 16 组合(含变体)不符。
- **修复**：
  - `css/loona.css:119`：`CardStage(273)` → `CardStage(287)`。
  - `EXPLORATION.md:17`：把痛点基线标成"改造前(旧几何 top36/bottom66=273)"，并补一句"定稿为 top30/bottom58=287（见 UI-SPEC §0）"；`:33` `塞进 273` → `塞进 CardStage`；`:37` `<273` → `<287` 且封面数字与 UI-SPEC §9 对齐；`:40` `14 组合` → `16 组合(含内置变体)`。

### P2-2 · 一条结果期口播 24 字，破"≤21 字"自律线（不会真截断）
- `cases/meeting_action.js:33`「我先写草稿，不直接发。按决策、风险、下一步三段。」= **24 全角字**，播放时 SectionCard 在场（`.sub-1line` 生效）。实测预算 ~37 字 → 不会出省略号，但本轮自律线是"每拍 ≤21"，这是唯一越线项；`email_briefing.js:32` 21 字压线。
- **修复**：拆成两拍或砍短，例如 → 「我先写草稿，不直接发。」(11) + 「按决策、风险、下一步三段。」(13)；email 那条 → 「先垫草稿：收到、四点前回。」(13)。与 round2 对 news/travel 砍到 18 字的处理一致。

### P2-3 · 失败 toast 时序在 ≥~1.8× 倍速下可能反序（默认速度无碍）
- `js/engine.js:407-409` `_onConfirmAction` 的 `发送失败` 用裸 `setTimeout(...,1000)`（**不随 speed 缩放**），而下一拍 FailureCard 的 `gap_ms:1800` 走 `_sleep` **会 ÷speed**。speed=1 时 1800>1000，顺序正确；但 speed≥~1.8× 时 `_sleep` 缩到 <1000ms，FailureCard 可能在"发送失败"toast 出现前/同时渲染——此后该 toast 反而出现在卡之上，并按自身 3400ms 计时滞留。
- 演示默认 speed=1，不触发；属健壮性边角。
- **修复（可选）**：把 `_onConfirmAction` 里两处 `setTimeout(fn, 1000)` 改为 `this._sleep(1000)`（随 speed 缩放，与 gap 同步），或把失败回执的 1000ms 收紧到 < `gap_ms` 的最小缩放值。

---

## 还值得做（留给团队，非阻塞）

1. **失败演示再加一种形态**：当前只有"R3 外发后超时"一种失败。可补"澄清后用户给的槽位无解"或"工具直接拒绝(权限)"，让 FailureCard 的 reason/next_options 多样性更足。
2. **verify.js 扫 variants**：把 `(src.variants||[])` 也纳入 verify 的 token/宽度断言，使 FailureCard / ASK 变体也被 11/11 体系覆盖，README「跑满全矩阵」就名副其实。
3. **FailureCard 口播去重**：FAIL 变体里「日程改好了，明天十五点」在 OPEN 末(line 36)和 FailureCard(line 61)各说一次，略冗。可把 FailureCard 首拍换成直接进入坏消息（"日程那步成了，但—"）。
4. **倒计时环死代码**：`confirmCard` 从不挂 `card._ring`，engine.js:325-337 的倒计时 tick 对确认门恒不执行，`content.countdown:30` 是 vestigial 数据。与文档「无倒计时」一致（非 bug），但可清理掉这段 inert 代码 + 移除 case 里的 countdown 字段，省读者困惑。
