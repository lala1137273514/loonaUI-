# Figma 视觉规格 · Loona 手机版地基 + 组件

> 抽自 Figma `1GXkRFjHMpcxDyPbIh2ZYf` (slack-4.30) Frame 26/27 + face + pop_small。
> 给新 session 离线照搭用。眼睛**静态不动**。资产 URL 7 天过期，下面给了**纯 CSS 复刻配方**，不依赖 raster。

---

## 1. 画布 / 调色板

| 项 | 值 |
|----|----|
| 背景 | `#000000` 纯黑 |
| 舞台尺寸(设计帧) | 812 × 375（横版；手机壳按此比例或竖版自适应，核心是双眼居中 + 右上角气泡/菜单） |
| 主字体 | `PingFang SC`（中文）, fallback `-apple-system, system-ui, sans-serif` |
| 琥珀主色(眼睛/辉光) | 暖琥珀 `#ffb454`→`#ff8a1e`，中心高光 `#fff6e0` |
| 文本 | 白 `#ffffff`；次要 `rgba(255,255,255,.6)` |

情绪辉光色（知识库权威值，本期眼睛静态先用 neutral，但留好接口）：
neutral `#9ec5ff`(注:Jarvis orb 旧值) / Figma 眼睛实际是琥珀 `#ffb454`。**地基用 Figma 琥珀;情绪变色是决策机后话。**

---

## 2. 双眼（静态）

布局（来自 face 节点 1:64）：
- 每只眼 **280×280px**
- 左眼中心 = 画布中心 **−140px**，右眼 = 中心 **+140px**（两眼中心相距 280px，几乎相邻）
- 垂直：略高于中心（`top: calc(50% − 16.5px)`）
- 眼后：一层琥珀**椭圆辉光**（519×191，柔光铺底）
- 眼内：琥珀径向渐变 + **偏上的白色高光点** + 轻微 `backdrop-blur(5.6px)` 玻璃感

**纯 CSS 复刻配方**（静态，无需 Rive/raster）：
```css
.loona-eye{
  width:280px;height:280px;border-radius:42%;   /* 圆角方块/胶状 */
  background:
    radial-gradient(120px 120px at 50% 38%, #fff6e0 0%, #ffd47a 18%, #ffb454 42%, #ff8a1e 72%, #c75a00 100%);
  box-shadow:0 0 90px 10px rgba(255,150,40,.45),       /* 外辉光 */
             inset 0 0 60px rgba(255,90,0,.35);
  position:relative;
}
.loona-eye::after{                                    /* 高光点 */
  content:"";position:absolute;left:50%;top:30%;
  width:64px;height:84px;border-radius:50%;
  transform:translate(-50%,-50%);
  background:radial-gradient(closest-side,#fffdf5,rgba(255,255,255,0));
  filter:blur(2px);
}
.loona-face{display:flex;gap:0;justify-content:center;align-items:center}
.loona-face .loona-eye+.loona-eye{margin-left:-0px}   /* 两眼相距≈中心±140 */
/* 舞台底色 #000 + 眼后再叠一层柔琥珀椭圆 radial-gradient 作 ambient */
```

---

## 3. pop_small（核心气泡：query / 澄清 / 状态）

精确规格（节点 58:5098）：
```css
.pop-small{
  backdrop-filter:blur(25px);
  background:
    linear-gradient(90deg, rgba(255,255,255,.1), rgba(255,255,255,.1)),
    linear-gradient(90deg, rgba(0,0,0,.5), rgba(0,0,0,.5));   /* 磨砂深玻璃 */
  border:1px solid rgba(255,255,255,.3);
  border-radius:24px;
  padding:12px;
  min-width:120px;
  display:flex;gap:10px;align-items:center;
}
.pop-small .icon{width:32px;height:32px}        /* 状态图标槽(globe/loading/...) */
.pop-small .text{
  max-width:240px;color:#fff;font:14px/19.6px "PingFang SC";
  word-break:break-word;
}
```
位置：右上 `right:44px; top:44px`（菜单 `vg_menu` 24px 在更右上 `right≈44px? top:10px`）。

---

## 4. 组件库清单（照 Figma 风格做，逐个 gallery 可看）

| 组件 | 风格要点 | Figma 源 |
|------|---------|---------|
| `loona-face`(双眼) | §2 配方，静态 | face 1:64 |
| `pop_small` | §3 磨砂玻璃气泡 | 58:5098 |
| `toast` | 同 pop_small 玻璃风 + 状态图标(searching/loading/sending/done/fail) | pop_small 变体 |
| `pop_large` | 同玻璃风、更大、可含标题/列表/卡内容；圆角 24px | pop_large(59×) |
| `TravelDayCard` | pop_large 内：day 标题 + 主题 + 节点列表(node 行) + pace badge | §7.6 schema |
| `list_item` | 行卡：头像/标题/副文/时间；用于消息/频道/用户/节点 | list_slack_*(50/28/18/9×) |
| `btn-fill` | 实心按钮(确认/取消)；琥珀主按钮 + 描边次按钮 | btn-fill(50×) |
| `状态视觉` | searching=globe转 / loading=spin / sending=纸飞机 / done=对勾 / fail=叉。本期用 CSS/简动效或静态图标对齐 | .riv 6 种 |
| `confirm-card` | pop_large + 摘要 + 两 btn-fill + 倒计时环(默认30s) | btn-fill 组合 |
| `tts-subtitle` | 底部居中字幕，半透明黑底白字，跟随 TTS 播报 | 新增 |

状态动画 .riv 原件名（要更高保真可让连 Figma MCP 的会话导出帧）：
`globe_looking` / `loading_spin_ccw` / `paperplane_fly_once` / `circle_checkmark` / `ciecle_xmark` / `mail_scroll_once`

---

## 5. 给新 session 的取材建议
- 静态双眼 + pop_small 用上面 CSS 配方即可，**不需要 Figma MCP**。
- 若要像素级还原状态动画(.riv)或更多卡，让新 session **也连 Figma MCP**，按节点 ID 拉：
  face `1:64` / pop_small `58:5098` / Frame 26 `1:160` / Frame 27 `1:170`。

*抽取自真实设计文件。眼睛静态、琥珀、280px、居中相邻、白心高光、外琥珀辉光——这是地基的视觉锚点。*
