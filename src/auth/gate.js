// =============================================
// CatalogueGen — Password Gate
// Client-side password protection
// =============================================

export const PASSWORD_HASH = 'b942aa539aeaf87e0216f83c4a9c6943830e73a7149483c4496a4d99de5ac617';
const SESSION_KEY = 'cataloguegen_auth';

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function renderGate(onSuccess) {
  if (isAuthenticated()) {
    onSuccess();
    return;
  }

  const gate = document.getElementById('auth-gate');
  gate.innerHTML = `
    <div class="gate-overlay">
      <div class="gate-card">
        <div class="gate-logo">
          <div class="gate-logo__icon">📋</div>
          <h1 class="gate-logo__title">Catalogue<span>Gen</span></h1>
          <p class="gate-logo__subtitle">Product Catalogue Generator</p>
        </div>
        <form id="gate-form" class="gate-form">
          <div class="gate-form__group">
            <label class="form-label" for="gate-password">Password</label>
            <div class="gate-input-wrapper">
              <input 
                type="password" 
                id="gate-password" 
                class="form-input" 
                placeholder="Enter access password"
                autocomplete="current-password"
                autofocus
              >
              <button type="button" id="toggle-password" class="gate-toggle-btn" aria-label="Toggle password visibility">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
            <p id="gate-error" class="gate-error" style="display:none;">Incorrect password. Please try again.</p>
          </div>
          <button type="submit" class="btn btn-primary btn-lg gate-submit">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Unlock
          </button>
        </form>
        <p class="gate-footer">Authorized personnel only</p>
      </div>
    </div>
  `;

  const form = document.getElementById('gate-form');
  const input = document.getElementById('gate-password');
  const error = document.getElementById('gate-error');
  const toggleBtn = document.getElementById('toggle-password');

  toggleBtn.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = input.value;
    if (!password) return;

    const hash = await hashPassword(password);
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      gate.classList.add('gate-exit');
      setTimeout(() => {
        gate.style.display = 'none';
        gate.innerHTML = '';
        onSuccess();
      }, 400);
    } else {
      error.style.display = 'block';
      input.classList.add('form-input-error');
      const card = gate.querySelector('.gate-card');
      card.classList.add('animate-shake');
      setTimeout(() => card.classList.remove('animate-shake'), 500);
      input.value = '';
      input.focus();
    }
  });
}
