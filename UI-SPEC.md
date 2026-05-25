# Loona 工作台 · 统一 UI 规格（UI-SPEC）v1.0 — 本轮铁律

> **地位**：本文件是组件尺寸 / 排版 / 溢出处理的**唯一真值**。任何卡片、皮肤、case、控制台改动都必须先过这里。
> 与既有文档关系：颜色/玻璃/容器语义沿用 [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)；位置区与展示类型沿用 [`CARD_TAXONOMY.md`](CARD_TAXONOMY.md)；卡字段沿用 [`03_AGENT_CARD_CONTRACT.md`](03_AGENT_CARD_CONTRACT.md)。**本文件在“尺寸/溢出/可校验”维度上覆盖并细化它们。**
> 数值来源：Figma `1GXkRFjHMpcxDyPbIh2ZYf`（真值，§13 溯源）+ 现网 `css/loona.css` 实测调优值 + 812×375 舞台预算反推。
> 单位：除非特别说明，所有 px 均指**设备内部坐标**（812×375 未缩放系）。外层 `transform:scale(--device-scale)` 只整体缩放，不改变内部任何盒子尺寸。

---

## 0. 一句话铁律（The Iron Law）

> **每一类组件都有“固定尺寸包络”。内容超出包络，只允许三选一处理，绝不把包络硬撑变形、绝不移出屏、绝不压住别的区。**

三种合法溢出策略（§9 给每类组件指定主策略）：

| 代号 | 策略 | 形态 | 何时用 |
|----|------|------|--------|
| **(a) 滚动窗口** Scroll | 包络固定，**正文区**内部滚动（头/脚常驻），渐隐边 + TTS 高亮自动滚到行 | 同质多条目超出可视行数（ListCard 多行、SectionCard 多段、气泡串） |
| **(b) 换形式/渐进披露** Reform | 同一份数据换更密的形态，或 list→focus 钻取，或分页/轮播 | 信息维度变化（新闻 list↔focus、沉浸横向陈列、旅行单卡分段） |
| **(c) 降级裁剪** Clamp | 按优先级 `-webkit-line-clamp` / 截断 / `+N 更多`，核心信息永远可见 | 单字段过长（标题、摘要、确认内容） |

**违反任一条 = 风格漂移 / 演示尴尬。** 校验见 §12（可被 /browse 自动断言）。

---

## 1. 坐标系与设备框（已实现，保留不回退）

| 项 | 固定值 | 说明 |
|----|--------|------|
| 设备内部 | **812 × 375**（横版） | `.device` `width/height` 写死；对齐 Figma Frame 26/27 |
| 适配 | `transform: translate(-50%,-50%) scale(var(--device-scale))` | 按中栏可用空间整体缩放，**上限 1.18**（大屏不过放大）；内部永远按 812×375 渲染 |
| 机身圆角 | 30px；描边 `0 0 0 9px #14151a, 0 0 0 11px #2a2c33` | 横版机身 |
| 背景 | `#000` 纯黑 | 舞台底 |

> 陷阱回避：**禁止**回到“按容器直接压扁设备/卡片”的老做法（卡被压扁裁切）。唯一缩放手段 = 外层 `scale`。

---

## 2. 四个固定位置区（坐标 + z + 尺寸包络）

布局沿用 CARD_TAXONOMY §1（双眼 / StatusToast 右上 / CardStage 中心 / ConversationLine 底部）。本节给**死数值**。

| 区 | 选择器 | 固定定位（内部坐标） | z | 尺寸包络 | 放什么 |
|----|--------|------|----|---------|--------|
| 双眼舞台 | `.loona-eyes-bg` | `inset:0` | 0 | 812×375 满铺，静态底图 | Loona 双眼（真实资产，**静态不动**） |
| 内容遮罩 | `.content-scrim` | `inset:0` | 1 | 满铺，出卡时 `opacity 0→1` | 柔化背景让玻璃卡可读 |
| **StatusToast** | `.toast-slot` | `top:14; right:18` | 26 | 单条宽 ≤ **280**；纵向堆叠；**同一时刻最多 1 条可见**（出卡 `dismiss_on:'card'` 即清） | 任务/工具状态（搜索/创建/发送/已发/失败） |
| 右上气泡（次） | `.pop-slot` | `top:44; right:44` | 22 | 同 pop_small 包络；`max-width:55%`；同时刻 1 条（引擎裁旧） | 备用状态泡；**与 StatusToast 互斥不并存** |
| 顶部菜单 | `.vg-menu` | `top:10; right:44` | 25 | 24×24 | Figma `vg_menu` 图标（静态） |
| **CardStage** | `.content-area` | `top:30; left/right:0(pad 0 26); bottom:58` | 10 | **可用区 ≈ 760 × 287**；卡片**聚焦一张**居中 | 澄清/结果/确认/失败 卡 |
| **ConversationLine** | `.subtitle` | `bottom:14; 居中` | 30 | `max-width:74%`；1–2 行（§8） | ASR(用户) + TTS(Loona) **同位交替** |
| 停等横幅(工作台层) | `.wait-banner` | 中栏底，非设备内 | 50 | — | 澄清/确认门“等你拍板”（IDE 壳，不属产品 UI） |

