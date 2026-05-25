# Loona 交互工作台 · Master Plan v2（地基优先 + UI 库 + case 排列组合）

> 用途：摆清现有资产、定稿需求、给出地基优先的分阶段计划，供新 session 用 `/goal` 执行。
> 状态：理需求定稿。**一步一步来，先打地基。**
> v2 修正：眼睛要有(静态不动) · TTS 本地合成 · 第一个 case=旅游规划 · 手机版 · UI库+排列组合骨架。

---

## 1. 一句话定位

做一个**通用 mock 工作台**：先有一个符合 Figma 的**手机版 Loona 主页面(地基)** + 一套 **UI 组件库**；
之后每个 case(task_id) 都是在这页基础上**排列组合组件 + 填文字 + 配节奏**，自动播放其**理想交互链路**；
能回放/标注/改；逐个 case 对齐理想链路。**全部对齐后**再考虑接真实调用。

核心心法（用户原话）：**"先把地基打好，打好之后就可以滚起来。case 就是排列组合，再填组件里的文字。"**

---

## 2. 现状盘点（台面上已有）

| 资产 | 路径 | 价值 |
|------|------|------|
| Jarvis 前端壳 | `Jarvis/index.html` | 借其卡渲染/TTS/状态机逻辑(不接这个壳) |
| Cortex bridge | `cortex/scripts/web_chat_bridge.py` | SSE 帧契约=真实链路词汇(delta/AGENT_CARD/DECISION_RECORD/TOOL_*),**真实调用阶段才接** |
| Cortex 后端 Agent | `cortex/` | **不变**,真实调用壳接同一个它 |
| ToolHub | `toolhub/` | 14+3 工具 |
| **知识库(逻辑源)** | `Loona_Knowledge_System/` | 9 场景链路 + §7 卡 Schema + §6 状态机 + Eval Case Pack。**case 逻辑/卡字段/链路从这拉,泛化场景已现成** |
| **Figma(视觉源)** | file `1GXkRFjHMpcxDyPbIh2ZYf` | 双琥珀眼睛(脸)、pop_small/large、list_*、btn-fill、状态动画 .riv、手机版布局。**地基与组件库的视觉照这个** |

---

## 3. 需求（v2 定稿）

### 3.1 范围
| ✅ 做（focus：agent 交互层 + 地基 UI） | ❌ 不做（本期） |
|--------|--------|
| 手机版 Loona 主页面(符合 Figma):**静态双眼** + 深色 + 舞台区 | 眼睛**动效/状态驱动**(→ 决策机) |
| UI 组件库(pop气泡/toast/卡/list/按钮/状态视觉/确认卡/字幕) | 录制器(理想链路还没定) |
| 用户 query / agent 处理方式(侧轨) | 真实调用/真实后端(对齐后再接) |
| 状态 toast / 卡片显示 / TTS 本地合成(含节奏) / 文本 | |
| case=组件排列组合+填文字,自动播理想链路;回放/标注/改 | |

### 3.2 第一个 case：旅游规划（知识库 §08）
选它因为链路最全、最能压"节奏+多卡同步"：
```
query「我想去上海旅行三天」
 → agent_step(router→task·travel; planner 识别选填槽,不连环问)
 → clarify 单次「三天可直接排,要不要补 日期/人数/预算/偏好?不补按中等预算城市漫步」
 → [用户:不补 / 补]
 → toast「正在排行程…」
 → 卡 TravelDayCard ×3 (Day1/2/3, segmented)
 → TTS 分段播(narrationSegments 切 Day,逐日高亮对应卡)
 → (可选) 保存「放长期知识库我确认范围+敏感信息」(R2/R4 确认)
```
卡字段对齐 §7.6 TravelDayCard(day/theme/nodes/pace/weather_notes/modifiable_nodes)。

---

## 4. 核心骨架：地基 + UI 库 + case 排列组合 ★

```
┌─ 地基(主 HTML,保留不变) ─────────────────────────────┐
│  手机壳 + 深色背景 + 静态双琥珀眼睛 + 舞台区 + 字幕区     │  ← 符合 Figma
├─ UI 组件库(Figma 风格,可复用 render 函数) ────────────┤
│  pop_small · toast · pop_large · TravelDayCard · list_item │
│  · btn-fill · 状态视觉(searching/loading/sending/done/fail) │
│  · confirm-card(摘要+按钮+倒计时) · tts-subtitle           │
├─ case = 排列组合 ────────────────────────────────────┤
│  脚本 = 在 t 时刻用「库里某组件」显示「填好的内容」+ 配节奏  │
│  换 case = 换这份排列组合 + 文字,不改地基/库               │
└──────────────────────────────────────────────────────┘
```
要点：**地基和库一次做好；case 只是数据(组件序列+文字+时间)**。库长大 = 支持更多 case 形态。

---

## 5. 数据模型（case = 组件序列 + 文字 + 节奏）

