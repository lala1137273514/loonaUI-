# 链路编排台 · 模块契约（FLOW-CONTRACT）

把 `gallery.html`（旧组件库）改造成**流程序列式**链路编排台：左=卡片库(拖源) · 中=链路序列画布 · 右=检查器。
页面内可预览播放，也可导出成能在工作台播放的 case JSON。

## 松耦合约定（所有模块共守）
- 各模块**只认两样东西**：① 共享 `FlowStore` 实例（数据真值）② 自己的挂载 DOM。
- 模块之间**互不引用**。要联动 → 改 store → store 通知所有订阅者各自重渲。
- 每个模块挂一个全局对象，暴露 `init(store, mountElOrRefs)`，内部自行 `store.subscribe(...)`。
- 一个模块 = 一个文件，放 `js/flow/`。**不准跨文件改别人的代码。**
- 渲染卡片**一律走 `FlowRender.renderStepPreview(step)`**，不要自己拼卡 DOM（comp→builder 的易碎逻辑只在 flow-render.js 一处）。

## 数据模型：step
一个 step ≈ 一条 engine event + 一个 `id`。字段（按 comp 取用，全部可选除 comp）：
```
{ id,                       // store 内部唯一 id（store 自动给，别自己造）
  comp,                     // 组件类型：user_query|tts|agent_step|toast|ClarifyCard|InspoFlow|TravelView|ListCard|ResultCard|ConfirmationCard|pop_small ...
  gap_ms,                   // 距上一步节奏（默认 600）
  text, pace,               // user_query / tts 的文字与语速
  tts: { text, pace },      // 卡片步骤附带的口播
  highlight,                // 高亮哪张卡（轮播卡用，值=卡 id）
  content: { ... },         // 卡片内容（卡型 comp 用）
  size: { w, h },           // ★ 每张卡独立尺寸（px），可空；flow-render 会套到卡 DOM 上
  label, decision, fields, internal,   // agent_step
  state, dismiss_on,        // toast
  wait_for_user }           // 停等用户
```

## FlowStore（已实现 · js/flow/flow-store.js）
`window.FlowStore.create()` → 实例：
- `list()` → steps 数组（**只读，别直接 push**）
- `get(id)` / `selected()` / `selectedId()`
- `add(step, at?)` → 插入（at 省略=追加），选中并返回新 id
- `update(id, patch)` → 浅合并 patch 到 step，通知
- `remove(id)` / `duplicate(id)` / `move(id, 'up'|'down'|index)`
- `select(id)` / `clear()`
- `subscribe(fn)` → fn({steps, selectedId, type}) 每次变更回调；返回取消函数
- `toEvents()` → engine events 数组（剥掉 id，按 gap_ms 累加 t）
- `toCase(meta)` → 完整 case 对象（含 events）
- `loadCase(caseObj)` → 导入 events 成 steps

## FlowRender（已实现 · js/flow/flow-render.js）
- `renderStepPreview(step)` → DOM 元素（真实 builder 渲染；自动套 size）。文本类 step 渲成 chip。
- `applySize(cardEl, size)` → 给卡 DOM 套宽高。

## FlowTemplates（已实现 · js/flow/flow-templates.js）
`window.FlowTemplates` = 数组，每项 `{ comp, label, group, make() }`，`make()` 返回一个新 step（带默认 content）。卡片库就铺这些。

## 待实现模块（各 agent 一个文件）
| 全局 | 文件 | init 签名 | 职责 |
|---|---|---|---|
| `FlowPalette` | flow-palette.js | `init(store, mountEl)` | 铺 `FlowTemplates` 成可拖拽卡片库；拖到画布 / 点击 → `store.add(tpl.make())`。HTML5 drag，`dataTransfer` 存 template 索引 `text/flow-tpl`。 |
| `FlowCanvas` | flow-canvas.js | `init(store, mountEl)` | 订阅 store，渲染 steps 竖向序列；每步用 `FlowRender.renderStepPreview` 出预览 + 操作条(上移/下移/复制/删/选中)；接收 palette 拖放(读 `text/flow-tpl`)按位置插入；步骤间可拖拽排序(`store.move`)。点步骤 `store.select(id)`，选中加 `.sel`。 |
| `FlowInspector` | flow-inspector.js | `init(store, mountEl)` | 订阅 store，对 `store.selected()` 出编辑表单：文案(text/tts)、节奏(gap_ms)、highlight、尺寸(size.w/h 数字框)、agent(label/decision/fields)、卡内容(content 的常见字段 + 原始 JSON 兜底文本域)。改动即 `store.update(id, patch)`。无选中显示空提示。 |
| `FlowPreview` | flow-preview.js | `init(store, refs)` | 点"预览"→ `engine.load(store.toCase())` + `engine.play()` 在预览舞台播。refs 见下。需要时 `LoonaEngine.init(stageRefs)` 起独立引擎实例。 |
| `FlowExport` | flow-export.js | `init(store, {exportBtn, downloadBtn, titleInput, msgEl})` | `store.toCase({title})` → 弹出/复制 JSON；下载 `.js`(写成 `window.LOONA_CASES['id']=...` 可直接丢进 cases/)；可选写 localStorage `loona_flow_draft`。 |
| `FlowBuilder`(装配) | flow-builder.js | 自启动 | 建 1 个 store，按挂载点调各模块 init，串起来。**我(主)写，别动。** |

## gallery.html 挂载点（id 固定）
- `#flowPalette` 左卡片库 · `#flowCanvas` 中画布 · `#flowInspector` 右检查器
- 顶栏：`#flowTitle`(标题输入) `#flowPreviewBtn` `#flowExportBtn` `#flowDownloadBtn` `#flowClearBtn` `#flowMsg`
- 预览弹层：`#flowPreviewModal`(含完整 loona-stage DOM，id 同工作台：loonaStage/popSlot/toastSlot/contentArea/subtitle/carouselPanel/carouselRail/carouselTitle/backOverview/storyLayer) `#flowPreviewClose` `#flowPreviewPlay`

## 验收
- 从左拖 3 种卡进中间 → 排序/删除/选中正常
- 选中改文案/尺寸 → 中间即时变
- 点预览 → 拼的链路在舞台播放 + 念 TTS
- 点导出 → JSON 丢进工作台 cases 能播
