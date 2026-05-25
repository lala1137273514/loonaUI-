# Loona 交互工作台 v1

通用 mock 工作台:**符合 Figma 的横版 Loona 主页面(地基,812×375)+ UI 组件库**;
每个 case 在地基上「排列组合组件 + 填文字 + 配节奏」,自动播放其**理想交互链路**,可回放 / 标注 / 改 / 导出。
零依赖,**双击 `index.html` 浏览器直接跑**。TTS 用浏览器原生 `SpeechSynthesis`。眼睛【静态不动】。

> **双眼是从 Figma 直接拉下来的真实资产**(`assets/loona_face.png`,Frame 26/27 face 节点 1:161,812×375 横版,多层 3D 渲染),不是 CSS 复刻。菜单图标同样来自 Figma(`assets/icon_menu.svg`)。

> **9 个场景 case 全部就绪**(知识库 §01-§09):陪聊 / 天气 / 新闻 / 邮件简报 / 日程 / 邮件日程联动 / 餐厅 / 旅行 / 会议。卡片内容、帧序列照 `03_AGENT_CARD_CONTRACT.md` 真实 agent 返回形态填,mock 与真实调用同构。
> **3 套可切换卡片皮肤**(Glass / Bubble / Aura):同一套内容,只换**材质 + 动效**,布局不变(实现见 `css/skins.css`)。
> · **Glass** 磨砂玻璃卡(Figma 基准) · **Bubble** Loona 吹出的肥皂泡/凝胶(虹彩边·高光·呼吸·破) · **Aura** 无框,文字浮于黑、被暖琥珀呼吸光晕包裹(= Loona 自身的光,带余烬火花)。

> **统一 UI 铁律**([`UI-SPEC.md`](UI-SPEC.md)):设备固定 812×375,内容区 CardStage 固定 **287px**;每类组件有**固定尺寸包络**,内容超出只走三策略(**内部滚动窗口**(头/脚常驻+渐隐边+TTS 高亮自动滚到行) / **换形式**(list↔focus、沉浸横向陈列) / **裁剪 clamp**),**绝不硬撑/移出屏/压字幕**。全 9 场景×全形式(含内置变体)实测**零溢出零重叠**(矩阵脚本 `_review/_audit/measure.js`;§12 校验 `verify.js` **跑满全矩阵** token/宽度/溢出/字幕,11/11 PASS,见 UI-SPEC §12)。
> **交互模式**([`UI-SPEC.md §14`](UI-SPEC.md)):缺必填→**槽位式澄清**问一次不猜(天气问城市/餐厅问位置/日程问时间) · 列表→**单卡召回**(新闻 list↔focus、旅行单日聚焦) · **沉浸聚光**(讲到哪张放大呼吸、其余压暗) · **确认门**=显式二选一(无 X、无倒计时)+**状态回执**(发送中→已发送·查看详情,卡 X=收起↔回执 toast) · **失败/部分成功**=FailureCard 拆开成功/失败 + 谁知道/谁不知道 + 永远给下一步(REQ-FAIL-001)。
> **协作控制台**:顶栏**变体条**(存为变体/切换/重命名/删除,localStorage 持久;case 可内置设计变体见下) · **链路增删改**(上移/下移/复制/删除/上下插入 + 撤销重做 + 快捷键) · **事件↔真实 agent 调用契约映射**(每步 chips:帧类型/工具/evidence E0-E5/risk R0-R4/确认门,**实时违规校验**:R3+ 动作缺确认门、E0/E1 低证据出结果、**私域数据未声明授权**、**外发收件人未明确** 即 ⚠) · **同场景多链路变体并排对比**(mini-device 结果卡预览 + 事件链 chips + LCS 结构 diff + 契约体检表择优 + **评审结论**投票「更倾向 A/B/势均力敌」+ 备注,持久化随导出带走) · **一键导出/分享**(工作链/全部变体 JSON + **用户标注一并带走** `annotations_resolved`、复制到剪贴板)。

---

## 怎么跑