**CardStage 高度推导（关键数字）**：`375 − top30 − bottom58 = ` **287px**。一切中心卡的 `max-height` 以此为天花板。（底 58 仍清 1 行字幕，顶 30 不压右上菜单/Toast。）

**区互斥规则（防重叠铁律）**：
- 结果卡呈现期：StatusToast 必须已 `dismiss_on:'card'` 清空（不与结果卡同框）。
- ConversationLine 在结果期恒 **1 行**（§8），其顶边 ≤ 52px(距底)，CardStage 底边 66px → **留 14px 安全间隙**。

---

## 3. 设计 Token（固定，写在 `css/loona.css :root`）

### 3.1 颜色 / 文本层级（沿用 DESIGN_SYSTEM §1，固化）
| token | 值 | 用途 |
|-------|-----|------|
| `--t0` | `#ffffff` | 标题 / pop_small 文本 / 行标题 |
| `--t1` | `#cccccc` | pop_large 正文 |
| `--t2` | `#999999` | 副文 / 时间戳 / 脚注 / meta |
| `--t3` | `#666666` | 三级弱化 / 标签前缀 |
| `--kw` | `#ffe500` | 句中关键词高亮 |
| `--btn-amber` | `#ffb200` | btn 主色 / 选中 / 倒计时环 |
| amber 梯度 | `--amber-hi #fff6e0 / --amber-1 #ffd47a / --amber-2 #ffb454 / --amber-3 #ff8a1e / --amber-4 #c75a00` | 琥珀语义色、徽章、高亮 |
| 情绪辉光（留接口，本期静态用 neutral） | neutral `#9ec5ff` · amber `#ffb454` | 眼睛辉光（决策机后话，**本期不驱动**） |

### 3.2 玻璃 / 描边 / 阴影（固化现网调优值）
| token | 值 | 用途 |
|-------|----|------|
| `--glass-bg-sm` | 顶光渐变 + `rgba(28,22,16,.58→.64)` 深底 | pop_small（黑.5 等效） |
| `--glass-bg-lg` | 顶光渐变 + `rgba(26,20,14,.78→.82)` 深底 | pop_large（黑.7 等效，更实） |
| `--glass-bg-q` | 琥珀.22 + 深底 | pop_small `role=query`（用户/ASR 染色） |
| `--glass-border` | `1px solid rgba(255,255,255,.16)` | 两玻璃统一描边 |
| `--glass-blur` | `blur(22px) saturate(1.5)` | 两玻璃统一背景模糊 + 提饱和（玻璃质感关键） |
| `--glass-edge` | `inset 0 1px 0 rgba(255,255,255,.22), inset 0 0 0 1px rgba(255,255,255,.04)` | 顶部高光边 |
| `--elev-card` | `0 22px 54px -16px rgba(0,0,0,.72), 0 3px 10px rgba(0,0,0,.42)` | pop_large 投影 |
| `--elev-pill` | `0 10px 26px -8px rgba(0,0,0,.55)` | pop_small / toast 投影 |

### 3.3 几何 — 圆角（固定阶梯）
| token | 值 | 用途 |
|-------|----|------|
| `--r-card` | **22px** | pop_large / 结果卡 / 确认卡（现网 `--radius`） |
| `--r-pill` | **16px** | pop_small / toast / clarify 选项容器 |
| `--r-btn` | **999px** | btn-fill / badge / 单选圈 / 倒计时环 |
| `--r-thumb` | 8–13px | 缩略图 / 媒体（list 8 · focus 12–13） |
| `--r-cover` | 16–18px | 沉浸封面（list 16 · focus 18） |

> Figma 容器名义圆角 24px；现网统一收到 **22px**（视觉更收敛、与机身 30px 形成层次），本规格以 **22** 为准，全局一致，不再各卡自定义。

