/* Auth logic for login/signup/forgot/reset pages using Supabase.
   Uses supabase client from js/supabaseClient.js.
*/

import { supabase } from './supabaseClient.js';

(function () {
  const $ = (s) => document.querySelector(s);

  const loginForm = $('#loginForm');
  const signupForm = $('#signupForm');
  const forgotForm = $('#forgotForm');
  const resetForm = $('#resetForm');

  function setSpinner(btn, on) {
    const spinner = btn.querySelector('.btnSpinner');
    if (spinner) spinner.hidden = !on;
    btn.disabled = !!on;
  }

  function showError(el, msg) {
    el.hidden = false;
    el.textContent = msg;
    el.classList.add('errorBox--show');
  }

  function clearBoxes() {
    document.querySelectorAll('.errorBox, .successBox').forEach(b => { b.hidden = true; b.classList.remove('errorBox--show'); });
  }

  // Remember me: keep a flag only (supabase already persists session)
  window.DV = window.DV || {};

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearBoxes();
      const btn = $('#loginBtn');
      const errBox = $('#loginError');
      setSpinner(btn, true);
      try {
        const mode = loginForm.querySelector('.segmented__btn.is-active')?.dataset?.mode || 'email';
        const identifier = $('#identifier').value.trim();
        const password = $('#password').value;

        if (mode === 'username') {
          // Get user's email by username from profiles table
          const { data: prof, error: profErr } = await supabase
            .from('profiles')
            .select('username, user_id, email')
            .eq('username', identifier)
            .maybeSingle();

          if (profErr) throw profErr;
          if (!prof) throw new Error('Invalid username or password');

          const { data, error } = await supabase.auth.signInWithPassword({ email: prof.email, password });
          if (error) throw error;

        } else {
          const email = identifier;
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        }

        // Redirect based on role (admin)
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error('Session not created');

        // Fetch role from profiles
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profErr) throw profErr;

        if (prof?.role === 'admin') window.location.href = 'admin.html';
        else window.location.href = 'dashboard.html';

      } catch (err) {
        showError(errBox, err?.message || 'Login failed');
        window.DV.toast(err?.message || 'Login failed', 'error');
      } finally {
        setSpinner(btn, false);
      }
    });

    // Segmented control
    loginForm.querySelectorAll('.segmented__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        loginForm.querySelectorAll('.segmented__btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const label = $('#identifierLabel');
        const mode = btn.dataset.mode;
        label.textContent = mode === 'username' ? 'Username' : 'Email address';
        const input = $('#identifier');
        input.type = mode === 'username' ? 'text' : 'email';
        input.autocomplete = mode === 'username' ? 'username' : 'email';
      });
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearBoxes();
      const btn = $('#signupBtn');
      const errBox = $('#signupError');
      setSpinner(btn, true);
      try {
        const username = signupForm.querySelector('input[name="username"]').value.trim();
        const email = signupForm.querySelector('input[name="email"]').value.trim();
        const password = signupForm.querySelector('input[name="password"]').value;
        const confirm = signupForm.querySelector('input[name="passwordConfirm"]').value;

        if (password !== confirm) throw new Error('Passwords do not match');

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + '/reset-password.html'
          }
        });
        if (error) throw error;

        // Create profile row. Email verification is disabled in Supabase admin config.
        // If the user isn't created yet, proceed anyway.
        const userId = data?.user?.id;
        if (userId) {
          const { error: profErr } = await supabase.from('profiles').insert({
            user_id: userId,
            username,
            email,
            role: 'user'
          });
          if (profErr) throw profErr;
        }

        // Keep current behavior for normal users: go to login.
        // If the created user is admin, send them directly to admin.
        let redirectTo = 'login.html';
        const createdUserId = data?.user?.id;
        if (createdUserId) {
          try {
            const { data: createdProf, error: createdProfErr } = await supabase
              .from('profiles')
              .select('role')
              .eq('user_id', createdUserId)
              .maybeSingle();
            if (createdProfErr) throw createdProfErr;
            if (createdProf?.role === 'admin') redirectTo = 'admin.html';
          } catch (_) {
            // If profile lookup fails, fall back to login.
          }
        }

        window.DV.toast('Account created. Redirecting...', 'success');
        window.location.href = redirectTo;

      } catch (err) {
        showError(errBox, err?.message || 'Signup failed');
        window.DV.toast(err?.message || 'Signup failed', 'error');
      } finally {
        setSpinner(btn, false);
      }
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearBoxes();
      const btn = $('#forgotBtn');
      const errBox = $('#forgotError');
      const successBox = $('#forgotSuccess');
      setSpinner(btn, true);
      try {
        const email = forgotForm.querySelector('input[name="email"]').value.trim();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          // Netlify static: use current origin
          redirectTo: window.location.origin + '/reset-password.html'
        });
        if (error) throw error;
        successBox.hidden = false;
        successBox.textContent = 'If your email exists, you will receive a reset link shortly.';
        window.DV.toast('Reset link sent (if email exists).', 'success');
      } catch (err) {
        showError(errBox, err?.message || 'Request failed');
        window.DV.toast(err?.message || 'Request failed', 'error');
      } finally {
        setSpinner(btn, false);
      }
    });
  }

  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearBoxes();
      const btn = $('#resetBtn');
      const errBox = $('#resetError');
      const successBox = $('#resetSuccess');
      setSpinner(btn, true);
      try {
        const password = resetForm.querySelector('input[name="password"]').value;
        const confirm = resetForm.querySelector('input[name="passwordConfirm"]').value;
        if (password !== confirm) throw new Error('Passwords do not match');

        // Supabase auth reset flow: token is in URL fragment/query.
        // supabase-js can handle detectSessionInUrl.
        // Here we call updateUser password with current session (set by reset token in URL).

        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        if (!userData.user) {
          throw new Error('Reset token/session not found. Use the link from email.');
        }

        const { error: updateErr } = await supabase.auth.updateUser({ password });
        if (updateErr) throw updateErr;

        successBox.hidden = false;
        successBox.textContent = 'Password updated successfully. Redirecting to login...';
        window.DV.toast('Password updated.', 'success');
        window.setTimeout(() => (window.location.href = 'login.html'), 1600);
      } catch (err) {
        showError(errBox, err?.message || 'Reset failed');
        window.DV.toast(err?.message || 'Reset failed', 'error');
      } finally {
        setSpinner(btn, false);
      }
    });
  }

})();

