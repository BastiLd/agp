// Waitlist form handling
const SUPABASE_URL = "https://alrygjwtnodkbtdfwcuu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscnlnand0bm9ka2J0ZGZ3Y3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ1NzIsImV4cCI6MjA4MTAzMDU3Mn0.mGkwvK2Avu__-nyx7gWHIF1VU80cDyUsot4421vXJYM";

document.addEventListener('DOMContentLoaded', () => {
  const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const form = document.getElementById('waitlist-form');
  const emailInput = document.getElementById('email');
  const successMessage = document.getElementById('success-message');

  if (!form || !emailInput || !successMessage) {
    console.error('Required form elements not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();

    if (!email || !isEmailValid(email)) {
      alert('Bitte gültige E-Mail eingeben.');
      return;
    }

    try {
      const { error } = await client.from('waitlist').insert({ email });
      if (error) {
        if (error.code === '23505') {
          alert('Diese E-Mail ist bereits eingetragen.');
          return;
        }
        throw error;
      }

      const anonymizedEmail = anonymizeEmail(email);
      trackWaitlistSubmit(anonymizedEmail);

      successMessage.hidden = false;
      emailInput.value = '';
    } catch (err) {
      console.error(err);
      alert('Leider ist ein Fehler aufgetreten. Bitte versuche es erneut.');
    }
  });

  emailInput.addEventListener('input', () => {
    emailInput.setCustomValidity('');
  });
});

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Anonymize email for tracking (simple masking)
 * @param {string} email - The email address
 * @returns {string} - Anonymized version
 */
function anonymizeEmail(email) {
  const [localPart, domain] = email.split('@');
  if (!domain) return 'invalid';
  
  // Mask local part, keep domain visible but shortened
  const maskedLocal = localPart.length > 2 
    ? localPart.substring(0, 2) + '*'.repeat(Math.min(localPart.length - 2, 4))
    : '*'.repeat(localPart.length);
  
  return `${maskedLocal}@${domain}`;
}

/**
 * Track waitlist submit event
 * @param {string} anonymizedEmail - Anonymized email for tracking
 */
function trackWaitlistSubmit(anonymizedEmail) {
  // Stub: Log to console (replace with actual analytics)
  console.log('Event: waitlist_submit', {
    email: anonymizedEmail,
    timestamp: new Date().toISOString()
  });

  // Example: Could dispatch custom event for analytics
  // window.dispatchEvent(new CustomEvent('waitlist_submit', {
  //   detail: { email: anonymizedEmail }
  // }));
}

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