### 3.4 字号 / 行高（固定 6 级，禁止卡内随意造）
| token | 字号 / 行高 | 用途 |
|-------|------------|------|
| `--fs-title` | **15 / 1.32**（600） | 卡标题 pl-title |
| `--fs-body` | **14 / 1.5** | 正文、行标题(lc-title)、节点、澄清问句 |
| `--fs-sub` | **13 / 1.4** | 次要正文（why/reason/section-text，13–13.5 收口到 13） |
| `--fs-meta` | **12 / 1.6** | 副文 / 时间戳 / 脚注 / meta |
| `--fs-micro` | **11** | kicker / 小副文 |
| `--fs-badge` | **10** | 徽章 / 可改 tag |
| `--fs-subtitle` | **15 / 1.45** | 底部字幕 |

数字一律 `font-variant-numeric: tabular-nums`（时间/温度/价格/倒计时不跳动）。字体 `--font`（`PingFang SC` 系）。

### 3.5 间距阶梯（固定，禁止中间值）
`2 · 4 · 6 · 8 · 9 · 10 · 12 · 14 · 18 · 20 · 26`
- 卡内 padding：pop_large **13(上下) / 18(左右)**；pop_small **10 / 14**。
- 卡内行/段 gap：正文 `8–9`；list 行 `7`；section 段 `4`。
- CardStage 左右内边距 **26**；卡间（多卡少见）`12`。

### 3.6 动效 Token（§10 展开）
`--dur-fast:150ms · --dur-mid:280ms · --dur-slow:480ms`；主曲线 `cubic-bezier(.2,.8,.25,1)`。所有“活着”的循环动效（呼吸/扫光/Ken-Burns）**只在 `.loona-stage.is-playing` 跑**，seek/暂停/静帧全显最终态，`prefers-reduced-motion` 一律停。

---

## 4. 两个底座容器（一切卡的来源）

沿用 DESIGN_SYSTEM §2：任何卡 = **pop_small（短）** 或 **pop_large（富）** 的内容变体，不造第三种容器。

### 4.1 pop_small（短气泡）— 固定包络
```
[ icon 32 ][ 文本 14/白 (可 .kw) ][ 可选 btn-fill ]
--r-pill 16 · padding 10/14 · gap 10 · min-width 120 · max-width 320 · 单行起，自动换行
```
- 高度**随内容**但**仅 1–3 行**（超出 clamp，见各用途）。承载：状态反馈 / ASR 输入(role=query) / 澄清短问 / toast。
- 位置：StatusToast 区（右上）或 CardStage（澄清时改用 ClarifyCard，见 §6）。

### 4.2 pop_large（富结果卡）— 固定包络 ★核心
```
┌ pl-head   [icon 32][标题 15/600 白 (clamp 1 行)][关闭X 24]   ← 固定，sticky
├ pl-divider 1px rgba(255,255,255,.12) 通栏                    ← 固定
├ pl-body   正文 / 行 / 段 —— 【这里是滚动窗口】                ← flex:1, overflow-y:auto
└ pl-footer 元信息 #999 12 / 按钮区                            ← 固定，sticky
--r-card 22 · padding 13/18 · gap 8 · 玻璃 lg
```
**固定尺寸包络（本轮新规，根治硬撑）**：
| 维度 | 固定值 |
|------|--------|
| 标准宽度 | **430px**（`min(430px, 86%)`，760 可用区里恒 430；密集卡更宽松少截断） |
| 宽媒体卡宽度（新闻聚焦/编辑卡） | **548px**（`min(548px, 94%)`） |
| 确认卡宽度 | `min(520, auto)`，min 300，居中 |
| **max-height** | **287px**（= CardStage；到顶即 body 内部滚） |
| pl-head 高 | ≈ **46px**（icon32 + padding 13） |
| pl-footer 高 | 内容定，**不滚**（≤ 2 行；按钮区 1 行） |
| pl-body 可视高 | ≈ 287 − 46 − 3(divider) − footer − 13(下 pad) ≈ **195–215px** |

**body 滚动窗口规范（策略 a 的落地）**：
- `.pl-body{ flex:1 1 auto; overflow-y:auto; }` + 顶/底**渐隐遮罩**（mask-image）暗示可滚。
- `.pl-head` / `.pl-footer` `position:sticky`（top/bottom），滚动时常驻——**头脚永不滚走**（修复现网“整卡一起滚、头部丢失”的 bug）。
- TTS 高亮行/段时，引擎对 body 做 `scrollIntoView({block:'nearest'})` 自动滚到活动行。

---

## 5. 排版规则（clamp 行数 = 固定）

