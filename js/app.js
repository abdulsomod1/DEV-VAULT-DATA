/* User dashboard logic */

import { supabase } from './supabaseClient.js';

(function () {
  // Note: this file uses ES module import, so it must be loaded as type="module".
  // dashboard.html already uses <script defer>, so update it to type="module".
  window.DV = window.DV || {};


  const $ = (s) => document.querySelector(s);

  const dashboardSkeleton = $('#dashboardSkeleton');
  const dashboardContent = $('#dashboardContent');

  const sidebarAvatar = $('#sidebarAvatar');
  const sidebarUsername = $('#sidebarUsername');
  const sidebarEmail = $('#sidebarEmail');

  const welcomeMsg = $('#welcomeMsg');
  const walletValue = $('#walletValue');
  const activeOrders = $('#activeOrders');

  const logoutBtn = $('#logoutBtn');

  const navLinks = Array.from(document.querySelectorAll('.sidebar__link[data-view]'));
  const viewSections = Array.from(document.querySelectorAll('.view[data-view]'));

  function showView(view) {
    viewSections.forEach(sec => {
      sec.hidden = sec.dataset.view !== view;
    });
    navLinks.forEach(a => {
      a.classList.toggle('is-active', a.dataset.view === view);
    });

    const pageHeading = $('#pageHeading');
    const pageSubheading = $('#pageSubheading');
    if (pageHeading && pageSubheading) {
      const map = {
        home: ['Dashboard', 'Premium dashboard'],
        orders: ['Order History', 'Your purchases'],
        transactions: ['Transactions', 'Payment history'],
        wallet: ['Wallet', 'Manage funds'],
        profile: ['Profile', 'Update your details']
      };
      const m = map[view] || map.home;
      pageHeading.textContent = m[0];
      pageSubheading.textContent = m[1];
    }
  }

  function setLoading(on) {
    if (dashboardSkeleton) dashboardSkeleton.hidden = !on;
    if (dashboardContent) dashboardContent.hidden = !!on;
  }

  async function bootstrap() {
    setLoading(true);

    // If Supabase env is missing, show a clear error instead of leaving the UI blank.
    const diag = window.__SUPABASE_DIAGNOSTICS__;
    if (!diag?.hasUrl || !diag?.hasAnonKey) {
      const msg = document.createElement('div');
      msg.className = 'emptyState';
      msg.style.marginTop = '14px';
      msg.innerHTML = `
        <strong>Supabase configuration missing.</strong><br />
        Set Netlify env vars: <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code>.<br />
        <button class="btn btn--small btn--primary" type="button" id="goLoginBtn">Go to Login</button>
      `;
      if (dashboardContent) {
        dashboardContent.hidden = false;
        dashboardContent.innerHTML = '';
        dashboardContent.appendChild(msg);
      }
      setLoading(false);
      const btn = document.getElementById('goLoginBtn');
      if (btn) btn.addEventListener('click', () => (window.location.href = 'login.html'));
      return;
    }

    // Here we just ensure auth session exists.
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      window.DV.toast(userErr.message || 'Auth failed', 'error');
      window.location.href = 'login.html';
      return;
    }


    const user = userData?.user;
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    // Fetch profile
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('username, email, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profErr) {
      console.error('[dashboard] profile fetch error', profErr);
      window.DV.toast('Could not load profile', 'error');
    }

    // If admin, route to admin
    if (profile?.role === 'admin') {
      window.location.href = 'admin.html';
      return;
    }

    const username = profile?.username || user.email?.split('@')[0] || 'User';
    const email = profile?.email || user.email || '';

    if (welcomeMsg) welcomeMsg.textContent = `Welcome, ${username}`;
    if (sidebarUsername) sidebarUsername.textContent = username;
    if (sidebarEmail) sidebarEmail.textContent = email;

    // Currently there is no backend for wallet/orders in this repo snapshot.
    // Keep placeholders visible but prevent “dashboard blank”.
    if (walletValue) walletValue.textContent = '₦0';
    if (activeOrders) activeOrders.textContent = '0';

    // Wire navigation
    navLinks.forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const view = a.dataset.view;
        showView(view);
      });
    });

    // Default view
    showView('home');

    setLoading(false);

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
      });
    }
  }

  // If user navigates back/forward, ensure auth is still valid.
  document.addEventListener('DOMContentLoaded', bootstrap);
})();


