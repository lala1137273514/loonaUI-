# Loona Workbench 架构诊断 + 模块化方向

> 三路并行只读诊断（CSS 层叠 / JS 模块耦合 / case·数据流）汇总。日期 2026-06-06。

## 一句话根因
**没有单一真值。** 一个"卡型/组件"的身份被拆成三套名字 `comp`(逻辑层) → `kind`(数据层) → CSS `class`(样式层)，并在 **6 处硬编码登记**，互不引用、靠人肉对齐。改一处不知是否生效，因为最终值靠 **CSS 特异性 + 加载顺序**仲裁；加一个卡型要对齐 3 套名字、改 6 个文件落点。

## 现状：一个 comp 被几处分别登记

| 落点 | 文件 | 管什么 |
|---|---|---|
| `RESULT_COMPS` | carousel-adapter.js:37 | 走轮播还是浮层 |
| `FOCUS_COMPS` | carousel-adapter.js:55 | 只重定位还是整渲 |
| `_renderCarousel` 特判 | engine.js:180 | 是否"封面+下钻"范式（5 个硬编码 comp 名）|
| `build()` switch | carousel-adapter.js:213 | comp → 哪个 buildXxx 数据转换 |
| `buildCarouselCard` if 链 | carousel.js:158 | kind → 哪个 DOM builder（13 个 if）|
| `CARD_BUILDERS` | components.js:773 | 浮层卡 comp → builder |
| CSS 尺寸 | loona/carousel/storyboard.css | 卡宽高（散 3 文件，特异性仲裁）|

加一个新卡型 = 在以上 4-6 处分别登记 + 对齐 comp/kind/class 三套名，漏一个静默失效。

## CSS 尺寸"真相表"（工作台 .web-stage 实际生效）

| 卡型 | 实际生效 | 来源 | 为什么 carousel.css 里的值没用 |
|---|---|---|---|
| result-card | 324×**232** | storyboard.css:68 盖高 | `.web-stage` 前缀特异性高 + 最后加载 |
| trip-card（规划卡）| **326×296** | storyboard.css:74-75 | 同上（盖掉 carousel 的 460×300）|
| inspo-card（方案卡）| **326×296** | storyboard.css:74-75 | 同上（盖掉 carousel 的 400×350）|
| trip-cover/dest/theme | 326×232 | storyboard.css:69-71 | 同上 |
| travel-overview | 460×auto | carousel.css:1996 | 没人覆盖，直接生效 |

**结论**：同一个卡尺寸被定义 2-3 次（carousel 基线 + carousel 媒体查询 + storyboard 覆盖），改 carousel 经常无效——storyboard 用 `.web-stage` 盖住了。`gallery.html` 不加载 storyboard.css，所以编辑台和工作台尺寸还不一致。

## 耦合热点（JS）
- **engine 是 god-object（946 行）**：`comp ===` 硬编码分支约 27 处，散在 `_renderEvent/_renderCarousel/_stageLabel/_compLabel/_rowGroup/buildStoryboard`。
- **adapter 共享可变单例**：`LoonaCarouselAdapter.current/stages/mode` 是模块级可变态，engine 多处直接读，seek/重播/切 case 易残留致"图对不上"（代码里已有多处补丁注释承认）。
- **adapter 双职责**：既做无状态数据转换（build*），又塞了两阶段播放态机（drill/backToOverview），与 engine 双向白盒耦合。
- **engine 直接摸 carousel DOM**：绕过 CortexCarousel 公共 API 操作 `.result-card.active`/scrollLeft，class 改名即崩。
- **已经干净的**：`js/flow/*`（store-订阅-渲染分层，最干净，但只服务 gallery）、`LoonaUI` 组件库 + `CARD_BUILDERS` 注册表（这条路已对：加浮层卡不用改 engine）。

## 模块化方向（按"痛 × 风险"排序）

| 阶段 | 做什么 | 解决的痛 | 风险 | 收益 |
|---|---|---|---|---|
| **1. CSS 尺寸单一真值** | 建 `css/_tokens.css`，每卡型尺寸用变量 `--card-{type}-w/h`；component 规则只引用变量、不写裸数字；`.web-stage`/gallery 等 context **只覆盖变量**，删掉所有重写 width/height 的规则 | "改尺寸不知生效" | 低 | 改尺寸=改 1 处变量，可预测；顺带正确实现方案卡横向 |
| **2. 组件注册表** | 一张 `COMPONENTS[comp] = {kind, route:'carousel\|overlay', builder, size, schema, tlLabel, group}`，让 engine/adapter/carousel/css 全查表派生，删散落 switch/if 链 | "加卡型改 6 处对齐 3 套名" | 中 | 加卡型=注册表加一条 |
| **3. 去共享单例 + 数据/编排分层** | adapter 两阶段态机搬进 controller 实例（像 engine 持有 `_carousel` 那样），数据层保持纯函数无 this 态 | "残留态图对不上" | 中 | 切 case/seek 不再串味 |
| **4. case 自动发现** | cases 聚合加载 + `ORDER` 仅作置顶白名单，未列的按 scene+title 自动分组 | 加 case 要手工改 script+ORDER | 低 | 加 case=丢个文件 |
| **5. 拆 engine / 抽 TTS** | TTS（synth+audio+sleep+总线）抽成 `LoonaTTS`，engine 只留推进+渲染分流 | god-object 难改 | 高 | 可缓做 |

## 落地建议
**先做阶段 1（CSS 尺寸单一真值）**：最痛、最低风险、立竿见影，还能顺手把"方案卡改横向"正确实现（在 `.web-stage` 里覆盖 `--card-inspo-w` 即可，且高度受限 ~303px，方案卡走 400×宽、高 ≤300）。阶段 2 是中期主菜，阶段 3-5 视精力推进。
