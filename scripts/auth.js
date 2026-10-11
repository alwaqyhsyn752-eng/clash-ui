/* ============================================
   Clash of Armored - Auth System
   تسجيل الدخول + إنشاء بروفايل
   ============================================ */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  let pm = null;  // ProfileManager

  /* ===== التهيئة ===== */
  function init() {
    if (!window.COA || !window.COA.cache) {
      console.warn('⚠ COA cache not ready');
      return;
    }
    pm = new ProfileManager(window.COA.cache);
    window.COA.profile = pm;

    // إتاحة عامة
    window.CoaAuth = {
      showLogin: showLoginScreen,
      showRegister: showRegisterScreen,
      showProfile: showProfileScreen,
      getProfile: () => pm.get(),
      logout: doLogout,
      hasProfile: () => pm.exists()
    };
  }

  /* ===== عرض شاشة الدخول ===== */
  function showLoginScreen() {
    const screen = $('authScreen');
    const content = $('authContent');
    if (!screen || !content) return;

    content.innerHTML = `
      <div class="auth-logo">CLASH OF<br>ARMORED</div>
      <div class="auth-tagline">SURVIVE • FIGHT • WIN</div>

      <div class="auth-card">
        <div class="auth-title">👤 تسجيل الدخول</div>

        <div class="auth-error" id="authError"></div>

        <div class="auth-input-group">
          <label>اسم المستخدم</label>
          <input type="text" class="auth-input" id="loginUsername"
                 placeholder="Commander" maxlength="20">
        </div>

        <button class="auth-btn auth-btn-primary" onclick="CoaAuth._doLogin()">
          ▶ متابعة
        </button>

        <div class="auth-divider">أو</div>

        <button class="auth-btn auth-btn-google" onclick="CoaAuth._doGoogle()">
          <span style="font-weight:900;color:#4285F4;font-size:18px;">G</span>
          <span>الدخول بحساب Google</span>
        </button>

        <div style="margin-top:12px;"></div>

        <button class="auth-btn auth-btn-guest" onclick="CoaAuth._doGuest()">
          🎮 الدخول كزائر
        </button>

        <div class="auth-switch">
          ليس لديك حساب؟
          <a onclick="CoaAuth.showRegister()">أنشئ حساباً</a>
        </div>
      </div>
    `;

    screen.classList.add('visible');
  }

  /* ===== عرض شاشة التسجيل ===== */
  function showRegisterScreen() {
    const screen = $('authScreen');
    const content = $('authContent');
    if (!screen || !content) return;

    const avatars = ['A','B','C','D','E','F','G','H','J','K','L','M'];

    content.innerHTML = `
      <div class="auth-logo">CLASH OF<br>ARMORED</div>
      <div class="auth-tagline">CREATE YOUR LEGEND</div>

      <div class="auth-card">
        <div class="auth-title">✚ حساب جديد</div>

        <div class="auth-error" id="authError"></div>

        <div class="auth-input-group">
          <label>اسم المستخدم</label>
          <input type="text" class="auth-input" id="regUsername"
                 placeholder="Commander" maxlength="20">
        </div>

        <div class="auth-input-group">
          <label>البريد الإلكتروني (اختياري)</label>
          <input type="email" class="auth-input" id="regEmail"
                 placeholder="you@email.com">
        </div>

        <div style="font-size:11px;color:#ffb347;letter-spacing:1px;margin-bottom:6px;padding-right:4px;">
          اختر صورة رمزية
        </div>
        <div class="avatar-picker" id="avatarPicker">
          ${avatars.map((a, i) => `
            <div class="avatar-option ${i === 2 ? 'selected' : ''}" data-avatar="${a}">${a}</div>
          `).join('')}
        </div>

        <button class="auth-btn auth-btn-primary" onclick="CoaAuth._doRegister()">
          ✚ إنشاء الحساب
        </button>

        <div class="auth-switch">
          لديك حساب بالفعل؟
          <a onclick="CoaAuth.showLogin()">تسجيل الدخول</a>
        </div>
      </div>
    `;

    screen.classList.add('visible');
    bindAvatarPicker();
  }

  function bindAvatarPicker() {
    const picker = $('avatarPicker');
    if (!picker) return;

    picker.querySelectorAll('.avatar-option').forEach(el => {
      el.onclick = () => {
        picker.querySelectorAll('.avatar-option').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        if (window.CoaAudio) window.CoaAudio.click();
      };
    });
  }

  /* ===== منطق التسجيل ===== */
  function doRegister() {
    const username = ($('regUsername') || {}).value || '';
    const email = ($('regEmail') || {}).value || '';
    const avatarEl = document.querySelector('.avatar-option.selected');
    const avatar = avatarEl ? avatarEl.getAttribute('data-avatar') : 'C';

    const err = $('authError');
    if (err) err.classList.remove('visible');

    const res = pm.create({ username, email, method: 'email', avatar });

    if (!res.ok) {
      if (err) {
        err.textContent = '⚠ ' + res.error;
        err.classList.add('visible');
      }
      if (window.CoaAudio) window.CoaAudio.error();
      return;
    }

    if (window.CoaAudio) window.CoaAudio.success();
    proceedToLobby(res.profile);
  }

  /* ===== منطق الدخول ===== */
  function doLogin() {
    if (!pm.exists()) {
      if (window.CoaAudio) window.CoaAudio.error();
      showRegisterScreen();
      return;
    }

    // إذا كتب المستخدم اسماً جديداً، نحدّث الاسم
    const nameEl = $('loginUsername');
    if (nameEl && nameEl.value.trim().length >= 2) {
      pm.update({ username: nameEl.value.trim() });
    }

    const res = pm.login();
    if (res.ok) {
      if (window.CoaAudio) window.CoaAudio.success();
      proceedToLobby(res.profile);
    }
  }

  /* ===== Google (وهمي محلياً) ===== */
  function doGoogle() {
    // لا يوجد backend، لذا نصنع بروفايل محلي باسم "Google User"
    if (pm.exists()) {
      const res = pm.login();
      if (res.ok) return proceedToLobby(res.profile);
    }
    const res = pm.create({
      username: 'GoogleUser' + Math.floor(Math.random() * 9000 + 1000),
      email: 'google@coa.local',
      method: 'google',
      avatar: 'G'
    });
    if (res.ok) {
      if (window.CoaAudio) window.CoaAudio.success();
      proceedToLobby(res.profile);
    }
  }

  /* ===== زائر ===== */
  function doGuest() {
    if (pm.exists()) {
      const res = pm.login();
      if (res.ok) return proceedToLobby(res.profile);
    }
    const res = pm.create({
      username: 'Guest' + Math.floor(Math.random() * 9000 + 1000),
      email: 'guest@coa.local',
      method: 'guest',
      avatar: '★'
    });
    if (res.ok) {
      if (window.CoaAudio) window.CoaAudio.success();
      proceedToLobby(res.profile);
    }
  }

  /* ===== الانتقال للوبي ===== */
  function proceedToLobby(profile) {
    const screen = $('authScreen');
    if (screen) screen.classList.remove('visible');

    // تشغيل شاشة اللوبي
    if (window.CoaApp && window.CoaApp.startLobby) {
      window.CoaApp.startLobby(profile);
    }
  }

  /* ===== تسجيل الخروج ===== */
  function doLogout() {
    pm.logout();
    const lobby = $('lobby');
    if (lobby) lobby.classList.remove('visible');
    showLoginScreen();
  }

  /* ===== إتاحة الدوال ===== */
  window.CoaAuth = window.CoaAuth || {};
  window.CoaAuth._doRegister = doRegister;
  window.CoaAuth._doLogin = doLogin;
  window.CoaAuth._doGoogle = doGoogle;
  window.CoaAuth._doGuest = doGuest;

  /* ===== التشغيل ===== */
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(init, 100);
  });

})();