| 元素 | clamp | 溢出策略 |
|------|-------|----------|
| 卡标题 pl-title | **1 行**（省略号） | c |
| ClarifyCard 问句 clr-q | **3 行** | c |
| list 行标题 lc-title | **1 行**（默认）/ 2 行上限 | c |
| list 行副文 lc-sub | **1 行**（省略号） | c |
| section 段文字 sec-text | **2 行** | c |
| 确认卡值 cc-row .v | **1 行**（content_summary 可 2 行） | c |
| 新闻列表标题 nfc-title / 摘要 nfc-sum | 1 行 / 1 行 | c |
| 新闻聚焦 标题/导语/影响 | 2 / 3 / 2 行 | c |
| 沉浸封面标题 nfi-title | list 3 行 / focus 2 行 | c |
| 字幕 subtitle | 结果期 **1 行** / 澄清确认 **2 行** | c（§8） |

> 行级 clamp 用 `-webkit-line-clamp` + `overflow:hidden`；横向用 `white-space:nowrap; text-overflow:ellipsis`。**核心信息（标题/结论/可信度）永远在前**，被裁的是尾部细节。

---

## 6. 展示类型 · 固定尺寸包络（中心卡 8 类）

所有类型共用 pop_large 底座（§4.2）→ 继承 430 宽 / 287 max-h / 头脚常驻 / body 滚。下表给**特有的行高与可视行数预算 + 主溢出策略**。

| 类型 | 选择器 | 行/段尺寸 | 舒适可视量 | 超量策略 | 备注 |
|------|--------|----------|-----------|----------|------|
| **ClarifyCard** | `.clarify-card-wrap` | 问句 3 行 + ≤2 选项(btn h32) | 全显 | **c** 问句 clamp | 居中(`.single`)，不滚；选项横排 |
| **ListCard** | `.list-card-wrap` | lc-row **36px**(1 行) / **52px**(带 sub) | **~5 行** | **a** body 滚 + 渐隐 | 邮件/日程/新闻条/工作流步骤 |
| **SubjectCard** | `.subject-card-wrap` | headline(2 行) + meta + N 行 | 1 主体 + ~3 行 | **a** body 滚 | 天气(回退)/餐厅(回退) |
| **SectionCard** | `.section-card-wrap` | sec-block **≈45px**(label+2 行 text) | **~3–4 段** | **a** body 滚 | 旅行 3 天 / 会议 3 段 |
| **ConfirmCard** | `.confirm-card-wrap` | 摘要 ≤4 行 + 按钮区(ring+2 btn) | 全显 | **c** 值 clamp | 居中聚焦；**必须全可见**（动作+按钮不滚） |
| **FailureCard** | `.failure-card-wrap` | fc-line(成功/失败) + reason + 下一步 | ~4 行 | **a** body 滚 | 永远给“下一步”脚注 |
| **NewsList/Focus** | `.news-card-list/-focus` | 见 §7 | 见 §7 | **b**(list↔focus) + a/c | 三形式由皮肤选 |
| **pop_small(状态/澄清短)** | `.pop-small` | 1–3 行 | 全显 | **c** | StatusToast / role=query 见 §2 |

**行高度量（固定）**：
- `lc-row`：单标题 36 / 标题+副文 52；左 lead 宽 ≥46（时间/序号）或 6px dot。
- `sec-block`：padding 4/9，label 13/600，text 13/1.38 clamp 2 → ≈45。
- `cc-row`：12.5/1.45，k 宽 44，v clamp 1 行。
- `btn-fill`：**h32 / px16 / r999**（固定，三态 primary/ghost/disabled）。
- 倒计时环：**34px** SVG，描边 `#ffb200`。
- 徽章/kind-badge/day-badge/avatar：**圆 32**（avatar 36 / 单选圈 20 / dot 6）。

---

## 7. 三种「展现形式」皮肤 · 固定包络（form = 形态，非颜色）

皮肤 = 展现形式（沿用 CARD_TAXONOMY §5）。每种 form 有 **list（多条）/ focus（单条）** 两态。全部受 287 天花板约束。

| 形式 | 皮肤键 | 选择器 | 固定宽 | 固定高 / 滚动 | 溢出策略 |
|------|--------|--------|--------|--------------|----------|
| 编辑卡 list | glass | `.news-card-list` | 430(pop_large) | row(thumb 60×44) ~53px；body 滚 | a + c |
| 编辑卡 focus | glass | `.news-card-focus` | **548** | media `184×≥152`；右文 clamp(标题2/导语3/影响2) | c（高度 ≤287 靠 clamp） |
| 对话气泡 list | bubble | `.nf-bubble-thread` | **390** | 每泡 ~56px；thread 超高 → 滚 | a |
| 对话气泡 focus | bubble | `.nfb-thread-focus` | **448** | 富泡 media `122×≥148` + 右文 clamp | c |
| 沉浸 list | aura | `.nf-imm-list` | 100%(居中) | 封面 **158×224**，横向 track 滚 | b（横向陈列） |
| 沉浸 focus | aura | `.nf-imm-focus-wrap` | **452** | 全幅封面 **高 254** | c（文字压 scrim，clamp） |

