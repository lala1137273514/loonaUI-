/* ============================================================
   Loona 工作台 · 运行配置
   —— 多人评论实时同步（Supabase）。零依赖、纯静态、file:// 可跑。
   ============================================================
   不填 = 单机模式：评论存浏览器 localStorage（跨刷新保留，但只在你这台机器）。
   要开启「多人实时同步」：把 LOONA_SUPABASE 改成你的项目 URL + anon key 即可。
   anon key 是公开 key（设计上就允许放前端），配合下面的 RLS 策略即安全。

   ── Supabase 一次性建表（在 Supabase 控制台 SQL Editor 跑）──
     create table public.comments (
       id text primary key,
       task_id text not null,
       event_idx int not null,
       type text not null,            -- 'comment' | '卡点'
       text text default '',
       author text,
       at timestamptz default now()
     );
     alter table public.comments enable row level security;
     create policy "team read"  on public.comments for select using (true);
     create policy "team write" on public.comments for insert with check (true);
     create policy "team delete" on public.comments for delete using (true);
     -- 开启 Realtime：Database → Replication → 勾选 public.comments
   说明：策略对"可信内部小团队"开放读写；要锁定再加 Supabase Auth。
   ============================================================ */
window.LOONA_SUPABASE = { url: 'https://btjpgadfxrxfytillsod.supabase.co', anonKey: 'sb_publishable_cU6PcpNT76-sIhFHsEKAww_AKyjL2oS', table: 'comments' };
// 不接时设为 null 即回到单机 localStorage 模式。

/* 配置存在时，按需注入 supabase-js（CDN）。没配置就完全不发任何远程请求。 */
(function () {
  var c = window.LOONA_SUPABASE;
  if (c && c.url && c.anonKey && !(window.supabase && window.supabase.createClient)) {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.async = false;
    s.onload = function () { if (window.LoonaCommentSync) window.LoonaCommentSync.onClientReady(); };
    document.head.appendChild(s);
  }
})();