1. **工作台**:浏览器打开 `index.html`。
   - **切 case**:左上下拉,9 个场景(陪聊 / 天气 / 新闻 / 邮件简报 / 日程 / 邮件日程联动 / 餐厅 / 旅行 / 会议)。
   - **切皮肤**:右上 `Glass / Bubble / Aura` 段控(或键盘 `1/2/3`)——切换的是卡片**材质 + 动效**(不是布局),View Transition 丝滑过渡。
   - 顶栏:case 选择 · **变体条**(链路名/数量·＋存为变体) · 形态段控 · ▶ 播放 / ⏭ 单步 / ↻ 重播 / 调速(0.5–2×)/ 朗读 TTS / 自动过停等 · **⇄ 对比** / 🧩 组件库 / **⧉ 分享** / ⬇ 导出 JSON。
   - **协作控制台**(右栏点事件即进):改 4 面 + 链路增删改 + 标卡点/批注 + 事件↔契约映射(含违规校验)。
   - 键盘:`空格`=播/停,`→`=单步,`R`=重播,`1/2/3`=切形态,`C`=并排对比;选中事件后 `Alt+↑/↓`=移动 · `⌘/Ctrl+D`=复制 · `Del`=删除 · `⌘/Ctrl+Z`/`⇧Z`=撤销/重做。
   - 左栏=事件时间线(点任一事件→跳到该步并在右栏编辑);中=手机(Loona 产品 UI);右=agent 决策侧轨 + 批注/编辑器。
   - **三个位置区**(见 CARD_TAXONOMY.md):右上角=任务状态 toast(查日程中/创建中/发送中…);中心=结果/澄清/确认 卡(**同时刻聚焦一张**,多条目用单卡+列表,不铺多卡);底部=对话字幕(ASR 用户 + TTS Loona **同位、先后交替**)。
2. **组件库**:打开 `gallery.html`(或顶栏「🧩 组件库」),逐个看每个组件。

> **听到声音**:首次播放需点一下页面(浏览器要求用户手势才放语音);系统装了中文语音时自动选中文。没有语音也不影响——引擎用估时兜底,视觉链路照常播完、节奏照走。

---

## 架构:地基 + 库 + case 排列组合

```
┌─ 地基(index.html, 不变) ───────────────────────────────────┐
│  横版设备(812×375) + 黑底 + 真实 Figma 双眼(assets/loona_face.png) │  ← 直接用 Figma 资产
│  + 右上菜单(assets/icon_menu.svg) + pop_small 槽 + 卡片浮层 + 字幕区  │
├─ UI 组件库(css/loona.css + js/components.js, 可复用 render)──┤
│  pop_small · toast · pop_large · TravelDayCard · list_item   │
│  · btn-fill · 状态视觉 · confirm-card · tts-subtitle          │
├─ case = 纯数据(cases/*.js) ───────────────────────────────┤
│  带时间戳的事件链:t 时刻用「库里某组件」显示「填好的内容」+ 节奏   │
│  换 case = 换这份数据,不改地基 / 库                            │
└────────────────────────────────────────────────────────────┘
```

> 横版下卡片是**浮层**:over 真实双眼舞台,出卡时叠一层柔遮罩让玻璃卡可读(眼睛仍透出微光,不动眼)。三日卡水平排布、逐日高亮。

