## user_profile table

```
create table public.user_profiles (
  id uuid not null,
  email text not null,
  username text not null,
  mother_tongues text[] not null default '{}'::text[],
  target_languages jsonb not null default '[]'::jsonb,
  is_admin boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  prompts jsonb null,
  constraint user_profiles_pkey primary key (id),
  constraint user_profiles_username_key unique (username),
  constraint user_profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_username on public.user_profiles using btree (username) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_email on public.user_profiles using btree (email) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_mother_tongues on public.user_profiles using gin (mother_tongues) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_target_languages on public.user_profiles using gin (target_languages) TABLESPACE pg_default;

create trigger update_user_profiles_updated_at BEFORE
update on user_profiles for EACH row
execute FUNCTION update_updated_at_column ();
```

## words
```
create table public.words (
  id uuid not null default gen_random_uuid (),
  lemma character varying not null,
  lang character varying not null,
  collocations jsonb not null,
  updated_at timestamp without time zone null,
  constraint words_pkey primary key (id),
  constraint words_lemma_lang_unique unique (lemma, lang)
) TABLESPACE pg_default;
```

## tags
```
create table public.tags (
  id uuid not null default gen_random_uuid (),
  name text not null,
  normalized_name text not null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint tags_pkey primary key (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists tags_normalized_name_idx on public.tags using btree (normalized_name) TABLESPACE pg_default;
```

## word_tags
```
create table public.word_tags (
  id uuid not null default gen_random_uuid (),
  word_id uuid not null,
  tag_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint word_tags_pkey primary key (id),
  constraint word_tags_word_id_tag_id_key unique (word_id, tag_id),
  constraint word_tags_tag_id_fkey foreign KEY (tag_id) references tags (id) on delete CASCADE,
  constraint word_tags_word_id_fkey foreign KEY (word_id) references words (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists word_tags_word_id_idx on public.word_tags using btree (word_id) TABLESPACE pg_default;

create index IF not exists word_tags_tag_id_idx on public.word_tags using btree (tag_id) TABLESPACE pg_default;
```

## decks
```
create table public.decks (
  id character varying not null,
  user_id uuid not null,
  name text not null default ''::text,
  que_lang character varying not null default 'en'::character varying,
  ans_langs character varying not null default '[''es'']'::character varying,
  diff_level character varying not null default 'elementary'::character varying,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint decks_pkey primary key (id),
  constraint decks_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;
```

## deck_words
```
create table public.deck_words (
  id uuid not null default gen_random_uuid (),
  deck_id character varying not null,
  word_id uuid not null,
  state int4 not null default 1,
  stability float4 not null default 0.0,
  difficulty float4 not null default 0.0,
  due timestamp with time zone not null default now(),
  last_review timestamp with time zone null,
  step int4 not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint deck_words_pkey primary key (id),
  constraint deck_words_deck_id_word_id_key unique (deck_id, word_id),
  constraint deck_words_deck_id_fkey foreign key (deck_id) references decks (id) on delete cascade,
  constraint deck_words_word_id_fkey foreign key (word_id) references words (id) on delete cascade
) tablespace pg_default;

create index if not exists deck_words_deck_id_idx on public.deck_words using btree (deck_id) tablespace pg_default;

create index if not exists deck_words_word_id_idx on public.deck_words using btree (word_id) tablespace pg_default;

create index if not exists deck_words_due_idx on public.deck_words using btree (due) tablespace pg_default;

create trigger update_deck_words_updated_at before
update on deck_words for each row
execute function update_updated_at_column ();
```