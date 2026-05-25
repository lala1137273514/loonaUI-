# Loona 展示元素分类 & 布局规范（统一样式的依据）

> 目的:把 9 场景的所有展示元素**按位置 + 按状态/结构**统计归类,定一套"展示类型",
> 组件库从「**按 case 分**」改成「**按展示类型分**」,case 只填数据。
> 同时解决小屏(812×375 横版)多卡拥挤问题:**能用单卡+列表的，绝不铺多卡**。
> **本文件管"分类 + 4 位置区 + 类型字段";固定尺寸/溢出处理/校验以 [`UI-SPEC.md`](UI-SPEC.md) 为准**(CardStage **287px**、各类型固定包络、三溢出策略、§12 校验)。
> **交互模式**(槽位澄清 / 列表→单卡召回 / 沉浸聚光 / 确认门+回执 / 失败拆解)见 [`UI-SPEC.md §14`](UI-SPEC.md);本文件 §6 给字段速查。

---

## 0. 为什么要重构

- 屏是 **812×375 横版,很小**。现在 新闻/邮件/日程/旅行/会议 都铺 **3 张卡** → 屏占比挤、字被压小、阅读差。
- Figma 真实做法(查消息 `172:49237`)就是**一张 pop_large + 多行 list**,不是多张卡。
- 现组件库按 case 分(weatherCard/emailCard/…),重复且难统一;应**按展示类型分**。
- 位置语义错位:**用户 ASR 现在错放在右上角 toast**;按理 ASR 是「对话」,该和 TTS 同位(底部),右上角只放**任务状态**。

---

## 1. 四个固定位置区（已修正 ASR / toast）

| 区 | 位置 | 放什么 | 不放什么 |
|---|---|---|---|
| 双眼舞台 | 中心(静态) | Loona 形象(真实双眼) | — |
| **状态条 StatusToast** | **右上角** | **任务/工具状态机**:正在查日程 / 创建中 / 搜索中 / 发送中 / 已发送 / 失败 | 用户说的话、结果内容 |
| **中心卡区 CardStage** | 舞台中下,浮于眼前 | 澄清 / 结果 / 确认 / 失败 卡 —— **同一时刻聚焦一张** | 状态文字、对话文字 |
| **对话字幕 ConversationLine** | **底部** | **ASR(用户) + TTS(Loona) 同位,按先后交替** | 任务状态、长列表 |

**修正点**
- ❌ 旧:用户输入(ASR)= 右上角 pop。　✅ 新:**ASR = 对话,走底部字幕**,和 TTS 同一位置(先用户气泡、后 Loona 口播)。
- ✅ 右上角 toast 只放**任务状态**(创建日程 / 搜索 / 发送…),即 §4 感知协议的"干活存在感"。

---

## 2. 中心卡分类

### 2.1 按状态（角色）—— 用户说的"澄清卡 / 结果卡"两类 + 确认 + 失败
| 状态 | 类型 | 何时 |
|---|---|---|
| **澄清** | `ClarifyCard` | 缺必填 / 要确认偏好:问一个问题 + ≤2 选项(同时 TTS 念出) |
| **结果** | `ResultCard`（下分 3 结构） | 交付答案 |
| **确认** | `ConfirmCard` | R3/R4 动作门(发送/创建/删除/保存) |
| **失败** | `FailureCard` | 部分/全部失败,拆开成功与失败 + 下一步 |

### 2.2 结果卡按结构（解决小屏：优先单卡）
| 结构 | 形态 | 适合 |
|---|---|---|
| **ListCard** | 头部 + 分隔线 + N 行(typed row) + 脚注 | 同质多条目:邮件 / 日程 / 新闻 / 工作流步骤 |
| **SubjectCard** | 头部 + 1 主体 + 辅助行/标签 + 脚注 | 单一对象 + 细节:天气(1城) / 餐厅(主推) |
| **SectionCard** | 头部 + 分组段(每段 label[+badge] + 行) | 分段产物:旅行(3天) / 会议(决策/行动/风险) |

