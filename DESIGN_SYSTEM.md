# Loona 组件设计系统（统一规则）

> 抽自 Figma「Slack 4.30 专项」(file `1GXkRFjHMpcxDyPbIh2ZYf`) 真实组件。
> **所有现有组件已对齐本规范；新增组件必须遵守本文件，保证整体风格统一。**
> 实现见 `css/loona.css`(§① token + §② 组件) 和 `js/components.js`。
> **尺寸 / 溢出 / 校验以 [`UI-SPEC.md`](UI-SPEC.md) 为准**(固定包络 + 字号阶梯 + 三溢出策略 + §12 校验清单)；本文件管 token / 两玻璃容器语义 / 颜色。两者一致，冲突时 UI-SPEC 胜。

---

## 0. 一句话原则

Loona 的 UI 只有**两种玻璃容器** + 一套**文本层级** + 一个**琥珀按钮**。
任何新组件都不是从零画,而是 **pop_small（短）** 或 **pop_large（富）** 的一个内容变体。

---

## 1. 设计 Token（唯一真值，写在 `css/loona.css :root`）

### 文本层级（Figma text/lv0..lv3）
| token | 值 | 用途 |
|-------|-----|------|
| `--t0` | `#ffffff` | 标题、pop_small 正文、list 标题 |
| `--t1` | `#cccccc` | pop_large 正文 |
| `--t2` | `#999999` | 副文 / 时间戳 / 脚注 / 元信息 |
| `--t3` | `#666666` | 三级弱化 |
| `--kw` | `#ffe500` | 句中关键词高亮（`<span class="kw">`） |

### 主色 / 玻璃
| token | 值 | 用途 |
|-------|-----|------|
| `--btn-amber` | `#ffb200` | btn-fill 主色 / 选中态 / 倒计时环 |
| 琥珀眼/辉光 | `#ffb454`→`#ff8a1e` | 仅地基双眼（真实资产，勿用 CSS 复刻） |
| `--glass-bg-sm` | 白.10 ＋ **黑.50** | **pop_small**（短气泡/状态/输入） |
| `--glass-bg-lg` | 白.10 ＋ **黑.70** | **pop_large**（富结果卡，更实） |
| `--glass-bg-q` | 琥珀.16 ＋ 黑.50 | pop_small `role=query`（用户/ASR 输入染色） |
| `--glass-border` | `1px solid rgba(255,255,255,.30)` | 两种玻璃统一描边 |
| `--glass-blur` | `blur(25px)` | 两种玻璃统一背景模糊 |

### 几何
- 圆角:容器统一 **24px**(`--radius`);按钮 **999px**(full pill);头像/徽章/单选 圆形。
- 模糊:**25px**(玻璃);图标槽 **32px**;关闭 X **24px**。
- 字号:标题/正文 **14px**(行高 19.6);副文/脚注 **12px**;按钮 14/22.4。
- 字体:`PingFang SC`,fallback system。

---

## 2. 两个基础容器（一切组件的底座）

### pop_small（短气泡）
```
[ icon 32 ][ 文本 14/白 (可含 .kw 高亮) ][ 可选 btn-fill ]
黑.50 玻璃 · 圆角24 · padding12 · gap10 · min-width120 · 居中
```
承载:**状态反馈**(searching/loading/sending/done/fail，配状态图标)、**用户 ASR 输入**(`role=query`，琥珀染色)、**澄清问句**(`role=clarify`)、**toast**(同款 + 阴影)。
> ASR / 用户语音输入 = `popSmall({role:'query', who:'我（语音）', text})`，不要另造气泡。

### pop_large（富结果卡）
```
┌─ pl-head:  [ icon 32 ][ 标题 14 Semibold 白 ][ 关闭X 24 ] ─┐
├─ pl-divider: 1px rgba(255,255,255,.12) 通栏 ───────────────┤
├─ pl-body:   正文 #ccc / list 行 / 自定义内容 ──────────────┤
└─ pl-footer: 元信息 #999 12（# 频道 · @user / 时间戳 等）────┘
黑.70 玻璃 · 圆角24 · padding20 · gap8
```
承载:消息/搜索结果、各业务卡(TravelDayCard…)、确认卡(confirm)、总结、草稿预览。
> 用 `LoonaUI.popLargeCard({icon, title, titleExtra, body, footer, closeable, state})` 生成，**不要手拼**。

---

## 3. 内容零件

| 零件 | 规格 |
|------|------|
| **状态图标** | 真实 Figma `.riv` 渲染图 `assets/icons/{globe,loading,paperplane,check,xmark}.png`，32px。loading/searching 加 `.sv-spin`。**不要用 emoji / 自画 svg 替代。** |
| **list_item · message** | `info`:标题(白14) + `subrow`:[`#频道` · `用户` 间用 2px 圆点分隔，#999 12] + 右侧时间戳(#999 12)。 |
| **list_item · user** | 圆头像36 + (姓名白14 + 邮箱#999 12) + 右侧 amber 单选圈(选中实心)。 |
| **btn-fill** | h32 / px16 / 圆角999。`primary`=`#ffb200` 黑字 + 玻璃内阴影 `inset 0 -6px 10px rgba(255,255,255,.3), inset 0 6px 10px #fa0`;`ghost`=描边白字;`disabled`=灰 `#5a5b60`。 |
| **关闭 X** | `assets/icons/close.svg` 24px，默认 opacity .7，hover 1。 |
| **徽章/pace** | 圆角 999 小标签;pace 用语义色(light 绿 / normal 琥珀 / intense 红)。 |
| **倒计时环** | 34px SVG，描边 `#ffb200`，居中数字 #999。 |

---

## 4. 新增组件检查清单（提交前自检）

1. **底座**:是 pop_small 还是 pop_large 的变体?(几乎不该有第三种容器)
2. **玻璃**:用了 `--glass-bg-sm/-lg` + `--glass-border` + `blur(25px)`?圆角 24?
3. **文本**:标题 `--t0`、正文 `--t1`、副文/元信息 `--t2`?字号 14/12?**没有硬编码颜色**?
4. **图标**:状态图标用 `assets/icons/*` 真实资产、32px 槽?
5. **按钮**:用 `btnFill()` 三态,主按钮 `#ffb200` + 玻璃内阴影?
6. **结构**:富卡走 `pl-head / pl-divider / pl-body / pl-footer` 四段式?
7. **复用**:在 `js/components.js` 写成返回 DOM 的纯函数,并在 `gallery.html` 加一格可单独看。
8. **眼睛**:本期静态,任何组件**不得驱动眼睛动效**。

> 违反任一条 = 风格会漂移。要加新视觉,先回 Figma 按节点 ID 拉真值(`get_design_context` / `get_screenshot`),再落到本规范。

---

## 5. Figma 溯源（节点 ID，便于复核 / 再拉）

| 组件 | Figma 节点 |
|------|-----------|
| face 双眼 | `1:161`（Frame 26 `1:160` / Frame 27 `1:170`） |
| pop_small | `58:5098`、`172:48624` |
| pop_large | `172:49237`（查消息）、`162:43973`（消息发送） |
| list_slack_message / user / thread | `214:37827` 等 |
| btn-fill | `162:43968`（`#ffb200` + 玻璃内阴影） |
| 状态 .riv | globe/loading/paperplane/circle_checkmark/ciecle_xmark |

*token 与组件以本文件为准;Figma 为视觉真值来源。*
