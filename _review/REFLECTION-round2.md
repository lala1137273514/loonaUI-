# Loona 交互工作台 — Round-2 审计（fresh context）

审计方法：只读文件 + 图片（无浏览器/截图工具）。核对 `UI-SPEC.md` §8/§11/§12、`js/console.js`（contractOf/validateStep/scorecard/diff）、`js/engine.js`（字幕 clamp）、9 个 case 的 tts/text，以及 33 张终态/控制台/压力图。contractOf 风险逻辑用 Node 复跑了 workflow/email/news 三条链。

## Verdict
**demo-ready: YES** — 三项 round-1 修复全部落地且经文件/图片/逻辑三方交叉验证；无 P0，仅剩 2 个 P2 打磨项。

## Round-1 fixes — verified?

### ① 字幕 clamp（结果卡 1 行 / clarify·confirm·纯语音 2 行 / 静帧无光标）— ✅
- CSS 真值：`css/loona.css:134` 默认 `-webkit-line-clamp:2`；`:137` `.loona-stage.sub-1line .subtitle{-webkit-line-clamp:1}`；`:143` `.loona-stage:not(.is-playing) .subtitle .caret{display:none}`（静帧隐光标，CSS 侧）。
- 引擎切换正确：`js/engine.js:208` 结果卡 `toggle('sub-1line', comp!=='ClarifyCard')`（结果卡 ON=1 行，ClarifyCard OFF=2 行）；`:239` confirm 门 `remove('sub-1line')`（2 行）；`:407` `_subtitleSpeaking(false)` 念完/停时隐光标（JS 侧二次保险）。
- 图片印证：结果卡 `final_news_card/_email/_weather/_calendar/_meeting/_workflow` 字幕均 1 行、不压卡底、静帧无光标；`final_travel_clarify`（2 行 + 光标）、`final_travel_confirm`（2 行 + 光标）正确放宽；`final_companion`（纯语音）无卡无重叠。

### ② TTS persona 改写（结果口播 ≤~21 全角字 / 新闻报要点 / 餐厅"挑一家" / workflow lead）— ✅
- 字数：脚本逐句量结果期口播（ASCII 计 0.5），全部 ≤21。仅 meeting「定了一件：Companion 当主，Workbench 转调试。」名义 22，但其中 20 个是 ASCII（两个英文产品名），实际 12 个全角 + 20 半角 → 单行渲染宽度远小于 21 全角，工程上 OK；两条纯中文 21.0（news n1 / travel day2）正好压线、可接受。
- 新闻报要点：`news_briefing.js:65-67` highlight n1/n2/n3 口播是内容（"大模型上下文翻倍到两百万…""开源放了公开评测…""算力在往推理侧压…"），**不是**"第一条…"。grep 全 case：`第一条/第二条/第三条`仅出现在①代码注释（明确写"而非第一条…"）②`user_query`（用户原话，自然）。核验条 `:91`「先标未确认，官网票务还没更新。」符合 §11 主播"先判断再证据/标未确认"。
- 餐厅"挑一家"：`restaurant_quiet.js:12` `'行，我给你挑一家。'`；grep 全 case **无"定一家"**。订位才升 R3（`:28`）。
- workflow lead：`email_calendar_workflow.js:12` `'先看日历放不放，回信确认了再发。'`，与 `final_workflow.png` 字幕逐字一致。

