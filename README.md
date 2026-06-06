# Loona 工作台（loona-workbench）

> 不用通读代码就能上手。先看这一页，再去翻具体文件。

## 1. 这是什么

Loona 语音助手 demo 的 **mock 工作台**。不是产品代码，是给老板/同事看「理想链路」的演示台：

- 按一条事先写好的 case（理想链路），**逐条事件播放** —— 用户提问、agent 思考、TTS 口播、出卡，全部带节奏地走一遍。
- 中间是「**关键帧瀑布**」：每个有界面的步骤渲成一块静态截图 tile，竖向平铺，点哪块就跳到那一帧。
- 右侧是「**评审中心**」：逐节点写评论/批注、给整条链路写总评。
- 用途：先用 mock 反复打磨链路和口播、对齐老板，定稿后再落到正式 webui（cortex/web_ui）。

中间设备是横版 812×375 的产品 UI 地基（对齐 Figma Frame 26/27），但**当前主线只看旅行规划**。

## 2. 怎么跑

**零依赖、纯前端、经典 `<script>`**，没有构建步骤。

- **首选：直接双击 `index.html`（`file://` 直接可跑）。** 评论走 localStorage 兜底，照样能批注。
- 想多人实时评论 / 起本地服务：`python -m http.server` 然后开 `http://localhost:8000/`。
- ⚠️ **本机环境坑**：Meta（TUN 模式）代理会占满 localhost 端口，本地 HTTP server 几乎必报 `EADDRINUSE` / 起不来。**优先用 `file://` 直开**，别和端口较劲。

> 组件库单独看：`gallery.html`（顶栏有入口）。

## 3. 目录结构

| 路径 | 干啥 |
|---|---|
| `index.html` | 三栏工作台主页面 + case 注册区（`<script src="cases/...">`）+ PINNED/ARCHIVED 排序 + 全部启动代码 |
| `cases/` | 用例数据。每个文件一个（或几个）case，自注册到 `window.LOONA_CASES` |
| `js/engine.js` | 播放引擎：逐条 `_renderEvent`、`buildStoryboard` 出关键帧、`_ttsOf` 解析口播、`storyboardMode` |
| `js/components.js` | UI 组件库（`window.LoonaUI`）：每个组件一个返回 DOM 的纯函数，引擎和 gallery 共用 |
| `js/carousel.js` | web_ui 原样搬来的轮播渲染器（`CortexCarousel`），结果卡走它 |
| `js/carousel-adapter.js` + `js/component-registry.js` | 把 case 的 comp 映射到轮播/feed/builder 的单一真值表 + 适配器 |
| `js/tts.js` | TTS 子系统（`LoonaTTS`）：决定走预渲染百炼音频还是浏览器合成/估时兜底，管打断/语速 |
| `js/storyboard.js` | 中间关键帧瀑布 feed + 右侧评审中心（节点评论 / 总评 / 全链活动流） |
| `js/editor.js` | 批注/编辑器：点节点改文案/节奏/卡内容、标卡点、导出「认可的理想链路」JSON |
| `js/console.js` | 协作控制台：变体管理、事件↔契约映射、并排对比、分享/导出 |
| `js/comment-sync.js` + `js/config.js` | 评论同步层：Supabase 实时多人 / localStorage 单机兜底 |
| `css/` | 样式。真机预览卡尺寸由 `storyboard.css` 的 `.web-stage` 规则管（不是 carousel.css） |
| `mock/` | live-mock 现编现批工具（`mock-live.html` + `mock-live-data.js`） |
| `assets/` | 图标（`icons/*.png` 状态 riv 截图）、旅行/新闻配图、预渲染 TTS（`assets/tts/manifest.js`） |

## 4. 一个 case 怎么写

case = 一个 IIFE，把自己挂到 `window.LOONA_CASES`，核心是一个 `events` 数组，引擎逐条播。

```js
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};
  g.LOONA_CASES['my_case'] = {
    task_id: 'my_case', title: '标题（case 选择器里显示）', scene: 'travel',
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '帮我规划成都三日游。' },
      // ...
    ],
    annotations: []   // 评论/批注（见 §8），可省略
  };
})(window);
```

**每条 event 的常用字段**

- `comp`：组件类型，决定渲染成啥（见下表）。
- `t` / `gap_ms`：定时。`gap_ms` = 距上一步等待毫秒（优先用它，随调速缩放）；`t` 是绝对时间戳，仅当没 `gap_ms` 时按 `t - 上一t` 算。
- `tts: { text, pace }`：承载口播。**口播文案放在 `tts.text`**（`comp:'tts'` 的纯口播步也可直接 `text`）。`pace` = `mid`/`light` 等映射语速。
- `highlight`：念到这句时，把轮播里对应 id 的卡居中聚焦。
- `wait_for_user: true`：停等，演出「等用户回应/拍板」（自动播时按节拍自动续）。
- `notice: true`：进度提示口播（如「我查一下日程」）。在关键帧瀑布里**只出文字帧、不配图**（不克隆上一张卡，避免误以为这帧有内容卡）。
- `internal: true` / `comp:'agent_step'`：只进右侧 agent 决策侧轨，不上设备屏、不成关键帧 tile。
- `drill_day` / `travel_back`：旅行两阶段，驱动轮播下钻某天 / 返回总览。