场景默认形式（`case.default_skin`，沿用 CARD_TAXONOMY §5.4）：
- 天气 / 旅行 / 餐厅 → **aura(沉浸)**；非 aura 优雅回退到 SubjectCard/SectionCard（回退节点带 `.scenario-form`）。
- 新闻 → glass(编辑卡)，三形式全做。
- 邮件简报 / 日程 / 邮件×日程 / 会议 → glass(编辑卡=结构卡)。
- 陪聊 → 纯对话（无卡）。

> **沉浸封面高度 254 / 224 < 287 → 天然满足天花板。** 横向超量用 track 横滚（`overflow-x:auto` + scroll-snap proximity + 拖拽/滚轮，见 `news-gestures.js`），**不纵向撑高**。

---

## 8. ConversationLine / 字幕（根治 2 行压卡）

| 阶段 | 行数 | 字数上限 | 几何安全 |
|------|------|---------|----------|
| 结果 / 口播（PRESENT，卡在场且顶对齐） | **恒 1 行** | ≤ **21 全角字**（详情留卡里） | 1 行盒高 ≈38，顶边距底 ≈52 < CardStage 底 66 → 间隙 14 ✓ |
| 澄清 / 确认（卡短、`.single` 垂直居中） | ≤ **2 行** | 自然语气优先 | 卡底远高于 2 行字幕顶(≈74) → 不重叠 ✓ |
| 纯陪聊（无卡） | 1–2 行 | 自然 | 无卡，无重叠风险 |

- ASR(用户)：`role=user`，左侧“你”小标 + 琥珀描边；TTS(Loona)：`role=loona`，带闪烁光标 `.caret`（念读时显，停时隐）。
- **同位交替**：先用户气泡，后 Loona 口播，同一底部位置（不左右分栏、不上下堆叠）。
- 实现：结果期字幕 `-webkit-line-clamp:1`；澄清/确认期才放开到 2。引擎按当前活动事件类型切 clamp（见 §12 校验 #7）。

---

## 9. 溢出策略总表（每类组件的主策略 = 固定）

| 组件/形式 | 主策略 | 兜底 |
|-----------|--------|------|
| ListCard 行超 ~5 | **a 滚动** | c 副文 clamp 1 行 |
| SectionCard 段超 ~4 | **a 滚动** | c 段文 clamp 2 行 |
| SubjectCard 行超 ~3 | **a 滚动** | c headline clamp 2 行 |
| ConfirmCard | **c 裁剪** | （动作/按钮不可滚，必须全可见） |
| 新闻 宽问 vs 钻取 | **b list↔focus** | focus 内 c clamp |
| 新闻 多条对比 | **b 顺序聚焦**（一条接一条，不并排挤屏） | — |
| 沉浸多封面 | **b 横向 track 滚** | — |
| 单字段过长（标题/摘要/确认值） | **c clamp** | — |
| 字幕过长 | **c clamp**（结果期 1 行） | 详情进卡 |

---

## 10. 动效规范（节制、可控、可静帧）

| 动效 | 值 | 门控 |
|------|----|------|
| 卡入场 | `glass-in .5s cubic-bezier(.2,.8,.25,1)`（位移+缩放，跑一次） | 仅 is-playing |
| 行/段级联入场 | `row-in .42s`，delay .10→.30（逐条 ~50ms） | 仅 is-playing |
| 高亮迁移 | `.22s` background/box-shadow/transform | 任意 |
| 皮肤入场 | bubble `.5–.6s` / aura `.55s` | 仅 is-playing |
| 常驻“活着” | bubble 呼吸 6.5s / aura 光晕 4.6s / 余烬 6–7.5s / Ken-Burns 14s | **仅 is-playing** |
| 离场 | glass .3s / bubble 破 .34s / aura 回吸 .3s | — |

铁律：
- **入场用 transform**（一次性）；**常驻效果用非 transform 属性**（border-radius / box-shadow / opacity），避免同属性动画打架。
- `.loona-stage:not(.is-playing)`（seek / 暂停 / 静帧 / 截图）→ 卡与行**直接显最终态**，关所有循环动效（防截图露馅）。
- `@media (prefers-reduced-motion:reduce)` → 全关。
- **任何动效不得改变布局高度**（呼吸/高亮不撑卡）；不得驱动眼睛（本期眼睛静态）。

