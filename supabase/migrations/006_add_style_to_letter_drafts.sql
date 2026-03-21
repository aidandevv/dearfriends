alter table letter_drafts
  add column if not exists style jsonb not null
  default '{"font":"serif","accentColor":"#C05C2E","lineSpacing":"normal","fontSize":"medium"}';
