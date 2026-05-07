/* Admin dashboard logic */

import { supabase } from './supabaseClient.js';

(function () {
  window.DV = window.DV || {};

  const $ = (s) => document.querySelector(s);

  const adminSkeleton = $('#adminSkeleton');
  const adminContent = $('#adminContent');

  const adminUsername = $('#adminUsername');
  const adminEmail = $('#adminEmail');

  const logoutBtn = $('#adminLogoutBtn');

  const navLinks = Array.from(document.querySelectorAll('.sidebar__link[data-view]'));
  const viewSections = Array.from(document.querySelectorAll('.view[data-view]'));

  function setLoading(on) {
    if (adminSkeleton) adminSkeleton.hidden = !on;
    if (adminContent) adminContent.hidden = !!on;
  }

  function showView(view) {
    viewSections.forEach(sec => {
      sec.hidden = sec.dataset.view !== view;
    });
    navLinks.forEach(a => {
      a.classList.toggle('is-active', a.dataset.view === view);
    });
  }

  async function bootstrap() {
    setLoading(true);

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      window.DV.toast(userErr?.message || 'Auth failed', 'error');
      window.location.href = 'login.html';
      return;
    }

    const user = userData.user;

    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('username, email, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profErr) console.error('[admin] profile fetch error', profErr);

    if (profile?.role !== 'admin') {
      window.DV.toast('Admin access required', 'error');
      window.location.href = 'dashboard.html';
      return;
    }

    const username = profile?.username || user.email?.split('@')[0] || 'Admin';
    const email = profile?.email || user.email || '';

    if (adminUsername) adminUsername.textContent = username;
    if (adminEmail) adminEmail.textContent = email;

    // Wire navigation
    navLinks.forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        showView(a.dataset.view);
      });
    });

    showView('overview');

    // Placeholder stats
    const statUsers = $('#statUsers');
    const statOrders = $('#statOrders');
    const statRevenue = $('#statRevenue');
    if (statUsers) statUsers.textContent = '—';
    if (statOrders) statOrders.textContent = '—';
    if (statRevenue) statRevenue.textContent = '—';

    setLoading(false);

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
      });
    }
  }

  document.addEventListener('DOMContentLoaded', bootstrap);
})();