---

## 11. TTS 文案规范（按职业 persona 说人话）

> 字幕受 §8 尺寸约束（结果期 1 行 ≤21 字），但**语气必须自然**——是“一个专业的人在说话”，不是念字段。详情留卡里，口播只给判断/结论/下一步。

| 场景 | persona | 开口先说什么（必守） | 禁止 |
|------|---------|---------------------|------|
| 新闻 | **主播** | 先结论再要点；逐条高亮时一句一条要点 | 念链接/来源全名/P3 噪音；不把爆料当事实（无官方源标“未确认”，先判断再证据） |
| 旅行 | **规划师/向导** | 先给整体基调（“轻松三天，不折腾”）再逐日讲亮点/体力；留“可改” | 先念全文行程；分钟级精确；硬逼用户补槽 |
| 天气 | **天气主播** | **先穿衣/带伞建议**，再给数据 | 先报湿度/风速/概率；多城混报（按城分段，逐城高亮） |
| 陪聊 | **先接住情绪的人** | 用用户原话接住、站在同侧、降压；求助才给**一个**很小下一步(A≤A1) | 给方法论清单、下诊断、强行正能量、把“算了/烦死了”当取消删除 |
| 邮件简报 | **助理** | 先说“今天真正要处理的是哪封”；草稿≠发送 | 念邮箱地址/message id；发送前不确认 |
| 日程 | **日程助理** | 先说哪段紧/哪有冲突/哪有真空档 | 把“找到空档”说成“已创建”；念 event id |
| 邮件×日程 | **协调者** | 讲可见的多步（读信→查日程→拟草稿→待确认）；两个写动作分开确认 | 自动外发；替用户答应未核实的事 |
| 餐厅 | **懂你的食客朋友** | 先给一个主推 + 理由（贴场景），至多一个备选 | 列清单；编菜单/排队/营业；无位置瞎推“附近” |
| 会议 | **会议秘书** | 先讲决策，再风险，再下一步；区分已定/未定/待确认 | 逐字念纪要；把没定的说成定了；从材料里自动推断收件人 |

口播与卡同步：`tts.highlight` 指向 `card_id` 或行 `id`，引擎高亮并滚到该行（§4.2）。反思 agent **以对应职业视角**审稿。

---

## 12. 自动校验清单（/browse 可断言；零溢出零重叠）★

度量在**设备内部坐标**进行（对 `.content-area` 等用 `getBoundingClientRect()`，比较相对关系不受 scale 影响；绝对宽度断言时除以 `--device-scale`）。每条给**通过判据**。

设 `S = .content-area`(CardStage)，`C = S` 内当前聚焦卡（`.pop-large` 或 `.news-form/.scenario-form` 根），`SUB = .subtitle`，`TS = .toast-slot`。

| # | 断言 | 通过判据 |
|---|------|---------|
| 1 | **卡不超 CardStage（纵向）** | `C.height ≤ S.clientHeight + 1`（内部滚则 C 被 max-height 截 = 通过） |
| 2 | **超高必可滚且头脚常驻** | 若 `bodyEl.scrollHeight > bodyEl.clientHeight+1` 则 `getComputedStyle(bodyEl).overflowY ∈ {auto,scroll}` 且 `.pl-head/.pl-footer` 在 scrollTop=0 与 =max 时均在 C 视口内 |
| 3 | **卡不超 CardStage（横向）** | `C.left ≥ S.left−1 && C.right ≤ S.right+1`（沉浸 track 内部横滚不算 C 超界） |
| 4 | **卡 ↔ 字幕不重叠** | `SUB` 显示时 `C.bottom ≤ SUB.top + 1` |
| 5 | **卡 ↔ StatusToast 不重叠** | 结果卡在场时 `TS.children.length === 0`（已 dismiss）**或** 两 rect 不相交 |
| 6 | **字幕行数** | 结果/口播步：`SUB.height ≤ ~40`（1 行）；澄清/确认步：`SUB.height ≤ ~64`（2 行） |
| 7 | **固定宽度** | 标准卡 `C.offsetWidth/scale ≈ 430(±2)`；新闻聚焦 `≈548`；气泡 list`≈390`/focus`≈448`；沉浸 focus`≈452` |
| 8 | **设备框固定** | `.device.offsetWidth==812 && .device.offsetHeight==375`（未缩放） |
| 9 | **眼睛在位且静态** | `.loona-eyes-bg` 存在、`background-image` 非空、无 transform 动画 |
| 10 | **覆盖面（全矩阵，无抽查死角）** | 9 case × 各自合法皮肤(+ 内置变体) 逐个跑到终态/聚焦/确认/澄清，断言 1–7 + 11 **全矩阵**逐组合过（`verify.js` 现跑满 token/宽度/溢出/字幕，非抽查；`measure.js` 跑全步溢出/重叠，含变体 FailureCard） |
| 11 | **token 合规** | 卡 `border-radius==22`；btn `height==32 && border-radius>=999`；标题 `font-size==15`；正文 `==14`；无硬编码偏离 §3 的字号/圆角 |
| 12 | **静帧无露馅** | `.loona-stage` 去掉 `is-playing` 后，`.pop-large/.lc-row/.sec-block` 计算 `animation-name==none` |

