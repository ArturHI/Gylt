-- Adds an optional note to each to-do.
-- Run this once: Supabase dashboard > SQL Editor > paste > Run.
-- (A database created from the current schema.sql already has it.)

alter table public.todos
  add column if not exists note text check (char_length(note) <= 2000);

-- Tell Supabase's API to notice the new column right away.
notify pgrst, 'reload schema';