| 文件 | 作用 |
|------|------|
| `index.html` | 工作台主页(地基 + 三栏 + 控制条 + 装配) |
| `gallery.html` | 组件库 gallery(S2 验收，对齐 Figma) |
| `UI-SPEC.md` | **统一 UI 铁律(本轮新增,尺寸/溢出/校验的唯一真值)**:固定尺寸包络 + 字号/间距阶梯 + 三溢出策略 + §12 自动校验清单。改任何尺寸前必读 |
| `EXPLORATION.md` | 设计探索与取舍记录:溢出三策略择优 / 字幕 1-2 行 / 控制台对比实现路径 / persona / 多轮反思 |
| `DESIGN_SYSTEM.md` | **组件设计系统（统一规则）**:token + 两玻璃容器 + 新组件必守清单。改/加组件前必读(尺寸以 UI-SPEC 为准) |
| `CARD_TAXONOMY.md` | **展示元素分类 & 布局规范**:4 位置区(状态条/中心卡/对话字幕) + 卡片按状态&结构归类(ListCard/SubjectCard/SectionCard/Clarify/Confirm/Failure) + 9 场景"多卡→单卡列表"映射。组件库按此**按类型分**(非按 case) |
| `assets/` | 从 Figma 拉的真实资产:`loona_face.png`(双眼 812×375)、`icon_menu.svg`、`icons/`(状态图标 globe/loading/paperplane/check/xmark + close) |
| `css/loona.css` | token(§①) / 地基(横版+真实双眼底图) / 组件库(对齐 Figma) / Glass 皮肤 / 工作台外壳 |
| `css/skins.css` | **卡片皮肤层**:`[data-skin="bubble"]`(肥皂泡/凝胶) + `[data-skin="aura"]`(无框暖光晕)。叠在内容上,只换材质+动效 |
| `js/components.js` | UI 组件库:每个组件一个 render 函数,返回 DOM(gallery 与引擎共用) |
| `js/engine.js` | 播放引擎:串行 runner + TTS 队列 + 逐日卡高亮 + 停等 + 播放控制 + seek + 时间线 |
| `js/editor.js` | 批注 / 编辑器 + **链路增删改**:点事件改 4 面 + 增删改/移动/复制(撤销栈 + 快捷键) + 卡点 + 批注 + 即改即播 |
| `js/console.js` | **协作控制台**:变体管理 + 事件↔契约映射(`contractOf`/`validateStep` 实时违规校验) + 并排对比(LCS diff + 契约体检表) + 导出/分享 |
| `css/console.css` | 控制台层样式(变体条 / 链路工具条 / 契约 chips / 对比 overlay)，不触设备内 UI-SPEC 包络 |
| `cases/travel_shanghai_3d.js` | 旅游 case 理想链路(数据;照 03 §5 真实帧序列) |

---

## 数据模型(case = 组件序列 + 文字 + 节奏)

```jsonc
{
  "task_id": "travel_shanghai_3d",
  "title": "上海旅行三天",
  "scene": "travel",
  "decision_record": { /* 整轮 DECISION_RECORD，§4，侧轨展示 */ },
  "events": [
    { "t": 0,   "gap_ms": 0,   "comp": "user_query", "who": "我", "text": "我想去上海旅行三天" },
    { "t": 250, "gap_ms": 280, "comp": "agent_step", "internal": true, "label": "ROUTER · PLANNER",
      "decision": "router → task · travel；…", "fields": ["request_type:task", "scene:travel"] },
    { "t": 900, "gap_ms": 260, "comp": "pop_small", "role": "clarify", "wait_for_user": true,
      "text": "三天可直接排，要补…吗？", "tts": { "text": "要补点偏好吗？", "pace": "mid" } },
    { "t": 2300, "gap_ms": 1800, "comp": "TravelDayCard", "card_id": "day1", "visual_state": "active",
      "content": { "day": 1, "theme": "城市漫步", "nodes": ["外滩","南京路步行街","豫园"],
                   "transport_notes": "地铁 2/10 号线", "weather_notes": "留意小雨",
                   "pace": "light", "modifiable_nodes": ["豫园"] } },
    { "t": 3900, "gap_ms": 550, "comp": "tts", "highlight": "day1", "text": "第一天轻松点，外滩到豫园一条线。" }
    // … toast / 其余日卡 / 分段口播 / confirm 确认门 …
  ],
  "annotations": [ { "event_idx": 2, "type": "卡点|note", "text": "…" } ]
}
```

### 事件类型(`comp`)
`user_query` · `agent_step`(`internal:true`→只进右侧侧轨) · `pop_small`(`role`= query/clarify/status)·
`toast`(`state`= searching/verifying/reading/processing/sending/saving/done/fail，或旧 `state_visual`= loading/…;`dismiss_on:"card"` 出卡时消失)·
任何注册进 `CARD_BUILDERS` 的卡(`ListCard` / `SubjectCard` / `SectionCard` / `WeatherView` / `TravelView` / `RestaurantView` / `NewsList` / `NewsFocus` / `TravelDayFocus` / **`ClarifyCard`**(`content.slots:{required,optional}` 槽位) / **`FailureCard`**(`content.completed/failed/reason/next_options`))/ `card`(`card_id` 供高亮定位)·
`tts`(纯口播,`highlight` 高亮某张卡/行)· `confirm` / `ConfirmationCard`(确认门,`wait_for_user`;`content.outcome:"fail"` + `fail_label` → 确认后走「发送中→发送失败」而非「已发送」,用于失败演示)。
任何事件都可带 `tts:{text,pace}` 子字段附带口播。

