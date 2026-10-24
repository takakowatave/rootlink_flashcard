-- 一覧・カルーセルのサムネイル専用画像。記事上部と OGP には使わない（そちらは hero_image_url / 自動カバー）
alter table public.posts add column if not exists thumb_image_url text;
comment on column public.posts.thumb_image_url is '一覧・カルーセルのサムネイル専用画像。記事上部とOGPには使わない（それは hero_image_url / 自動カバー）';
