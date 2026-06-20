/* ================================================================
   R.D. Plumbing & Heating — main script
   ================================================================ */

/* ── Year in footer ── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── Mobile nav toggle ── */
const menuBtn  = document.getElementById('menu-btn');
const navLinks = document.getElementById('nav-links');

if (menuBtn && navLinks) {
  menuBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  });

  /* Close when any nav link is tapped */
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });

  /* Close on outside click */
  document.addEventListener('click', e => {
    if (!menuBtn.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ── Smooth-scroll anchor links (respects reduced-motion) ── */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const navHeight = document.querySelector('.nav')?.offsetHeight || 68;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;
    window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
});

/* ── Scroll-reveal animation ── */
if (!prefersReducedMotion) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
} else {
  /* Reveal everything immediately for users who prefer reduced motion */
  document.querySelectorAll('.fade-in').forEach(el => el.classList.add('is-visible'));
}

/* ── Booking form submission ── */
const bookingForm  = document.getElementById('booking-form');
const formBody     = document.getElementById('form-body');
const formSuccess  = document.getElementById('form-success');
const submitBtn    = document.getElementById('submit-btn');

if (bookingForm) {
  /* Set minimum datetime to now */
  const dtInput = document.getElementById('datetime');
  if (dtInput) {
    const pad = n => String(n).padStart(2, '0');
    const now = new Date();
    dtInput.min = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  bookingForm.addEventListener('submit', async e => {
    e.preventDefault();

    if (!bookingForm.checkValidity()) {
      bookingForm.reportValidity();
      return;
    }

    const originalLabel = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Sending…';
    submitBtn.disabled = true;

    const formData = new FormData(bookingForm);

    try {
      const res = await fetch(bookingForm.action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        /* Cache submission locally for the admin panel */
        saveSubmission(Object.fromEntries(formData.entries()));

        formBody.style.display    = 'none';
        formSuccess.style.display = 'block';
        formSuccess.focus();
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Server error');
      }
    } catch (err) {
      submitBtn.innerHTML = originalLabel;
      submitBtn.disabled  = false;
      alert(
        'Sorry, there was a problem sending your enquiry.\n' +
        'Please call us directly on +44 7514 921793 and we\'ll help straight away.'
      );
      console.error('Form error:', err);
    }
  });
}

/* ── Save submission to localStorage (powers the admin panel) ──
   Note: this only persists on the browser/device where the form
   was submitted. Use the Formspree dashboard for full history. */
function saveSubmission(data) {
  try {
    const key  = 'rd_plumbing_submissions';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.unshift({ ...data, _savedAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(list));
  } catch (_) { /* localStorage may be unavailable in private browsing */ }
}
