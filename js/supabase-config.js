

const SUPABASE_URL = "vnzczeaweipdfngvffdw";     
const SUPABASE_ANON_KEY = "sb_publishable_K7IiRwWFprQxBb9ddYik4A_Iq1DgrRU";   
const sb = (SUPABASE_URL.startsWith("YOUR_") || SUPABASE_ANON_KEY.startsWith("YOUR_"))
  ? null
  : supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

if (!sb) {
  console.warn(
    "Supabase isn't configured yet. Add your project URL and anon key in js/supabase-config.js. " +
    "Forms and login will show a friendly error until then."
  );
}