> 三种结构**共用同一张 pop_large 底座**(头部/分隔/正文/脚注),只是正文排布不同。TTS 高亮从"卡级"细化到"行/段级"。

---

## 3. 9 场景卡片重构（现状 → 适中方案）

| 场景 | 现在 | 适中方案 | 类型 | 卡内行/段 |
|---|---|---|---|---|
| 陪聊 | 无卡 | 无卡(纯对话) | — | — |
| 天气 | 1 卡(已含日行) | **维持 1 卡** | SubjectCard | 城市主体 + N 日行(date/temp/risk) |
| 新闻 | **3 卡** | **1 卡 + N 新闻行** | ListCard | rowNews(标题+可信度+来源·时间) |
| 邮件 | **3 卡** | **1 卡 + N 邮件行**(=Figma查消息) | ListCard | rowMail(发件人+主题+P级+时间) |
| 日程 | **3 卡** | **1 卡 + N 事件行** | ListCard | rowEvent(时间+标题+状态) |
| 邮件日程联动 | 1 卡(已含步骤) | **维持 1 卡** | ListCard(steps) | rowStep(步骤名+状态) |
| 餐厅 | 2 卡(主+备) | **1 主推卡 + 备选压成行** | SubjectCard | 主体 + meta(距离·价格·tags) + 备选行 |
| 旅行 | **3 卡** | **1 卡 + 3 天分段**※ | SectionCard | 每天段(主题+pace+节点行) |
| 会议 | **3 卡** | **1 卡 + 3 分组** | SectionCard | 决策 / 行动项 / 风险,每组 N 行 |

※ 旅行是否折成单卡 = 待确认(它是 spec 里典型的"分段产物")。

**净效果**:新闻/邮件/日程/旅行/会议 五个场景从「3 卡」收成「1 卡」→ 卡更大、字更大、屏占比合理、阅读顺。

---

## 4. 组件库按"展示类型"重组（取代按 case 分）

顶层组件(8 类):
```
StatusToast        右上角任务状态(icon + 文本)
ConversationLine   底部 ASR/TTS 文本(role + text)
ClarifyCard        中心:question + ≤2 option
ListCard           中心:header + rows[] + footer
SubjectCard        中心:header + subject + meta + footer
SectionCard        中心:header + sections[]
ConfirmCard        中心(聚焦):摘要 + 按钮 + 倒计时
FailureCard        中心:成功/失败 + 下一步
```
**行 row 系统**(ListCard / SectionCard 复用,一处定义到处用):
```
rowMail   发件人 · 主题 · P级badge · 时间
rowEvent  时间 · 标题 · 状态badge(已确认/冲突/空档)
rowNews   标题 · 可信度badge · 来源·时间
rowStep   步骤名 · 状态badge(已完成/待确认/失败)
rowNode   圆点 · 名称 · 可改tag        (旅行节点)
rowUser   头像 · 姓名 · 邮箱 · 单选圈   (候选确认)
```
case 文件只写 `{ 类型 + 字段数据 }`,不再每场景一个卡函数。

---

## 5. 字段表（每类型：位置 + 信息字段）

| 类型 | 位置 | 信息字段 |
|---|---|---|
| StatusToast | 右上 | `state_visual`(searching/loading/sending/done/fail) · `text` |
| ConversationLine | 底部 | `role`(user/loona) · `text` · `kw?`(关键词高亮) |
| ClarifyCard | 中心 | `question` · `options[≤2]{label}` |
| ListCard | 中心 | `icon` · `title` · `status?` · `rows[]{type,…}` · `footer` |
| SubjectCard | 中心 | `icon` · `title`(主体) · `headline`(主张/life_action) · `meta[]`/`rows[]` · `badges` · `footer` |
| SectionCard | 中心 | `icon` · `title` · `sections[]{label,badge?,rows[]}` |
| ConfirmCard | 中心(聚焦) | `action` · `target` · `impact` · `content_summary` · `reversible` · `countdown` |
| FailureCard | 中心 | `completed[]` · `failed[]` · `reason` · `next_options[]` |

