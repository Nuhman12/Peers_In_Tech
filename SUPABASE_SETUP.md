# Connecting Supabase — setup guide

The site's login, course enrollment, contact form, and newsletter form are
now wired to talk to a real Supabase backend. You just need to create the
project and plug in two values. Takes about 10 minutes.

## 1. Create a Supabase project

1. Go to https://supabase.com and sign up / log in (free tier is enough).
2. Click **New project**. Pick an organisation, name it (e.g. `peers-in-tech`),
   set a database password (save it somewhere), pick a region close to your
   users (e.g. an EU or nearest available region for Ghana), and create it.
3. Wait a minute or two while it provisions.

## 2. Run the database schema

1. In your project's dashboard, open **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open `sql/schema.sql` from this project, copy all of it, paste it in.
4. Click **Run**.

This creates five tables (`profiles`, `courses`, `enrollments`,
`contact_messages`, `newsletter_subscribers`), seeds your 9 real courses,
and sets up Row Level Security so people can only ever read/write their own
data.

## 3. Get your project URL and anon key

1. In the dashboard, go to **Project Settings** (gear icon) -> **API**.
2. Copy the **Project URL** (looks like `https://abcxyzcompany.supabase.co`).
3. Copy the **anon public** key (a long string starting with `eyJ...`).

## 4. Paste them into the site

Open `js/supabase-config.js` and replace the two placeholder values:

```js
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

with your real values. Save the file. That's it, login, signup, enrollment,
the contact form, and the newsletter form are all live.

## 5. One setting worth deciding: email confirmation

By default, Supabase requires a new user to click a confirmation link in
their email before they can log in. That's the right call for a real
launch, but it means signing up won't drop someone straight into the
dashboard the way the old demo did.

- **To keep email confirmation on** (recommended for production): nothing
  to do, it's already handled, the sign up form will tell people to check
  their email.
- **To turn it off** (useful while you're testing): in the dashboard, go to
  **Authentication -> Providers -> Email** and toggle off
  **Confirm email**.

## 6. Test it

1. Open `login.html` in a browser (opening the file directly works, no
   server needed).
2. Sign up with a real email you can check.
3. If email confirmation is on, confirm it, then log in. If it's off, you
   should land on the dashboard immediately.
4. Enroll in a course, refresh the page, log in again, the enrollment
   should still be there, that's the real difference from the old demo.
5. Try the contact form and newsletter form too. Check **Table Editor** in
   the Supabase dashboard to see the submissions land in
   `contact_messages` and `newsletter_subscribers`.

## Where things live

| What | Where |
|---|---|
| Your credentials | `js/supabase-config.js` |
| Database schema | `sql/schema.sql` (only needs running once) |
| Auth, enrollment, contact, newsletter logic | `js/backend.js` |
| Everything else (nav, animations, etc.) | `js/app.js` (unchanged) |

## Reading your data

Contact messages and newsletter signups don't email you automatically,
they just get saved to the database. To check them, use the **Table
Editor** in the Supabase dashboard. If you want actual email notifications
later, that's a Supabase Edge Function or a service like Zapier watching
the table, a good next step once the basics are working.

## A note on this guide

I can't create the Supabase project or test the live connection myself,
I don't have network access in this environment. Everything above is
correct against Supabase's current JS client (v2) API, but test the full
flow yourself once it's connected, and let me know if anything doesn't
behave as expected so we can fix it together.