**comp 类型 → 渲染成啥**

| comp | 渲染 |
|---|---|
| `user_query` | 用户 ASR 气泡（底部字幕，role=user） |
| `agent_step` | agent 内部决策条（仅右侧侧轨；配 `label`/`decision`/`fields`） |
| `tts` | 纯口播：无 DOM，只出底部字幕 + 念 `text` |
| `ClarifyCard` | 澄清卡（玻璃浮层，常配 `wait_for_user`；`content.understand.known/memory`） |
| `InspoFlow` | 三方案种草大图轮播（`content.cards[]`，可 `rec:true` 主推 + `punchline`/`tags`） |
| `TravelView` | 多天日程卡横滑（`content.cards = DAYS 数组`，逐天靠 `highlight` 聚焦） |
| `ListCard` | 列表卡（如排进日历，`content.rows[]` + `source_tool_name`） |
| `MomentCard` | 叙事流满屏「一图一刻」大图卡 |
| `confirm` / `ConfirmationCard` | 确认门（二选一按钮，无倒计时） |
| `toast` | 右上状态回执（`state`: searching/reading/done/fail…，`dismiss_on:'card'` 出卡即消） |
| `pop_small` | 右上小气泡 |
| `card` | 通用大卡（`pop_large`） |

`DAYS` 一般在文件顶部定义成数组（`days()` / `daysRevised()` 给改版前后两版），node 字段：`time`/`place`/`note` + `highlight`/`star`/`reminder`。注意长度上限（label≤18、place≤14、note≤42、reminder≤22）。

## 5. 加 / 改 case

1. 在 `index.html` 的 case 注册区加一行：`<script src="cases/my_case.js"></script>`。
2. 排序由 `index.html` 底部脚本里两个数组控制：
   - `PINNED`：置顶白名单，`PINNED[0]` = 默认打开的 case。
   - `ARCHIVED_ORDER`：旧版本归到末尾「归档」分组。
   - 其余按加载顺序自动派生，按 `scene` 分组（旅游/邮件/新闻/日程/其他）。

## 6. 当前主线 demo

**V5 三个旅行案是当前标杆**（都在 `PINNED`，默认打开第一个）：

| case 文件 | 说明 |
|---|---|
| `cases/travel_chengdu_3d_v5.js` | 成都 3 天·两人：3 轮澄清 + 三选一（当前主标杆） |
| `cases/travel_dali_3d_solo_v5.js` | 大理 3 天·一人 |
| `cases/travel_japan_7d_v5.js` | 日本 7 天（英文口播） |

旧版旅行案已 `ARCHIVED`（大理/日本旧版、成都5d、大理friends 等）。
V5 的设计规范（链路 / 口播 / 卡片契约）在 Claude skill **`loona-travel-flow`**，改链路、加旅行 case、动 cortex 旅行提示词前先看它。

## 7. live-mock 现编现批工具（`mock/`）

`mock/mock-live.html` + `mock/mock-live-data.js`：**现编现批**用。

- 在聊天里驱动一条链路，页面以瀑布流逐句展示，每句可就地批注。
- `mock-live-data.js` 是真值源（`window.MOCK.steps`，文案一字不改），Claude 每轮重写它，页面定时重载。
- 流程：先在 live-mock 里快速把口播磨顺、对齐，再把定稿文案落成正式 `cases/*.js`。

## 8. 评论 / 批注

- 评论挂在 `caseObj.annotations`，每条按 `event_idx` 挂到对应节点（`event_idx = -1` = 整条链路的总评）。
- 类型：`卡点`（🚩）、`comment`/`note`（💬）。左栏时间线和关键帧 tile 会显角标。
- 存储：默认 **localStorage**（`file://` 也能用）；配了 Supabase 则走实时多人同步（`js/comment-sync.js` + `js/config.js`）。

## 9. 已知环境坑

- **Meta TUN 代理占满 localhost 端口** → 本地 HTTP server 必 `EADDRINUSE` 起不来。优先 `file://` 直开。
- `file://` 下浏览器 SpeechSynthesis 可念字幕；预渲染百炼音频需 `assets/tts/manifest.js`（`node tools/gen_tts.mjs` 生成），缺则引擎自动回落浏览器合成 / 估时兜底，视觉链路照样播完。
