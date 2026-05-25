# Loona UI 交互链路 · Mock 工作台需求规格 v0.1

> 目的：先用 **mock 驱动的可播放分镜** 把"一次交互的完整链路"设计定稿，
> 再去实现真前端 UI + agent 编排。脚本即施工图。
> 对齐来源：知识库 `Loona_Knowledge_System`(逻辑) + Figma `slack-4.30`(视觉)。
> 状态：理需求阶段，不接真 bridge/LLM/工具。

---

## 0. 三个一句话

- **task_id** = 一次交互的生命周期单元（= 知识库 active_task = 一个 eval case）。
- **交互链路** = 一个 task_id 走过的标准阶段序列（下面第 2 节，本规格的心脏）。
- **工作台** = 按 task_id 回放链路 + 逐阶段精调 4 个可变面 + 标注 + 重播。

---

## 1. 不变 vs 可变

| | 内容 | 来源 |
|--|------|------|
| **不变（舞台）** | 一对琥珀大眼睛(脸) + 深色背景 + 右上菜单 | Figma `face` |
| **随情绪变** | 眼睛辉光颜色 + 表情 | 知识库 §17 六情绪 |
| **每阶段变（4 面）** | ① 文字 ② TTS ③ 卡片样式 ④ 卡片内容 | 知识库 narrationSegments + §7 schema |

---

## 2. 标准交互链路（Canonical Chain）★核心

一个 task_id 最多走过 12 个阶段。**实际脚本只取其中需要的阶段**（查询类没有 7-9；
情绪陪聊类只有 0-2-6-11）。每阶段同时驱动 4 个面 + 眼睛态 + 状态动画。

| # | 阶段 | 眼睛态 | 屏/口播文字 | 卡片 | 状态动画(.riv) | 知识库状态(§6.4) |
|---|------|--------|------------|------|---------------|------------------|
| 0 | **IDLE** 待命 | 平静微光 | — | — | — | — |
| 1 | **LISTEN** 听取 | 聚焦/看向用户 | (用户输入气泡) | — | — | NewTask |
| 2 | **EMOTION** 识情绪 | 辉光变色(§17) | — | — | — | — |
| 3 | **THINK** 思考 | 收拢/微闭 | "让我看看…"(承接语) | — | `globe_looking`/`loading_spin` | Active |
| 4 | **CLARIFY?** 澄清〔可选〕 | 询问态(微扬) | 澄清问句气泡 | — | (停) | Active(缺槽) |
| 5 | **FETCH** 取数 | 看向侧方 | — | — | `globe_looking`/`mail_scroll` | Active |
| 6 | **PRESENT** 呈现 | 平静 | 口播结论(先判断) | 结果卡 dim→active | (出卡) | Delivered |
| 7 | **CONFIRM?** 确认门〔R3/R4〕 | 认真/直视 | "确认要…吗" | 确认卡 + 两按钮 + 倒计时 | `paperplane`待命 | PendingConfirm |
| 8 | **EXECUTE** 执行 | 专注 | — | 卡→执行中 | `paperplane_fly`/`loading_spin` | (确认后) |
| 9 | **DONE / FAIL** 反馈 | 弯眼笑 / 蔫 | "已完成…" / "没成…" | 卡→done / fail | `circle_checkmark` / `ciecle_xmark` | Executed |
| 10 | **FOLLOWUP?** 追问〔可选〕 | 聚焦 | (回 6 局部展开) | 卡高亮对应行 | — | FollowUp |
| 11 | **SETTLE** 收尾 | 回平静微光 | — | — | — | — |

### 2.1 链路分支（branches）

```
LISTEN → EMOTION → THINK ─┬─(缺槽)→ CLARIFY → (用户补) → FETCH
                          └─(齐全)──────────────────────→ FETCH → PRESENT
PRESENT ─┬─(R0 查询)──────────────────────────→ SETTLE
         ├─(R3/R4 动作)→ CONFIRM ─┬─(确认)→ EXECUTE → DONE/FAIL → SETTLE
         │                        └─(取消/超时)→ SETTLE
         └─(用户追问)→ FOLLOWUP → PRESENT(局部)
```

### 2.2 三条典型路径（脚本只取所需阶段）

| 路径 | 走过阶段 | 例 |
|------|---------|----|
| **纯查询** | 0·1·2·3·5·6·11 | 「今天上海要带伞吗」→ 判断+天气卡 |
| **情绪陪聊** | 0·1·2·6·11 | 「我有点烦」→ 承接，不出卡 |
| **写动作（全链路）** | 0·1·2·3·4·5·6·7·8·9·11 | 「给张三发邮件说会议改周三」→ 澄清正文→草稿卡→确认门→发送→已发 |

---

## 3. 脚本数据模型（Script JSON）

