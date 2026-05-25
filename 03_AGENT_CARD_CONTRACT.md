# Agent 侧内容契约 · 卡片/帧/决策记录的真实返回形态

> 给 mock 工作台用：卡片内容、帧序列、agent 处理记录 **照真实 agent 返回的形态来填**，
> 这样 mock 的理想链路和真实调用同构，将来切真实调用无缝。
> 来源：Cortex bridge `web_chat_bridge.py` 帧契约 + 知识库 §7 Component Schema + ToolHub。

---

## 1. SSE 帧契约（真实调用链路的"事件"原型）

真实 agent 一个 turn 通过 SSE 吐这些帧（**这就是 mock 脚本要模仿的 call-chain**）：

| 帧 type | 含义 | mock 里对应组件 |
|---------|------|----------------|
| `EMOTION_TAG` | §17 情绪 {emo,intensity,three_path} | (本期眼睛静态→忽略动效,但可记 emo) |
| `delta` | 流式文字片段(口播/屏字) | tts / 文本 |
| `TOOL_CALL` / `TOOL_EVENT` | 工具调用中 {tool} | 状态 toast「正在…」 |
| `AGENT_CARD` | 卡片(见 §2) | pop_large / 各卡 |
| `DECISION_RECORD` | §3 本轮决策记录(见 §4) | agent_step 侧轨 |
| `AGENT_CARD_END_HINT` | turn 末标记 | (引擎用,收尾) |
| `failure` | §14.1 {reason,what_user_can_do,fallback} 无栈 | FailureCard / fail toast |

帧到达顺序 + 时间戳 = **真实节奏**。典型顺序：`EMOTION_TAG → delta(承接语) → TOOL_CALL → AGENT_CARD×N → delta(口播) → DECISION_RECORD → END_HINT`。

---

## 2. AGENT_CARD 帧形态（bridge 真实输出）

bridge `_augment_agent_card` 给每张卡盖这些字段（mock 卡照此填）：
```jsonc
{
  "type": "AGENT_CARD",
  "tool": "get_travel_plan_template",     // 哪个工具产的
  "kind": "TravelDayCard",                // §18 9 卡之一
  "state": "active",                      // dim|active|done|fail (ok=None→active, True→done, False→fail)
  "evidence_level": "E2",                 // E0..E5
  "source": { "provider": "...", "query": "...", "fetched_at": "ISO" },
  "observed_at": "ISO-8601",
  "risk": "R0",                           // R0..R4
  "untrusted_fields": [],                 // §13.2 外部内容字段名
  "mode": null,                           // null | "confirm" | "clarify"(写动作门)
  "ok": true,                             // None=待确认, True=成功, False=失败
  "result": { /* ↓ §3 各卡的内容字段 */ },
  "tool_request_id": "..."
}
```
确认门：`mode:"confirm"` + `ok:null` → 渲染成 confirm-card（摘要+按钮+倒计时）。

---

## 3. 9 卡内容 Schema（§7，填进 `result`）

| 卡 | 关键字段（真实返回） | 真实后端来源 |
|----|---------------------|------------|
| WeatherCard | city,date_range,summary,risk(rain/heat/…/none),life_action,daily_data[],source_time,confidence,uncertainty | get_weather(真) |
| NewsCard | headline,why_it_matters,source,publish_time,confidence,credibility(high/…/unconfirmed),bias_or_uncertainty,expandable | web_search(真) |
| EmailCard | sender,subject,time,priority(P1/P2/P3),why_important,suggested_action,draft_available,send_requires_confirmation | get_mail_*(真) |
| CalendarCard | time,title,location,participants[],status(confirmed/tentative/conflict/free_slot),risk,recommended_action | list/get_event(真) |
| RestaurantCard | name,reason,scenario_fit,distance,price_band,tags[],evidence_source,uncertainty,backup_option | get_restaurant_suggestion(R2 stub) |
| **TravelDayCard** | day,theme,nodes[],transport_notes,weather_notes,pace(light/normal/intense),risk,modifiable_nodes[] | get_travel_plan_template(R2 stub) |
| MeetingActionCard | decision,action_item,owner(\|pending_confirmation),deadline,evidence,evidence_span,confidence,status,follow_up_required | extract_meeting_actions(R2 stub) |
| ConfirmationCard | action,target,impact,content_summary,reversible,requires_explicit_user_confirm | bridge 派生(mode=confirm) |
| FailureCard | completed[],failed[],reason,impact,next_options[] | bridge 派生(ok=false) |