### case 内置设计变体(`variants`)★
一个 case 可声明多条**设计变体**供控制台一键切换 / 并排对比(无需手动 fork):
```jsonc
{
  "task_id": "weather_5d",
  "variant_name": "直接版",                         // 基准变体名(控制台显示)
  "events": [ /* 基准链路 */ ],
  "variants": [ { "name": "问城市版", "events": [ /* 另一条链路 */ ] } ]
}
```
`loadCase` 自动把基准 + 各内置变体注册进变体条(标 `_baked`,不进 localStorage 避免重复)。
现有:**天气** 直接版↔问城市版(缺城市走槽位澄清);**邮件×日程** 全成功↔部分失败(同一 OPEN 前半段,仅第 2 道门后分叉成 FailureCard)。
适合演示「同一需求两种处理 / 同一计划两种结局」,对比页直接产出**评审结论**(投票+备注)。

### 节奏契约(引擎计时读法)★
- 事件**按数组顺序**播;fire 前等待 `gap_ms`(受调速缩放)。`gap_ms` = 距【上一事件渲染完成 / 上一段 TTS 念完】的延时。
- 含 TTS(`comp:'tts'` 或带 `tts:{}`)→ **念完才继续**(停在语音上 = 可听的节奏);无语音时按字数估时兜底。
- `wait_for_user:true` → **停等**(澄清/确认门)。「自动过停等」开 = 可见节拍后自动续(仍演出停等);关 = 真停,等点「继续/确认」。
- `internal:true` → 只进 agent 侧轨,不上手机屏,不阻塞。
- `t` 仅作时间线**展示标签**(人看),引擎计时**以 `gap_ms` 为准**。

---

## 加一个新 case(S5 滚动)

1. 在 `cases/` 新建 `your_case.js`:
   ```js
   (function (g) { g.LOONA_CASES = g.LOONA_CASES || {};
     g.LOONA_CASES['your_case'] = { task_id:'your_case', title:'…', scene:'…', events:[ … ], annotations:[] };
   })(window);
   ```
2. `index.html` 里加一行 `<script src="cases/your_case.js"></script>`,把 `engine.load(...)` 指向它。
3. 卡内容照 `03_AGENT_CARD_CONTRACT.md §3` 对应卡的 schema 填,链路初稿照该 case 的真实帧序列排列组合。
4. 打开工作台 → 播 → 标注 → 调文案/节奏/节点 → 导出认可的理想链路 JSON。

> 组件库长大 = 支持更多 case 形态。新增组件:在 `components.js` 写 render 函数 + `css/loona.css` 加样式 + `gallery.html` 加一格。

---

## 边界(本期不做 / 注意)
- **眼睛只静态**,无动效(情绪→辉光变色是决策机后话,CSS 已留 `--glow-*` 接口)。
- 不接真实后端 / bridge(切真实调用时:把事件源换成 `web_chat_bridge.py` 的 SSE 帧即可一一对上,见 03)。
- 自包含、零依赖、`file://` 直接跑(经典 `<script>`/`<link>`,无 fetch / ES module / 构建)。
- 双眼 / 菜单已从 Figma 拉到 `assets/`(file `1GXkRFjHMpcxDyPbIh2ZYf`:face 实例 `1:161` / Frame 26 `1:160` / Frame 27 `1:170` / pop_small `58:5098`)。要更多卡或 `.riv` 动效,连 Figma MCP 按这些节点 ID 再拉(`get_screenshot` 抓图 / `get_design_context` 取资产 URL)。

---

*v1 · 出口达成:旅游 case 在手机版地基上自动播完整理想链路(分段 TTS ↔ 3 日卡同步节奏)+ 能标注改 + 导出 JSON + 风格对齐 Figma + 双眼静态在位。*
