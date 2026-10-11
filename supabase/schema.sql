-- Tables for the Projects & to-dos section.
-- Run this once: Supabase dashboard > SQL Editor > paste > Run.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  created_at timestamptz not null default now()
);

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  done boolean not null default false,
  -- A to-do may belong to a project. Deleting the project keeps its
  -- to-dos and just unlinks them.
  project_id uuid references public.projects (id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index todos_project_id_idx on public.todos (project_id);

-- Row Level Security with no policies means the public (publishable) key
-- can read and write nothing. Only our server, which uses the secret key,
-- gets through.
alter table public.projects enable row level security;
alter table public.todos enable row level security;

grant select, insert, update, delete on public.projects, public.todos to service_role;