**皮肤矩阵（#10 跑哪些）**：
- 新闻：glass / bubble / aura ×（list 态 + focus 态）。
- 天气 / 旅行 / 餐厅：aura(沉浸) + glass(回退) + bubble(回退)。
- 邮件 / 日程 / 邮件×日程 / 会议：glass（+ bubble/aura 材质不改布局）。
- 陪聊：无卡（断言 4/6 仍跑：字幕不越界）。

> 校验脚本产物落 `_review/`（截图 + `fits.txt` 度量表）。任一条 fail = 阻断，回 §0–§9 修。

---

## 13. Figma 溯源（节点 ID + 已拉真值）

| 组件 | 节点 | 已拉真值（本轮 MCP 复核） |
|------|------|--------------------------|
| face 双眼 | `1:161`（Frame26 `1:160`/Frame27 `1:170`）/ `1:64` | 812×375 横版，每眼 280×280，居中相邻，白心高光 + 外琥珀辉光（真实资产 `assets/loona_face.png`） |
| pop_small | `58:5098`、`172:48624` | r24/pad12/min-w120/icon32/text14·19.6/pos right44·top44（现网收圆角到 16） |
| **pop_large** | `172:49237` | **400×300**；head 32 @(20,20)，divider y60，content slot **360×265**；`list_slack_massage` 行 **37px**、行距 **57px**（5 行）→ 印证“多行须滚动窗口” |
| btn-fill | `162:43968` | h32 / px16 / r999 / `#ffb200` + 玻璃内阴影 |
| list_slack_* | `214:37827` 等 | message / user / thread 行 |
| 状态 .riv | globe / loading / paperplane / circle_checkmark / ciecle_xmark / mail_scroll | 渲染图落 `assets/icons/*.png`（32px，禁 emoji 替代） |

> 资产 URL 7 天过期；尺寸/几何以本文件为准，Figma 为视觉真值来源，需更高保真再按节点 ID 重拉。

---

## 14. 交互模式（Interaction Patterns）— 跨场景复用，本轮固化

> 这些是验证过的可复用交互范式；新场景遇到同类需求**直接套**，别另造。

### 14.1 槽位式澄清（Slot-fill Clarify）
缺 / 补必填槽位时用 **ClarifyCard 槽位卡**，不要纯问句：
- 卡显示**结构化槽位**：必填（已填=值 + ✓ / 待填=醒目琥珀实框「待填」）+ 选填（虚线 chip，可补）。
- **卡 ≠ TTS**：卡呈现槽位；TTS 另说人话——先承接（上一拍），再问（这一拍）。
- 触发：缺必填 → **问一次不猜**（旅行 destination+duration、天气 city、餐厅 location、日程 time…）；已填 → 确认 + offer 选填。
- 是「门」：无 X，靠 `[选项]` 决策（同确认门）。实现 `clarifyCard({title,question,slots:{required:[{label,value?}],optional:[...]},options})`。

### 14.2 列表 → 单项召回（List → Focus Drill）
同一份多条目数据，两态：**扫读**（多条概览 + 逐条高亮，口播给简短头条 1 行）；**钻取**（用户问「具体讲讲第 N 条 / 那天」→ 单条铺全的聚焦卡 + persona **多拍**解说，每拍 1 行 ≤21 字，串成完整播报）。复用已取数据，不重搜。已落地：新闻 `NewsList→NewsFocus`（主播）、旅行 `TravelView→TravelDayFocus`（导游）。

### 14.3 沉浸聚光（Immersive Spotlight）
横向封面陈列（`.nfi-track`）口播到第 N 张：那张**抬起放大 + 暖光描边 + 轻呼吸**，其余 `opacity/saturate` **压暗后退**，并 `scrollIntoView({inline:'center'})` 滚到中间。一眼看出在讲哪张；呼吸仅 is-playing。

