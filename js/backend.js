/* ===========================================================
   PEERS-IN-TECH — backend.js
   Real Supabase-backed behaviour: auth, course enrollment,
   the contact form, and the newsletter form.

   Requires (loaded before this file, in this order):
     1. https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js
     2. js/supabase-config.js  (defines the `sb` client)
   =========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  function supabaseNotConfigured(el) {
    if (sb) return false;
    el.textContent = "This form isn't connected yet. Add your Supabase project URL and anon key in js/supabase-config.js.";
    el.className = 'error';
    return true;
  }

  /* =========================================================
     AUTH + DASHBOARD (login.html)
     ========================================================= */
  const authSection = document.getElementById('auth-section');
  if (authSection) {
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const panelLogin = document.getElementById('panel-login');
    const panelSignup = document.getElementById('panel-signup');
    const authStatus = document.getElementById('auth-status');
    const dashboard = document.getElementById('dashboard');

    const catalogue = [
      { id: 'digital-literacy', level: 'Beginner', name: 'Digital Literacy Basics', desc: 'Computers, the internet, email, and everyday digital safety.', meta: '6 weeks · Weekends' },
      { id: 'graphic-design', level: 'Beginner', name: 'Graphic Design', desc: 'Photoshop, Canva, and core design fundamentals, our very first course.', meta: '6 weeks · Evenings' },
      { id: 'ms-office', level: 'Beginner', name: 'Microsoft Office', desc: 'Word, Excel, and PowerPoint fundamentals, taught by a mentor who started out learning graphic design with us.', meta: '4 weeks · Evenings' },
      { id: 'web-dev', level: 'Intermediate', name: 'Web Development', desc: 'HTML, CSS, and JavaScript fundamentals, ending with a real site.', meta: '10 weeks · Evenings' },
      { id: 'python', level: 'Intermediate', name: 'Python Programming', desc: 'Core programming logic building toward small automation projects.', meta: '8 weeks · Weekends' },
      { id: 'uiux', level: 'Beginner', name: 'UI/UX Design', desc: 'Design thinking, wireframing, and prototyping tools.', meta: '6 weeks · Evenings' },
      { id: 'cybersecurity', level: 'Intermediate', name: 'Cybersecurity Basics', desc: 'Practical safety: passwords, phishing, and device hygiene.', meta: '4 weeks · Evenings' }
    ];
    // Note: this list mirrors sql/schema.sql's seeded `courses` table exactly.
    // Enroll writes only the course id, so as long as the ids match, this
    // static list is fine to use for display without an extra fetch.

    function showTab(which) {
      const loginActive = which === 'login';
      tabLogin.classList.toggle('active', loginActive);
      tabSignup.classList.toggle('active', !loginActive);
      panelLogin.classList.toggle('active', loginActive);
      panelSignup.classList.toggle('active', !loginActive);
      authStatus.textContent = '';
      authStatus.className = '';
    }
    tabLogin.addEventListener('click', () => showTab('login'));
    tabSignup.addEventListener('click', () => showTab('signup'));
    document.getElementById('switch-to-signup').addEventListener('click', () => showTab('signup'));
    document.getElementById('switch-to-login').addEventListener('click', () => showTab('login'));
    if (window.location.hash === '#signup') showTab('signup');

    function renderCatalogue(enrolledIds) {
      const grid = document.getElementById('enroll-grid');
      grid.innerHTML = catalogue.map(c => `
        <div class="course-card">
          <span class="level">${c.level}</span>
          <h3>${c.name}</h3>
          <p>${c.desc}</p>
          <div class="course-meta"><span>${c.meta}</span></div>
          <button class="enroll-btn ${enrolledIds.includes(c.id) ? 'enrolled' : ''}" data-course="${c.id}" type="button" ${enrolledIds.includes(c.id) ? 'disabled' : ''}>
            ${enrolledIds.includes(c.id) ? 'Enrolled ✓' : 'Enroll'}
          </button>
        </div>
      `).join('');
      grid.querySelectorAll('.enroll-btn:not(.enrolled)').forEach(btn => {
        btn.addEventListener('click', () => enroll(btn.dataset.course, btn));
      });
    }

    function renderEnrolledList(enrolledIds) {
      const list = document.getElementById('enrolled-list');
      if (enrolledIds.length === 0) {
        list.innerHTML = '<p class="empty-state">You haven\'t enrolled in anything yet, pick a course above to get started.</p>';
        return;
      }
      list.innerHTML = enrolledIds.map(id => {
        const c = catalogue.find(x => x.id === id);
        if (!c) return '';
        return `<div class="enrolled-row"><span class="name">${c.name}</span><span class="meta">${c.meta}</span></div>`;
      }).join('');
    }

    async function fetchEnrolledIds(userId) {
      const { data, error } = await sb.from('enrollments').select('course_id').eq('user_id', userId);
      if (error) {
        console.error('Could not load enrollments:', error.message);
        return [];
      }
      return data.map(row => row.course_id);
    }

    async function enroll(courseId, btn) {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      btn.disabled = true;
      btn.textContent = 'Enrolling…';
      const { error } = await sb.from('enrollments').insert({ user_id: user.id, course_id: courseId });
      if (error && error.code !== '23505') { // 23505 = already enrolled (unique constraint), treat as success
        btn.disabled = false;
        btn.textContent = 'Enroll';
        authStatus.textContent = 'Could not enroll: ' + error.message;
        authStatus.className = 'error';
        return;
      }
      btn.textContent = 'Enrolled ✓';
      btn.classList.add('enrolled');
      const enrolledIds = await fetchEnrolledIds(user.id);
      renderEnrolledList(enrolledIds);
    }

    async function enterDashboard(user) {
      const { data: profile } = await sb.from('profiles').select('full_name, role').eq('id', user.id).single();
      const name = (profile && profile.full_name) ? profile.full_name : (user.email || 'there');
      const role = (profile && profile.role) ? profile.role : 'Student';
      document.getElementById('dash-name').textContent = name.split(' ')[0];
      document.getElementById('dash-role').textContent = role;

      const enrolledIds = await fetchEnrolledIds(user.id);
      renderCatalogue(enrolledIds);
      renderEnrolledList(enrolledIds);

      dashboard.classList.add('active');
      dashboard.scrollIntoView({ behavior: 'smooth' });
    }

    document.getElementById('signup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (supabaseNotConfigured(authStatus)) return;
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const role = document.getElementById('signup-role').value;

      authStatus.textContent = 'Creating your account…';
      authStatus.className = '';

      const { data, error } = await sb.auth.signUp({
        email, password,
        options: { data: { full_name: name, role } }
      });

      if (error) {
        authStatus.textContent = error.message;
        authStatus.className = 'error';
        return;
      }

      if (data.session) {
        // Email confirmation is off in the Supabase project, session is live immediately.
        await enterDashboard(data.user);
      } else {
        // Email confirmation is on (Supabase default): no session until the user confirms.
        authStatus.textContent = 'Account created. Check your email to confirm it, then log in.';
        authStatus.className = 'success';
        showTab('login');
      }
    });

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (supabaseNotConfigured(authStatus)) return;
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      authStatus.textContent = 'Logging in…';
      authStatus.className = '';

      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        authStatus.textContent = error.message;
        authStatus.className = 'error';
        return;
      }
      await enterDashboard(data.user);
    });

    document.getElementById('logout-btn').addEventListener('click', async () => {
      if (sb) await sb.auth.signOut();
      dashboard.classList.remove('active');
      document.getElementById('login-form').reset();
      document.getElementById('signup-form').reset();
      showTab('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // If a session already exists (real persistence, unlike the old demo),
    // skip straight to the dashboard on page load.
    if (sb) {
      sb.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) enterDashboard(session.user);
      });
    } else {
      authStatus.textContent = "Supabase isn't configured yet. Add your project URL and anon key in js/supabase-config.js to enable login.";
      authStatus.className = 'error';
    }
  }

  /* =========================================================
     CONTACT FORM (contact.html)
     ========================================================= */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = document.getElementById('form-status');
      if (supabaseNotConfigured(status)) return;

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const reason = document.getElementById('reason').value;
      const message = document.getElementById('message').value.trim();
      if (!name || !message) return;

      status.textContent = 'Sending…';
      status.className = '';

      const { error } = await sb.from('contact_messages').insert({ name, email, reason, message });
      if (error) {
        status.textContent = 'Something went wrong: ' + error.message;
        status.className = 'error';
        return;
      }
      status.textContent = `Thanks, ${name.split(' ')[0]}, your message has been sent. We'll get back to you soon.`;
      status.classList.add('success');
      contactForm.reset();
    });
  }

  /* =========================================================
     NEWSLETTER FORM (index.html)
     ========================================================= */
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = document.getElementById('newsletter-status');
      if (supabaseNotConfigured(status)) return;

      const input = newsletterForm.querySelector('input[type="email"]');
      const email = input.value.trim();
      if (!email) return;

      status.textContent = 'Subscribing…';
      const { error } = await sb.from('newsletter_subscribers').upsert({ email });
      if (error) {
        status.textContent = 'Something went wrong: ' + error.message;
        return;
      }
      status.textContent = "You're subscribed. Thanks for staying in the loop.";
      newsletterForm.reset();
    });
  }

});
