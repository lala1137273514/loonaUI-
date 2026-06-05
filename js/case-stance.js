/* ============================================================
   Loona 工作台 · case「立场标签」映射（演示对照用）
   按「OTA深度 / 内容叙事 / 交互形式」框架，给每个旅行 case 打上它代表的立场。
   载入某 case 时，左栏顶部「立场带」显示对应标签，方便边演边对。
   字段：role 演示角色 · ota L层 · form 卡片展现形式 · narrative 结构化/整体
        · turns 交互轮次 · clarify 澄清形式 · selling 种草浓度 · memory 贴记忆/偏好
   ============================================================ */
window.LOONA_STANCE = {
  /* —— 门面/主推：叙事流(交互)，差异化最强 —— */
  travel_chengdu_story: { role: '门面·主推', ota: 'L1', form: '叙事流·交互', narrative: '结构化', turns: '多轮·说+钻取', clarify: '不澄清·直接拍主方案+备选', selling: '高', memory: '记忆彩蛋' },
  travel_chengdu_film: { role: '门面变体·自动播', ota: 'L1', form: '短片·无交互', narrative: '整体', turns: '0轮', clarify: '不停等·澄清落口播', selling: '高', memory: '记忆彩蛋' },

  /* —— 承接/骨架：阶段轮播，被种草后落地成行 —— */
  travel_chengdu_5d: { role: '组合·种草+落地', ota: 'L1', form: '灵感流→阶段轮播', narrative: '结构化', turns: '多轮·选方案+钻取', clarify: '停等(带爸妈)', selling: '高', memory: '记忆彩蛋' },
  travel_chengdu_5d_2stage: { role: '承接·精简', ota: 'L1', form: '阶段轮播', narrative: '结构化', turns: '多轮·钻取', clarify: '停等', selling: '高', memory: '记忆彩蛋' },
  travel_chengdu_3d: { role: '承接·基础', ota: 'L1', form: '阶段轮播', narrative: '结构化', turns: '多轮·钻取', clarify: '停等', selling: '中', memory: '—' },
  travel_chongqing_couple: { role: '承接·完整闭环', ota: 'L1·含保存', form: '阶段轮播', narrative: '结构化', turns: '多轮·澄清+钻取+保存', clarify: '停等(江景/商圈)', selling: '高', memory: '当场偏好·情侣' },

  /* —— 广度：同范式骨架泛化到不同人×地 —— */
  travel_xian_solo: { role: '广度·叙事短片', ota: 'L1', form: '短片·无交互', narrative: '整体', turns: '0轮', clarify: '不停等', selling: '高', memory: '当场偏好·独旅' },
  travel_xiamen_family: { role: '广度·总览条', ota: 'L1', form: '总览条', narrative: '结构化', turns: '多轮·澄清+钻取', clarify: '停等(午睡)', selling: '高', memory: '当场偏好·带娃' },
  travel_dali_friends: { role: '广度·灵感流', ota: 'L0→L1', form: '灵感流', narrative: '结构化', turns: '多轮·钻取', clarify: '不澄清·直接种草', selling: '高', memory: '当场偏好·朋友AA' },

  /* —— 场景入口：决策更前置（去哪/玩啥） —— */
  travel_compare_cities: { role: '场景入口·选目的地', ota: 'L0', form: '多目的地对比', narrative: '结构化', turns: '多轮·钻取', clarify: '不澄清', selling: '中·理性对比', memory: '—' },
  travel_theme_chengdu: { role: '场景入口·选玩法', ota: 'L0→L1', form: '主题玩法', narrative: '结构化', turns: '多轮·钻取', clarify: '不澄清', selling: '中', memory: '—' },

  /* —— 深度：后勤 OTA L2（交通/住宿/预算） —— */
  travel_logistics_demo: { role: '深度·后勤 L2', ota: 'L2', form: '后勤卡·交通/住宿/预算', narrative: '结构化', turns: '0轮·看', clarify: '不澄清', selling: '中·务实', memory: '—' },

  /* —— Cortex 三场景：原始链路 vs V2 优化链路对照 —— */
  cortex_mail_priority: { role: 'V1·P级优先', ota: 'Cortex', form: '邮件列表轮播', narrative: '结构化', turns: '0轮', clarify: '不澄清', selling: '低·效率', memory: 'P0/P1' },
  cortex_mail_priority_v2: { role: 'V2·用户关注', ota: 'Cortex', form: 'brief→重点卡', narrative: '结构化', turns: '0轮·可接动作', clarify: '不澄清', selling: '低·效率', memory: '关注原因' },
  cortex_mail_priority_v3: { role: 'V3·英文草稿', ota: 'Cortex', form: 'brief→待发草稿', narrative: '结构化', turns: '0轮·确认发送', clarify: '不澄清', selling: '低·效率', memory: '业务动作' },
  cortex_mail_priority_v4: { role: 'V4·紧凑草稿', ota: 'Cortex', form: 'brief→窄/宽草稿对比', narrative: '结构化', turns: '0轮·确认发送', clarify: '不澄清', selling: '低·效率', memory: '业务动作' },
  cortex_news_hot: { role: 'V1·搜索结果', ota: 'Cortex', form: '新闻入口列表', narrative: '结构化', turns: '0轮', clarify: '不澄清', selling: '中·信息筛选', memory: 'P级排序' },
  cortex_news_hot_v2: { role: 'V2·新闻入口', ota: 'Cortex', form: '入口列表→分段详情', narrative: '结构化', turns: '0轮·可追问', clarify: '不澄清', selling: '中·信息筛选', memory: '类型标签' },
  cortex_news_hot_v3: { role: 'V3·多模板英文', ota: 'Cortex', form: '多类型入口→英文详情', narrative: '结构化', turns: '1轮·追问展开', clarify: '不澄清', selling: '中·信息筛选', memory: '类型标签' },
  cortex_news_hot_v4: { role: 'V4·关键句详情', ota: 'Cortex', form: '多类型入口→关键句详情', narrative: '结构化', turns: '1轮·追问展开', clarify: '不澄清', selling: '中·信息筛选', memory: '题材泛化' },
  cortex_calendar_week: { role: 'V1·日期聚合', ota: 'Cortex', form: '日程日期卡', narrative: '结构化', turns: '0轮', clarify: '不澄清', selling: '低·提醒', memory: '同日聚合' },
  cortex_calendar_week_v2: { role: 'V2·焦点对齐', ota: 'Cortex', form: '日程列表→逐项聚焦', narrative: '结构化', turns: '0轮·可追问', clarify: '不澄清', selling: '低·提醒', memory: '时间冲突' },
  cortex_calendar_week_v3: { role: 'V3·英文提醒', ota: 'Cortex', form: '日程日期卡→逐项提醒', narrative: '结构化', turns: '0轮·贴心提醒', clarify: '不澄清', selling: '低·提醒', memory: '时间间隔' },
  cortex_calendar_week_v4: { role: 'V4·日程brief', ota: 'Cortex', form: 'brief→日期卡→逐项提醒', narrative: '结构化', turns: '0轮·贴心提醒', clarify: '不澄清', selling: '低·提醒', memory: '时间间隔' },

  /* —— 对照：杭州三方案（同地不同形式，选型用） —— */
  travel_hangzhou_a: { role: '对照·封面钻取', ota: 'L1', form: '阶段轮播', narrative: '结构化', turns: '多轮·钻取', clarify: '停等', selling: '中', memory: '—' },
  travel_hangzhou_c: { role: '对照·总览条', ota: 'L1', form: '总览条', narrative: '结构化', turns: '多轮·钻取', clarify: '停等', selling: '中', memory: '—' },
  travel_hangzhou_b: { role: '对照·灵感流', ota: 'L0→L1', form: '灵感流', narrative: '结构化', turns: '多轮·钻取', clarify: '不澄清·重定位', selling: '高', memory: '—' }
};
