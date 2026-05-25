# 新 session 提示词（可直接 /goal 或粘贴）

> 在另一文件夹开新会话时粘这段。三份参考用绝对路径，任意工作目录都能读。

---

```
# GOAL: Loona 交互工作台 v1 · 地基优先(S1→S4)

## 开工前必读（按序读完再动手）
1. C:/Users/QYL/Desktop/loona-workbench/00_PLAN.md          —— master plan：骨架(地基+UI库+case排列组合)/数据模型/阶段
2. C:/Users/QYL/Desktop/loona-workbench/02_FIGMA_VISUAL_REF.md —— 视觉规格：双眼纯CSS配方/pop_small磨砂玻璃/调色板/组件库清单
3. C:/Users/QYL/Desktop/loona-workbench/03_AGENT_CARD_CONTRACT.md —— agent返回形态：SSE帧/AGENT_CARD/9卡schema/旅游case真实帧序列

## 定位
通用 mock 工作台：符合 Figma 的手机版 Loona 主页面(地基) + UI 组件库；
每个 case 在其上"排列组合组件 + 填文字 + 配节奏"，自动播放其理想交互链路，可回放/标注/改。
focus agent 交互层：用户query / agent处理方式 / 状态toast / 卡片 / TTS本地合成(节奏) / 文本。
眼睛要有但【静态不动】——动效是决策机的事，本期不做。

## 范围
做：
- 手机版地基 HTML：黑底 + 静态双琥珀眼(02 §2 CSS配方) + 舞台区 + 底部TTS字幕区，整体对齐 Figma
- UI 组件库(02 §4 清单)：pop_small/toast/pop_large/TravelDayCard/list_item/btn-fill/状态视觉/confirm-card/字幕，各自可渲染、gallery 可逐个看
- 旅游规划 case 自动播：按事件 t 时间线播 + 浏览器本地 TTS(SpeechSynthesis) + toast/卡/字幕 + agent_step 侧轨
- 播放控制：播/停/单步/重播/调速
- 批注改：点任一事件 → 改 文案/节奏(t,gap)/卡内容/agent处理 + 标卡点 + 批注 + 即改即重播 + 导出"认可的理想链路"JSON
不做：眼睛动效 / 录制器(真实链路捕获) / 真实后端调用

## 卡片内容来源【关键】
卡片内容形态照 03 的 agent 返回 schema 填(如 TravelDayCard: day/theme/nodes/transport_notes/weather_notes/pace/modifiable_nodes)；
旅游 case 的理想链路初稿直接用 03 §5 那段【真实帧序列】排列组合而成，保证 mock 与真实调用同构。

## 数据模型（见 00 §5）
脚本 = 带时间戳 t 的事件链；每事件 comp=库组件名 + content/text 填内容 + t/after/gap_ms 配节奏；
事件类型：user_query / agent_step(可internal只上侧轨) / pop_small(role=clarify可停等) / toast / card(各卡种) / tts / confirm(停等)。

## 流程（地基优先，一步一步，地基打好就能滚）
S1 地基：主 HTML — 手机壳 + 黑底 + 静态双琥珀眼(02配方) + 舞台区 + 字幕区，对齐 Figma。验收：打开就是像 Figma 的手机版 Loona 静态页。
S2 UI 库：02 §4 组件逐个做出来，一个 gallery 页能单独看每个组件。验收：每组件可渲染、风格对齐 Figma。
S3 旅游 case：理想链路脚本(00 §5 + 03 §5) + 播放引擎(按 t 播 + 本地 TTS + 卡/toast/字幕 + agent_step 侧轨) + 播放控制。验收：旅游 case 自动播完整理想链路，听得到分段 TTS 与 3 张日卡的同步节奏。
S4 批注改：点事件改 4 面 + 标卡点 + 批注 + 即改即重播 + 导出理想链路 JSON。验收：改文案/节奏/卡内容立即生效，能导出。

## 出口条件
✅ 旅游 case 在手机版地基上自动播完整理想链路(含分段 TTS↔3 日卡同步节奏) + 能标注改 + 导出 JSON + 风格对齐 Figma + 双眼静态在位。

## 红线
- 工作台代码放本会话所在新文件夹；【不碰 Jarvis 仓 / cortex 仓的 git】(别的会话在用，避免冲突)。
- 不接真实 bridge/后端；眼睛只静态、不做动效。
- 自包含、浏览器直接打开能跑；本地 TTS 用浏览器 SpeechSynthesis，零依赖。
- 需要更高保真的 .riv 状态动画/更多卡时，可连 Figma MCP 按 02 §5 节点 ID 拉。
```