```jsonc
{
  "task_id": "send_mail_zhangsan",        // 唯一；= 知识库 case id 或 Figma 流程号
  "scene": "email",                        // 9 场景之一 / slack 套
  "title": "给张三发邮件改会议时间",
  "path": ["IDLE","LISTEN","EMOTION","THINK","CLARIFY","FETCH","PRESENT","CONFIRM","EXECUTE","DONE","SETTLE"],
  "steps": [
    {
      "stage": "CLARIFY",                  // 第 2 节阶段名
      "eyes": { "emotion": "neutral", "glow": "#9ec5ff", "expr": "ask" },
      "screen_text": "邮件正文想强调哪几点？",   // 屏上文字
      "tts": {
        "text": "正文想强调哪几点？",
        "voice": "natural, mid-pace",       // 语气标注(§17 voice_instructions)
        "highlight": null                   // 高亮哪张卡/行(narrationSegment)
      },
      "card": null,                         // 本阶段无卡
      "duration_ms": 0,                      // 0 = 停等用户(澄清/确认)；>0 自动推进
      "note": ""                             // 设计批注
    },
    {
      "stage": "PRESENT",
      "eyes": { "emotion": "neutral", "glow": "#9ec5ff", "expr": "calm" },
      "screen_text": "草稿垫好了，确认前不会发。",
      "tts": { "text": "草稿垫好了，确认前不会发。", "voice": "natural", "highlight": "card_draft" },
      "card": {
        "style": "pop_large",               // pop_small|pop_large|list_msg|list_channel|...
        "kind": "EmailCard",                // 知识库 §7 卡种
        "visual_state": "active",           // dim|active|done|fail
        "content": {                        // §7.3 EmailCard schema
          "sender": "我", "subject": "评审改到周三",
          "draft_available": true, "send_requires_confirmation": true,
          "body_points": ["周三 15:00 起", "材料周二前给"]
        }
      },
      "duration_ms": 1500,
      "note": ""
    }
    // … CONFIRM(确认卡+按钮+倒计时) / EXECUTE(paperplane) / DONE(checkmark) …
  ]
}
```

---

## 4. 组件需求（对齐 Figma 风格，不像素复刻）

| 组件 | 需求 | Figma 对应 |
|------|------|-----------|
| **双眼脸**(舞台) | 暖琥珀发光；6 情绪 × 表情(calm/ask/focus/笑/蔫/愠)；辉光颜色随情绪 | `face` + 6 情绪 halo |
| **pop_small** | 短气泡：用户意图 / 澄清问句 / 状态提示 | `pop_small`(69×) |
| **pop_large** | 富结果卡，承载 §7 各卡种内容 | `pop_large`(59×) |
| **list_***  | 列表项：消息/频道/线程/用户/(通用条目) | `list_slack_*`(50/28/18/9×) |
| **状态视觉** | 5 态：searching / sending / loading / done / fail | `.riv`：globe/paperplane/spin/checkmark/xmark |
| **确认卡** | action_summary + 两按钮(确认/取消) + 倒计时(默认 30s) | `btn-fill`(50×) + 确认卡 |

情绪→辉光色（知识库权威值）：
neutral `#9ec5ff` · urgent `#ffb454` · frustrated `#c0c0d8` · sad `#f3c6d5` · excited `#ffe066` · angry `#ff6b6b`

---

## 5. 工作台功能需求

| 模块 | 需求 |
|------|------|
| **播放** | 按 path 逐 stage 播；自动推进(duration_ms>0)或停等(=0,澄清/确认)；可单步/重播/跳到某 stage |
| **编辑** | 选中任一 stage，侧栏实时改 4 面(文字/TTS/卡样式/卡内容/情绪)，即改即播 |
| **标注** | 每 stage 可加 note；分两类：设计批注(这句太长/缺字段) + 验收标记(此步 OK/待改) |
| **存储** | 脚本 JSON 存/读；一个 task_id 一份；可导入导出 |
| **切换** | 多 task_id 脚本列表，一键切换播放 |

---

## 6. 三层架构 + 分阶段做法

```
① 舞台 Stage(不变)   双眼脸 + 深色台 + 6 情绪表情；驱动源 = step.eyes
② 脚本 Script        上面的 JSON；受知识库逻辑约束(链路阶段/卡 schema/风险等级)
③ 播放器+编辑器       逐 stage 渲染(眼+文字+TTS+卡+状态) + 侧栏编辑/标注
```

| 阶段 | 产出 | 验收 |
|------|------|------|
| P1 舞台 | `workbench.html`：双眼脸 + 6 情绪表情切换 | 眼睛按情绪变辉光/表情，风格对齐 Figma |
| P2 脚本格式 + 1 样板 | JSON schema + 1 个全链路 task_id(建议 send_mail：含澄清+确认门+执行+反馈) | 脚本可被播放器读 |
| P3 播放器 | 逐 stage 播：眼+文字+TTS+卡+状态 + 时序 | 一个 task_id 完整放完 |
| P4 编辑器 | 侧栏实时改 4 面 + 标注 + 即改即播 + 存回 | 改文字/换卡/调情绪立即生效 |
| P5 扩量 | 灌更多 task_id 脚本 | 多场景可切换 |

技术取向：复用 index.html 已验证管道(TTS / 卡渲染 / 状态机 / 情绪→辉光)，
驱动源从"真 bridge"换成"mock 脚本"，orb 换成"双眼脸"。

---

## 7. 待拍决策（开工前）

1. **第一版场景套**：Slack 套(6.13-6.21，有现成 Figma 分镜) / 通用套(天气邮件日程…)。**建议 Slack 套**。
2. **TTS**：浏览器本地合成(零依赖立即可听) / 真 /api/tts / 只文字标注。**建议本地合成**。
3. **载体**：新建 `workbench.html` / 改 index.html。**建议新建独立**。
4. **步粒度**：按 stage(本规格)对吗？还是要更细到 narrationSegment 子句级？
5. **标注**：设计批注 + 验收标记 两类都要？还是先只要设计批注？

---

*v0.1 · 理需求阶段 · 心脏是第 2 节"标准交互链路"。决策拍定后进 P1。*