> 注：Restaurant/Travel/Meeting 三卡当前是 **R2 加的 dry-run stub 工具**(canned 数据)，真实内容形态见 §7.x，mock 照填即可；天气/新闻/邮件/日历是真工具。

---

## 4. DECISION_RECORD 形态（agent_step 侧轨内容）

每轮一份，mock 的 `agent_step` 事件照此摘要（让你看见 agent 怎么判的）：
```jsonc
{
  "type": "DECISION_RECORD",
  "request_type": "task",            // chat/query/task/action/judgment/follow_up/correction/emotion/memory_management
  "primary_need": "排上海三天行程",
  "granularity": "segmented",        // single_point | segmented
  "evidence_level": "E2",
  "action_risk": "R0",               // R0..R4
  "output_mode": "document",         // voice|voice_card|document|confirmation|error_state
  "emotion_priority": false,
  "tool_plan": "query",              // none|query|read_private_data|write_pending_confirmation
  "confirmation_required": false,
  "missing_required_slots": [],      // 缺槽→澄清
  "failure_state": "none"
}
```
侧轨展示建议：`router→task·travel ｜ planner→get_travel_plan_template ｜ risk R0 ｜ segmented`。

---

## 5. 旅游 case 真实帧序列（第一个 case 照这个 mock）

「我想去上海旅行三天」→ 真实 agent 会吐（mock 脚本一一对应）：

```
EMOTION_TAG {emo:neutral}                                    → (静态眼,忽略)
delta "好，上海三天我来排。"                                  → tts 承接
[若缺槽] AGENT_CARD{mode:clarify} 或 delta 澄清               → pop_small clarify(停等)
   "三天可直接排，要补日期/人数/预算/偏好吗？不补按中等预算城市漫步。"
TOOL_CALL{tool:get_travel_plan_template}                     → toast「正在排行程…」loading
AGENT_CARD{kind:TravelDayCard, state:active, evidence:E2, risk:R0, result:{
   day:1, theme:"城市漫步", nodes:["外滩","南京路步行街","豫园"],
   transport_notes:"地铁2/10号线", weather_notes:"留意小雨", pace:"light",
   modifiable_nodes:["豫园"] }}                               → TravelDayCard Day1
AGENT_CARD{...day:2, theme:"艺术与江畔", nodes:["西岸美术馆","龙美术馆","滨江"], pace:"normal"...}
AGENT_CARD{...day:3, theme:"市井与离开", nodes:["田子坊","新天地"], pace:"light"...}
delta "第一天轻松城市漫步，第二天看艺术，第三天市井收尾，赶车前留足时间。" → tts 分段(逐日高亮卡)
DECISION_RECORD{request_type:task, granularity:segmented, evidence:E2, risk:R0, output_mode:document}
[可选保存] AGENT_CARD{kind:ConfirmationCard, mode:confirm, result:{
   action:"保存到长期知识库", impact:"以后旅行默认参考", reversible:true,
   content_summary:"上海3天·中等预算·城市漫步" }}                → confirm-card(按钮+倒计时)
```

mock 把上面每帧 → 一个带 `t` 的事件 + 填好 content + 配节奏（TTS 在卡入场后 ~300ms 起，逐日 highlight）。
**这就是"理想链路"的初稿；工作台里回放→标注→调节奏/文案/节点→定稿。**

---

*这份让 mock 卡片内容与真实 agent 返回同构。切真实调用时，把 mock 事件源换成 SSE 帧即可一一对上。*
