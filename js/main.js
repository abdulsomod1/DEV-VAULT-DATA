/* Global UI helpers: theme toggle, mobile menu, smooth transitions, toasts, modal, skeletons */

(function () {
  const root = document.documentElement;
  const themeKey = 'dv_theme';

  function setTheme(theme) {
    if (theme === 'dark') {
      root.dataset.theme = 'dark';
      localStorage.setItem(themeKey, 'dark');
    } else {
      root.dataset.theme = 'light';
      localStorage.setItem(themeKey, 'light');
    }
  }

  function initTheme() {
    const saved = localStorage.getItem(themeKey);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved) return setTheme(saved);
    setTheme(prefersDark && prefersDark.matches ? 'dark' : 'light');
  }

  function toggleTheme() {
    const current = root.dataset.theme === 'dark' ? 'dark' : 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  function qs(selector) { return document.querySelector(selector); }

  // Toast
  function ensureToastRoot() {
    let el = qs('#toastRoot');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toastRoot';
      el.className = 'toastRoot';
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      document.body.appendChild(el);
    }
    return el;
  }

  window.DV = window.DV || {};

  window.DV.toast = function toast(message, type = 'success', timeout = 3200) {
    const root = ensureToastRoot();
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<div class="toast__title">${type.toUpperCase()}</div><div class="toast__msg"></div>`;
    toast.querySelector('.toast__msg').textContent = message;
    root.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('is-show'));
    window.setTimeout(() => {
      toast.classList.remove('is-show');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, timeout);
  };

  // Modal
  window.DV.modal = {
    open: function (html, { title = 'Notice', confirmText = 'OK', cancelText = null, onConfirm = null, onCancel = null, danger = false } = {}) {
      const modalRoot = qs('#modalRoot') || (() => {
        const m = document.createElement('div');
        m.id = 'modalRoot';
        m.className = 'modalRoot';
        document.body.appendChild(m);
        return m;
      })();

      modalRoot.innerHTML = `
        <div class="modalOverlay" data-modal-overlay></div>
        <div class="modal" role="dialog" aria-modal="true" aria-label="${title}">
          <div class="modal__header">
            <div class="modal__title">${title}</div>
            <button class="iconbtn modal__close" type="button" aria-label="Close">✕</button>
          </div>
          <div class="modal__body">${html}</div>
          <div class="modal__footer">
            ${cancelText ? `<button class="btn btn--ghost" type="button" data-modal-cancel>${cancelText}</button>` : ''}
            <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" type="button" data-modal-confirm>${confirmText}</button>
          </div>
        </div>
      `;

      const overlay = qs('[data-modal-overlay]', modalRoot);
      const closeBtn = qs('.modal__close', modalRoot);
      const confirmBtn = qs('[data-modal-confirm]', modalRoot);
      const cancelBtn = qs('[data-modal-cancel]', modalRoot);

      function close() {
        modalRoot.classList.remove('is-open');
        modalRoot.setAttribute('aria-hidden', 'true');
        modalRoot.innerHTML = '';
      }

      overlay.onclick = close;
      closeBtn.onclick = close;
      if (cancelBtn) cancelBtn.onclick = () => { onCancel && onCancel(); close(); };
      confirmBtn.onclick = () => { onConfirm && onConfirm(); close(); };

      modalRoot.classList.add('is-open');
      modalRoot.setAttribute('aria-hidden', 'false');
      return modalRoot;
    }
  };

  // Mobile menu
  function initMobileMenu() {
    const burger = qs('.hamburger');
    const mobileMenu = qs('.mobileMenu');
    if (!burger || !mobileMenu) return;
    burger.addEventListener('click', () => {
      const isHidden = mobileMenu.hasAttribute('hidden');
      if (isHidden) {
        mobileMenu.removeAttribute('hidden');
      } else {
        mobileMenu.setAttribute('hidden', '');
      }
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.setAttribute('hidden', '')));
  }

  // Footer year
  const year = qs('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Init
  initTheme();
  initMobileMenu();

  // Pricing rendering hook (home page)
  window.DV.renderPricing = window.DV.renderPricing || function () {};


  document.querySelectorAll('#themeToggle, #themeToggleTop, #themeToggleSidebar, #themeToggleSidebarAdmin').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
})();