```jsonc
{
  "task_id": "travel_shanghai_3d",
  "title": "上海旅行三天",
  "scene": "travel",
  "source_case": "知识库 §08 / 08-1·08-3",
  "events": [
    { "t": 0,    "comp": "user_query",  "text": "我想去上海旅行三天" },
    { "t": 400,  "comp": "agent_step",  "decision": "router→task·travel; planner:选填槽不连环问", "internal": true },
    { "t": 800,  "comp": "pop_small",   "role": "clarify", "wait_for_user": true,
                 "text": "三天可直接排，要补日期/人数/预算/偏好吗？不补按中等预算城市漫步。",
                 "tts": { "text": "三天可直接排，要补点偏好吗？", "pace": "mid" } },
    { "t": 0,    "comp": "user_query",  "text": "不用补", "wait_for_user": true },
    { "t": 300,  "comp": "toast",       "text": "正在排行程…", "state_visual": "loading", "until": 2600 },
    { "t": 2600, "comp": "TravelDayCard","visual_state": "active", "content": {
                 "day": 1, "theme": "城市漫步", "nodes": ["外滩","南京路","豫园"], "pace": "light" } },
    { "t": 2900, "comp": "tts",         "text": "第一天轻松点，外滩到豫园一条线。", "after": "card", "gap_ms": 300, "highlight": "day1" },
    { "t": 6000, "comp": "TravelDayCard","visual_state": "active", "content": { "day": 2, "theme": "...", "...": "" } }
    // … Day3 … 可选 保存 confirm-card …
  ],
  "annotations": []   // 工作台写回：[{event_idx, type:"卡点|note", text}]
}
```
- `comp` = 库组件名；`content`/`text` = 填进去的内容；`t`/`after`/`gap_ms` = 节奏
- `agent_step` 上侧轨(internal 不进手机屏)；`wait_for_user` 停等(澄清/确认)

---

## 6. 执行计划（地基优先，一步一步滚）

| 阶段 | 产出 | 验收 |
|------|------|------|
| **S1 地基** | 主 HTML：手机壳 + 深色 + **静态双琥珀眼睛** + 舞台区 + 字幕区,符合 Figma | 打开就是一个像 Figma 的手机版 Loona 静态页 |
| **S2 UI 库** | 库组件各做出来(pop_small/toast/pop_large/TravelDayCard/btn-fill/状态视觉/confirm-card/字幕),一个 gallery 能逐个看 | 每个组件单独可渲染,风格对齐 Figma |
| **S3 旅游 case 自动播** | 旅游规划理想链路脚本(组件排列组合)+ 播放引擎(按 t 播 + TTS 本地合成 + 卡/toast/字幕 + agent 侧轨)+ 播放控制 | 旅游 case 能自动播完整理想链路,听得到节奏 |
| **S4 批注/改** | 点事件→改文案/节奏/卡内容/agent处理 + 标卡点 + 批注 + 即改即重播 + 导出认可的理想链路 JSON | 改完即播,导出 JSON |
| **S5 滚动** | 按需扩库 + 灌更多 case(知识库 Eval Pack 拉);逐个对齐 | 多 case 切换,理想链路逐个定稿 |
| **S6（later）** | 真实调用壳:同库渲染器,数据源切 live `/api/turn` SSE,接同一后端 | 真实链路对照理想链路 |

**起点 = S1 地基。地基+库(S1-S2)打好,后面 case 就是排列组合(S3 起)滚起来。**

---

## 7. 决策状态（v2 基本拍定）

| # | 决策 | 结论 |
|---|------|------|
| 1 | 眼睛 | ✅ 要,**静态不动**(Figma 基础 UI 一部分) |
| 2 | TTS | ✅ **浏览器本地合成** |
| 3 | 场景 | 从知识库拉(已现成),**第一个 case=旅游规划 §08** |
| 4 | 载体 | 新建独立主 HTML(手机版),保留为主页面,case 在其上泛化 |
| 5 | 整体设计 | 参考 Figma `1GXkRFjHMpcxDyPbIh2ZYf` |
| 6 | 批注 | 地基(S1-S3)之后再加(S4) |
| 7 | 顺序 | **地基优先,一步一步:S1→S2→S3→S4→S5** |

---

## 8. /goal 草稿（放新 session）

```
# GOAL: Loona 交互工作台 · 地基优先(S1-S4)

## 定位
通用 mock 工作台:符合 Figma 的手机版 Loona 主页面(地基) + UI 组件库;
每个 case 在其上排列组合组件+填文字,自动播理想交互链路,可回放/标注/改。
focus agent 交互层(query/agent处理/状态toast/卡/TTS本地合成节奏/文本)。眼睛要有但静态不动。

## 输入
- 计划: C:/Users/QYL/Desktop/loona-workbench/00_PLAN.md
- 逻辑源: Loona_Knowledge_System (§08 旅游 / §7.6 TravelDayCard / Eval Pack)
- 视觉源: Figma 1GXkRFjHMpcxDyPbIh2ZYf (双静态琥珀眼睛/pop卡/list/.riv状态/手机版/琥珀深色)
- 渲染参考: Jarvis index.html 的卡渲染/TTS/状态机逻辑

## 范围
做: 手机版地基HTML(静态双眼) + UI组件库 + 旅游case排列组合自动播(按t+本地TTS+toast/卡/字幕+agent侧轨) + 播放控制 + 批注改 + 导出
不做: 眼睛动效/录制器/真实后端

## 流程(一步一步,地基优先)
S1 地基: 主HTML 手机壳+深色+静态双琥珀眼睛+舞台区+字幕区,对齐Figma
S2 UI库: pop_small/toast/pop_large/TravelDayCard/btn-fill/状态视觉/confirm-card/字幕,各自可渲染,gallery可看
S3 旅游case: 理想链路脚本(组件排列组合,见00_PLAN §5)+ 播放引擎(按t播+本地TTS+卡/toast/字幕+agent侧轨)+ 播放控制
S4 批注改: 点事件改文案/节奏/卡内容+标卡点+批注+即改即重播+导出理想链路JSON

## 出口
✅ 旅游case能在手机版地基上自动播完整理想链路(含分段TTS与多日卡同步节奏); 能标注改+导出; 风格对齐Figma; 双眼静态在位

## 红线
工作台放 loona-workbench/ 独立目录,不碰 Jarvis 仓 git(避免与其他会话冲突)
不接真实 bridge/后端; 眼睛只静态不做动效
```

---

*v2 定稿。下一步:新 session 用 §8 /goal 执行 S1→S4(地基→库→旅游case→批注)。*