### 14.4 确认门 / 澄清门 = 显式决策
`action_risk ≥ R3` 的确认门 **只有 [确认]/[取消]**，**无 X、无倒计时**（确认须显式，不 countdown 自动执行）。澄清门同理（靠选项决策，无 X）。

### 14.5 动作回执 + 卡片收起 ↔ 查看详情
- **确认决策 → 状态 toast**：确认 → `发送中…`(spinner) → `已发送 ✓`（带「查看详情」）；取消 → `已取消`（短暂，**不做「取消中」**，即时无在途）。
- **结果卡 X = 收起**（非门）：卡淡出，右上留「<标题> · 查看详情」回执 toast；查看详情 → 重开卡。已发送回执 → 查看详情 → 只读回执卡（X 再收起回 toast）。
- 落点四区：**StatusToast = 持久任务回执 / 入口，CardStage = 可展开详情**。

### 14.6 toast = 集中状态（绑工具调用）
toast 收敛到固定几种，icon + 默认文案集中在 `components.js TOAST_STATE`：`搜索中(web_search) / 核验中 / 读取中(读私域) / 整理中 / 发送中 / 保存中 / 完成 / 没成功`。不为每条内容造新文案。沉浸态用呼吸光晕（**不旋转宽胶囊**，转动感交给方形 icon spinner）。

### 14.7 失败 / 部分成功（Honest Failure）★REQ-FAIL-001
动作失败**绝不假称成功**，也不静默吞掉：
- **回执诚实**：确认门 `content.outcome:"fail"`（+ `fail_label`）→ 回执走 `发送中… → 发送失败`，**不出**「已发送 ✓ · 查看详情」假回执；随后渲染 **FailureCard**。
- **拆开成功/失败**：`completed[]`(✓) 与 `failed[]`(✕) 分列，不混为一谈；依赖顺序里**前序成功不因后序失败回滚**（如日程已改不因邮件失败而撤回）。
- **谁知道 / 谁不知道**：明确标出受影响方的认知状态（"小周还不知道改期"）。
- **永远给下一步**：`next_options[]`（重发 / 换渠道 / 手动）作脚注，TTS 多拍诚实播报（"日程改好了…但邮件没发出去…要我重发吗？"）。
- 演示固化为 case **内置变体**（`variants:[{name,events}]`，见 README），与「全成功」并排对比，证明失败也不慌。
- 契约校验（控制台 `validateStep`）同步加严：**私域数据**(read_private_data) 全链须声明授权(OAuth/已连)、**外发动作**收件人须明确，违反即 ⚠。

---

## 15. 不变量速查（提交任何改动前自检）

1. 设备 812×375 固定，只用外层 `scale` 适配；**绝不压扁内部**。
2. 每类卡有**固定宽 + max-height 287**；超出走 §9 的 a/b/c，**绝不硬撑**。
3. pop_large **头脚常驻、正文滚**；高亮自动滚到活动行。
4. 四区不重叠：结果期字幕 1 行、toast 已清；澄清/确认才放 2 行字幕。
5. 皮肤 = **形态**（编辑卡/气泡/沉浸），不是颜色；一套 token 全局一致。
6. 动效仅 is-playing 跑循环、静帧显终态、reduced-motion 全关、**不改高度、不驱动眼睛**。
7. TTS 按 persona 说人话（§11），口播给判断/结论/下一步，详情留卡；**深度全场景拉平**——天气(主播)/邮件(助理)/餐厅(店长)/会议(参谋)与新闻/旅行同档**多拍**(每拍 ≤21 字)。
8. 字号/圆角/间距只取 §3 的固定阶梯；新组件先回此文件，再回 Figma 节点。
9. 交互按 §14 范式：缺必填走**槽位卡**；多条目用**列表↔单项召回**；确认/澄清=**门**(无 X/无倒计时)；结果卡 **X=收起到回执 toast**；toast 用**集中状态**。
10. **失败诚实**（§14.7 / REQ-FAIL-001）：不假称成功、拆开成功/失败、标谁不知道、永远给下一步；私域读取须声明授权、外发须明确收件人。

*v1.2 · 本轮铁律 + §14 交互范式(含 14.7 失败/部分成功) + persona 全场景拉平 + §12 校验跑满全矩阵(11/11)。后续每次增量后由 reflection agent 对照 §12 校验 + §11 persona 审稿，迭代至 9 场景 × 全形式实测零溢出零重叠。*