### ③ console 契约 bug（turn 级 dr 不污染只读结果卡）— ✅
- 代码：`js/console.js:45` risk 取值链显式将 `dr.action_risk` 限定到 `ev.comp==='agent_step'`，结果卡兜底 `'R0'`；`:46` `confirmRequired = isGate || /R[34]/.test(risk)`——只读卡不会因 turn 级 `confirmation_required` 误标"需确认"。`:44` 注释即此修复说明。
- Node 复跑 **workflow 链**（turn dr = `R3 + confirmation_required:true`，最强用例）：第 6 步 `ListCard(wf)` 只读结果卡 = **risk R0 / 无"需确认"**；第 12、14 步 confirm 门 = **R3 + 确认门**；agent_step（DECISION_RECORD 侧轨，不上屏）继承 turn R3 标"需确认"——这是注释里写明的预期。复跑 email：`ListCard(mails)` = R0/无确认，scorecard maxRisk R3（来自 send 门）/confirms 1/**warns 0**。复跑 news（无门、dr R0）：maxRisk R0/confirms 0/**warns 0**（无伪"缺确认门"告警）。
- 图片印证：`c_compare_colB.png`（meeting 链高清）步 1-5（user/agent/tts/toast/agent）契约 chip 全 **R0**，无一枚"需确认"；scorecard「最高风险 R3 · 确认门 1」。`c_editor_zoom.png` meeting TTS#12 契约流 `delta·口播 › evidence E5 › risk R0`，无确认尾巴。

## Scores

| 维度 | 分 | 一句话 |
|------|----|--------|
| UI 合规（§8/§12 溢出·重叠·字幕行数） | **5/5** | 15 张终态卡 1 行字幕不压卡；clarify/confirm 放 2 行；clamp/sub-1line CSS+引擎双对齐；`s_email_stress`/`s_travel_stress` 超量内容被裁、包络不撑。 |
| 高级视觉（玻璃/沉浸/气泡/控制台） | **4/5** | 玻璃卡、aura 沉浸、bubble 三皮肤质感到位，眼睛真实资产静态居中；控制台 IDE 壳干净。扣分：`final_travel_imm` 沉浸封面用通用风景图（Day2"艺术与江畔"配古罗马柱、Day3 配人像），与文案弱关联（P2）。 |
| TTS persona（§11 说人话） | **5/5** | 9 场景开口均给判断/结论/下一步；新闻报要点不报序号、未确认明确标注；餐厅主推一家"挑一家"；天气先穿衣/带伞；陪聊先接情绪、求助才给一个小步；workflow 先讲多步顺序。 |
| 链路契约一致性（contractOf/validateStep/scorecard） | **5/5** | 只读卡 R0、确认门 R3、agent_step 侧轨继承 turn 风险——三类语义干净分离；R3+无门才告警，全 9 case warns=0；diff 用 LCS 对齐、scorecard 可作择优依据。 |

## Remaining issues
**无 P0。**

- **P2 — 沉浸封面图与文案弱关联**：`final_travel_imm.png` 三日封面是泛化风景素材，与 "Day2 艺术与江畔 / Day3 市井与离开" 语义不贴；演示可看出是占位图。建议换贴合素材或加轻 scrim 标题压住违和感。（视觉细节，非结构问题）
- **P2 — 两条纯中文结果口播正好 21.0 全角压线**：`news n1`「大模型上下文翻倍到两百万，长文一次喂得下。」与 `travel day2`「第二天看艺术，西岸美术馆到滨江，节奏正常。」无 ASCII 缓冲，处在 §8「≤21 全角」上界。当前 device-frame 图未见折行，但更窄字体/字号波动下有 1 字风险，建议各减 1–2 字留余量。

（说明：workflow ListCard `wf` 行内带"待确认/待你确认"徽章而该步契约 chip 为 R0——经核为**正确**分离：卡内容描述只读的多步待办状态视图，R3 确认语义落在两道独立 confirm 门，无矛盾。）

## Net assessment
三项 round-1 修复全部精准落地，且不是表面改字——字幕 clamp 在 CSS 与引擎两侧对齐、persona 改写经字数与 grep 双查、契约 bug 用最强的 R3-turn workflow 链复跑确认只读卡回到 R0。15 张终态卡 + 2 张压力图零溢出零重叠零越界字幕，控制台对比/择优逻辑自洽。仅剩沉浸封面选图与两条压线口播两个纯打磨项，均为 P2，不阻断演示——可判 demo-perfect。