> 字号统一(Figma token):标题 14 / 行 13 / 副文·脚注 12;颜色 t0 #fff / t1 #ccc / t2 #999。
> 玻璃:pop_small 黑.5 / pop_large 黑.7;圆角 24;模糊 25。

---

*确认本表后,组件库按 §4 重组,9 场景 case 改为填数据,并修正 ASR↔底部 / toast↔右上 的位置。*

---

## 5. 「展现形式」皮肤（form skin）—— 皮肤 = 形态，不是颜色

> 重要修正:之前的 glass/bubble/aura 只换了**材质/颜色**(同一套卡片布局)。
> 正确定义:**皮肤 = 展现形式(form)** —— 同一份数据渲染成**结构不同的形态**,
> "不一定还是卡片"。先在**新闻 case** 上落地，再泛化到其它场景。

### 5.1 三种形式（data-skin 选 form）

| 皮肤键 | 形式 | 形态 | list 态 | focus 态 |
|---|---|---|---|---|
| `glass` | **编辑卡** Editorial Card | 结构化卡片(玻璃) | 缩略图+标题+meta 行 | hero 大图 + 摘要 + 为什么值得看 |
| `bubble` | **对话气泡** Conversational Bubble | **不是卡片**:Loona 把内容「说」成一串暖凝胶气泡 | Loona tag + 气泡串(缩略图+标题+meta) | 富气泡(大图+摘要+引语+meta) |
| `aura` | **沉浸聚焦** Immersive Spotlight | 图片为主,文字压 scrim | 封面卡横向陈列(杂志架) | 全幅封面,文字叠底部 |

- 形式与 **list↔focus 正交**:每种形式都有 list / focus 两态。
- 切皮肤 = **原地换形式**(engine `_rerenderNews` + View Transition),同一份数据不同形态。
- 设计依据:NYT/BBC「热点块放大」层级 + VUI 多模态(语音×视觉互补、钻取**复用已取数据不重搜**)。

### 5.2 新闻内容模型（一套字段喂三形式，密度分层）

```
item = { id, image, title,
         summary,                 // 一行摘要 → 列表用
         lead, points[], why_it_matters,   // 全导语 + 关键要点 + 影响 → 聚焦用(高密度)
         source, time, confidence(high|medium|unconfirmed), tag }
```
- **列表态(中密度，可扫读)**:`缩略图 + 标题(1 行) + 摘要(1 行) + 来源·时间·可信度`。
- **聚焦态(高密度，介绍要全)**:横排 = `左大图 + 右[kicker / 标题(全) / 导语 lead / 关键要点 points / 为什么值得看 / meta]`。
  单卡信息密度**远高于**列表行（这是单卡存在的意义）。
- **TTS**:直播报「关键总结」——每条一句要点(列表时逐条高亮)，细节在卡里看。
- 真实样图在 `assets/news/`。

### 5.3 list → focus 交互（小屏聚焦法）

| 用户意图 | 态 | 形态 |
|---|---|---|
| 宽问(今天有什么) | **list** | 多条(当前形式的列表态) |
| 钻取 1 条(第一条讲啥) | **focus 单条 hero** | 大图/富气泡/全幅封面 |
| 钻取 2 条(那两条呢) | **顺序聚焦** | 一条讲完再下一条(不并排挤小屏) |
| 核验(真的吗) | **focus 单条** | 强制 `unconfirmed`,先判断再给证据 |

> 组件:`NewsList{title,intro?,items[]}` / `NewsFocus{item}`；builder 按 `data-skin` 选 form。
> 验证图:`_review/review-news.html`（3 形式 × 3 态）。

### 5.4 九场景 × 默认形式（泛化）

每个场景载入时落到最合适的默认形式（`case.default_skin`，`loadCase` 自动应用；顶栏仍可手动切）。
引擎 `_renderEvent` 对**任何注册进 `CARD_BUILDERS` 的 comp** 走聚焦渲染；切皮肤时 `_rerenderForm` 对
形式节点（`.news-form / .news-card-* / .scenario-form`）原地重渲 —— **新增形式无需改引擎**。

