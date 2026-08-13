-- =========================================================
-- PEERS-IN-TECH — Supabase schema
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- PROFILES
-- Extends the built-in auth.users table with a name and role.
-- A row is created automatically whenever someone signs up
-- (see the trigger below), so you never insert into this
-- table directly from the front end.
-- ---------------------------------------------------------
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text default 'Student',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row on signup, pulling name/role out of
-- the metadata passed in from the sign up form.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'Student')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------
-- COURSES
-- Your public course catalogue. Publicly readable by anyone,
-- editable only from the Supabase dashboard (no public write
-- policy is defined, so the front end cannot alter this table).
-- Seeded with the same 9 tracks listed on courses.html.
-- ---------------------------------------------------------
create table public.courses (
  id text primary key,
  name text not null,
  level text,
  description text,
  duration text
);

alter table public.courses enable row level security;

create policy "Courses are publicly readable"
  on public.courses for select
  using (true);

insert into public.courses (id, name, level, description, duration) values
  ('digital-literacy', 'Digital Literacy Basics', 'Beginner', 'Computers, the internet, email, and everyday digital safety.', '6 weeks · Weekends'),
  ('graphic-design', 'Graphic Design', 'Beginner', 'Photoshop, Canva, and core design fundamentals, the very first skill PEERS IN TECH taught online.', '6 weeks · Evenings'),
  ('ms-office', 'Microsoft Office', 'Beginner', 'Word, Excel, and PowerPoint fundamentals, taught by a mentor who started out learning graphic design with us.', '4 weeks · Evenings'),
  ('web-dev', 'Web Development', 'Intermediate', 'HTML, CSS, and JavaScript fundamentals, ending with a real site.', '10 weeks · Evenings'),
  ('python', 'Python Programming', 'Intermediate', 'Core programming logic building toward small automation projects.', '8 weeks · Weekends'),
  ('uiux', 'UI/UX Design', 'Beginner', 'Design thinking, wireframing, and prototyping tools.', '6 weeks · Evenings'),
  ('cybersecurity', 'Cybersecurity Basics', 'Intermediate', 'Practical safety: passwords, phishing, and device hygiene.', '4 weeks · Evenings');

-- ---------------------------------------------------------
-- ENROLLMENTS
-- Join table between a user and a course. A user can only
-- see and create their own enrollments, and can't enroll in
-- the same course twice (unique constraint).
-- ---------------------------------------------------------
create table public.enrollments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  course_id text references public.courses on delete cascade not null,
  enrolled_at timestamptz default now(),
  unique (user_id, course_id)
);

alter table public.enrollments enable row level security;

create policy "Users can view their own enrollments"
  on public.enrollments for select
  using (auth.uid() = user_id);

create policy "Users can enroll themselves"
  on public.enrollments for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------
-- CONTACT MESSAGES
-- Stores contact.html form submissions. Anyone can insert
-- (it's a public contact form), nobody can read from the
-- front end, you'll read these from the Supabase dashboard
-- (Table Editor) or wire up an email notification separately.
-- ---------------------------------------------------------
create table public.contact_messages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  reason text,
  message text not null,
  created_at timestamptz default now()
);

alter table public.contact_messages enable row level security;

create policy "Anyone can submit a contact message"
  on public.contact_messages for insert
  with check (true);

-- ---------------------------------------------------------
-- NEWSLETTER SUBSCRIBERS
-- Stores index.html newsletter signups. Email is the primary
-- key so resubscribing with the same address just updates the
-- timestamp instead of erroring.
-- ---------------------------------------------------------
create table public.newsletter_subscribers (
  email text primary key,
  subscribed_at timestamptz default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert
  with check (true);

create policy "Anyone can update their own subscription timestamp"
  on public.newsletter_subscribers for update
  using (true);