| 场景 | 默认形式 | comp | 说明 |
|---|---|---|---|
| 查天气 | **沉浸** | `WeatherView` | CSS 天色渐变(无图) + 5 日条；非 aura → 回退 SubjectCard |
| 上海旅行 | **沉浸** | `TravelView` | 三日封面横向陈列(真实图 `assets/travel/`)；非 aura → SectionCard |
| 找餐厅 | **沉浸** | `RestaurantView` | 全幅店内封面(`assets/restaurant/`)；非 aura → SubjectCard |
| 新闻播报 | **编辑卡**(可切三形式) | `NewsList`/`NewsFocus` | 三形式全做 |
| 邮件简报 / 今日日程 / 邮件×日程 / 会议总结 | **编辑卡** | ListCard/SectionCard | 结构化信息，卡片最佳 |
| 陪聊 | 纯语音 → **待做气泡线程** | — | 需引擎加"气泡累积(append)"模式 |

- **皮肤感知 + 优雅回退**:场景形式 builder 读 `data-skin`，命中默认形式则渲染该形式，否则回退到既有卡片
  （回退节点也加 `.scenario-form`，保证切回默认形式能恢复）。
- **动效打磨**(news-forms.css + news-gestures.js):气泡逐条入场 + 念读高亮呼吸 + Loona 点脉冲；
  沉浸 Ken-Burns 缓动 + 横向拖拽/滚轮 + scroll-snap。均 `is-playing` 门控、尊重 reduced-motion、不改布局高度。
- 文件:`js/scenario-forms.js` / `css/scenario-forms.css` / `js/news-gestures.js`。验证图:`_review/review-scenarios.html`。

---

## 6. 交互模式字段速查（详规见 UI-SPEC §14）

### 6.1 槽位式澄清 ClarifyCard（缺必填→问一次，不猜）
```
content: {
  title, question,                                  // 卡上文案（≠ TTS：TTS 先承接再问）
  slots: { required:[{label, value?}], optional:[label,…] },  // 有 value=已填✓；无=待填
  options: [{label},{label}]                         // ≤2 快选（接已查到的上下文，如"放进15点空档"）
}
```
- 它是**门**(`wait_for_user:true`, `closeable:false`, 无 X)，不是结果卡 → 字幕放 2 行。
- 已落地:**天气**(缺城市) / **餐厅**(缺位置,场景已填✓) / **日程**(缺时间,标题已填✓) / **旅行**(地点·时间已填✓)。

### 6.2 列表 → 单卡召回（小屏聚焦）
- 宽问出**列表**(NewsList / TravelView);钻取单条出**聚焦卡**(NewsFocus / TravelDayFocus:左图 + 上午/下午/傍晚)。
- 复用已取数据不重搜;沉浸态**聚光**:讲到那张放大呼吸、其余压暗、自动居中。

### 6.3 确认门 + 状态回执（动作的诚实闭环）
- 确认门:只 `confirm_label`/`cancel_label` 两个按钮,**无 X、无倒计时环**(显式决策,不自动执行)。
- 确认→`发送中`→`已发送 ✓ · 查看详情`(toast);取消→即时`已取消`(无"取消中")。
- 结果卡右上 **X = 收起**到回执 toast,「查看详情」再展开;只读回执卡(`回执` badge)。
- 失败:确认门 `content.outcome:"fail"` → `发送中→发送失败`,随后 **FailureCard** 给下一步。

### 6.4 FailureCard（部分/全部失败）
```
content: { title?, completed:[…], failed:[…], reason?, impact?, next_options:[…] }
```
- 成功的归成功(✓)、失败的归失败(✕);标清**谁知道/谁不知道**;`next_options`=**永远给下一步**(REQ-FAIL-001)。

### 6.5 case 内置设计变体 variants（控制台切换/对比）
```
{ variant_name:"基准名", events:[…], variants:[ { name:"变体名", events:[…] } ] }
```
- `loadCase` 自动注册基准 + 各变体(`_baked`,不进 localStorage)。
- 现有:天气 直接版↔问城市版;邮件×日程 全成功↔部分失败。对比页底部「评审结论」投票+备注随导出带走。
