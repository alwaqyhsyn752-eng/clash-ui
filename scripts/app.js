/* ============================================
   Clash of Armored - App Bootstrap
   Splash → Auth → Lobby
   ============================================ */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);

  let currentProfile = null;

  /* ============================================
     1) SPLASH
     ============================================ */
  function runSplash() {
    const splash  = $('splash');
    const fill    = $('loadingFill');
    const percent = $('loadingPercent');
    const tip     = $('loadingTip');

    if (!splash) return afterSplash();

    const tips = [
      'جاري تجهيز المدرعة...',
      'تحميل الأسلحة...',
      'محاكاة المعركة...',
      'الاتصال بالخادم...',
      'جاهز للقتال!'
    ];

    let progress = 0;
    let tipIndex = 0;

    const tipInterval = setInterval(() => {
      tipIndex = (tipIndex + 1) % tips.length;
      if (tip) tip.textContent = tips[tipIndex];
    }, 900);

    const timer = setInterval(() => {
      progress += Math.random() * 8 + 3;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
        clearInterval(tipInterval);
        setTimeout(() => {
          splash.classList.add('hidden');
          afterSplash();
        }, 500);
      }
      fill.style.width = progress + '%';
      percent.textContent = Math.floor(progress) + '%';
    }, 100);
  }

  /* ============================================
     2) بعد الشاشة الافتتاحية
     ============================================ */
  function afterSplash() {
    // إذا كان هناك بروفايل محفوظ، انتقل مباشرة للوبي (تسجيل تلقائي)
    if (window.CoaAuth && window.CoaAuth.hasProfile()) {
      const profile = window.CoaAuth.getProfile();
      if (profile) {
        return startLobby(profile);
      }
    }
    // وإلا أظهر شاشة الدخول
    if (window.CoaAuth) {
      window.CoaAuth.showLogin();
    }
  }

  /* ============================================
     3) LOBBY
     ============================================ */
  function startLobby(profile) {
    currentProfile = profile;

    const lobby = $('lobby');
    if (!lobby) return;
    lobby.classList.add('visible');

    updatePlayerHUD(profile);
    spawnParticles();
    bindLobbyButtons();

    console.log('🎮 Lobby ready for', profile.username);
  }

  function updatePlayerHUD(p) {
    if (!p) return;

    const name = $('playerName');
    const lvl  = $('playerLevel');
    const xp   = $('playerXp');
    const gold = $('playerGold');
    const gems = $('playerGems');
    const av   = $('playerAvatar');

    if (name) name.textContent = p.username;
    if (lvl)  lvl.textContent  = p.level;
    if (xp)   xp.style.width   = ((p.xp / p.xpMax) * 100) + '%';
    if (gold) gold.textContent = p.gold.toLocaleString();
    if (gems) gems.textContent = p.gems;
    if (av)   av.textContent   = p.avatar || 'C';
  }

  /* ============================================
     4) PARTICLES
     ============================================ */
  function spawnParticles() {
    const box = $('particles');
    if (!box || box.dataset.active) return;
    box.dataset.active = '1';

    function create(kind) {
      const p = document.createElement('div');
      p.className = 'particle ' + kind;

      const size = kind === 'fire' ? 8 + Math.random() * 14 : 20 + Math.random() * 30;
      p.style.width  = size + 'px';
      p.style.height = size + 'px';
      p.style.left   = Math.random() * 100 + '%';
      p.style.setProperty('--drift', (Math.random() * 200 - 100) + 'px');

      const dur = kind === 'fire' ? 3 + Math.random() * 2.5 : 6 + Math.random() * 4;
      p.style.animationDuration = dur + 's';
      p.style.animationDelay    = (Math.random() * 4) + 's';

      box.appendChild(p);
      setTimeout(() => p.remove(), (dur + 4) * 1000);
    }

    for (let i = 0; i < 12; i++) create('fire');
    for (let i = 0; i < 6; i++)  create('smoke');

    setInterval(() => {
      create('fire');
      if (Math.random() > 0.5) create('smoke');
    }, 900);
  }

  /* ============================================
     5) BINDINGS
     ============================================ */
  function bindLobbyButtons() {
    const play = $('btnPlay');
    if (play) {
      play.onclick = () => {
        if (window.CoaAudio) window.CoaAudio.click();
        showToast('⚔ جاري تحميل المعركة...');
        setTimeout(() => {
          // TODO: الانتقال لغرفة الانتظار (المرحلة 2)
          window.location.href = 'game/index.html';
        }, 600);
      };
    }

    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.onclick = () => {
        const action = btn.getAttribute('data-action');
        if (window.CoaAudio) window.CoaAudio.click();
        handleAction(action);
      };
    });
  }

  function handleAction(action) {
    switch (action) {
      case 'settings':  openModal('الإعدادات', buildSettingsContent()); break;
      case 'shop':      openModal('المتجر', buildShopContent()); break;
      case 'daily':     claimDailyReward(); break;
      case 'maps':      openModal('الخرائط', buildMapsContent()); break;
      case 'achievements': openModal('الإنجازات', buildAchievementsContent()); break;
      case 'inventory': openModal('الحقيبة', buildInventoryContent()); break;
      case 'profile':   openModal('الملف الشخصي', buildProfileContent()); break;
      case 'logout':    confirmLogout(); break;
      default: showToast('🚧 قيد التطوير');
    }
  }

  /* ============================================
     6) PROFILE MODAL
     ============================================ */
  function buildProfileContent() {
    if (!currentProfile) return '<p>لا يوجد بروفايل</p>';
    const p = currentProfile;
    const winRate = p.matches > 0 ? Math.round((p.wins / p.matches) * 100) : 0;

    return `
      <div style="text-align:center;margin-bottom:18px;">
        <div style="width:80px;height:80px;border-radius:50%;margin:0 auto 10px;
                    background:linear-gradient(135deg,#ff7b00,#ffb347);
                    display:flex;align-items:center;justify-content:center;
                    font-size:32px;font-weight:900;color:#fff;
                    box-shadow:0 0 25px rgba(255,123,0,0.7);border:3px solid #fff;">
          ${p.avatar || 'C'}
        </div>
        <div style="font-size:18px;font-weight:900;color:#fff;">${p.username}</div>
        <div style="font-size:11px;color:#9a9a9a;margin-top:4px;">${p.email}</div>
      </div>

      <div class="modal-row"><span>🏆 المستوى</span><span style="color:#ffb347;">${p.level}</span></div>
      <div class="modal-row"><span>🎯 المباريات</span><span>${p.matches}</span></div>
      <div class="modal-row"><span>🥇 الانتصارات</span><span style="color:#7dff56;">${p.wins}</span></div>
      <div class="modal-row"><span>💀 القتلات</span><span style="color:#ff4444;">${p.kills}</span></div>
      <div class="modal-row"><span>📊 نسبة الفوز</span><span>${winRate}%</span></div>
      <div class="modal-row"><span>🪙 الذهب</span><span style="color:#ffd54f;">${p.gold}</span></div>
      <div class="modal-row"><span>💎 الجواهر</span><span style="color:#00e5ff;">${p.gems}</span></div>

      <button class="modal-close" style="background:linear-gradient(180deg,#dc2626,#991b1b);margin-top:16px;"
              onclick="window.CoaAuth.logout();closeModal();">
        🚪 تسجيل الخروج
      </button>
    `;
  }

  function confirmLogout() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
      window.CoaAuth.logout();
      closeModal();
    }
  }

  /* ============================================
     7) MODALS
     ============================================ */
  function openModal(title, html) {
    const overlay = $('modalOverlay');
    const ttl     = $('modalTitle');
    const body    = $('modalBody');
    if (!overlay || !ttl || !body) return;

    ttl.textContent = title;
    body.innerHTML  = html;
    overlay.classList.add('visible');

    const close = $('modalClose');
    if (close) close.onclick = closeModal;
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
  }

  function closeModal() {
    const overlay = $('modalOverlay');
    if (overlay) overlay.classList.remove('visible');
  }
  window.closeModal = closeModal;

  function buildSettingsContent() {
    return `
      <div class="modal-row"><span>🔊 مستوى الصوت</span>
        <input type="range" min="0" max="100" value="70" style="width:120px;"></div>
      <div class="modal-row"><span>🎮 الحساسية</span>
        <input type="range" min="1" max="10" value="5" style="width:120px;"></div>
      <div class="modal-row"><span>📳 الاهتزاز</span>
        <input type="checkbox" checked></div>
      <div class="modal-row"><span>🎵 الموسيقى</span>
        <input type="checkbox" checked></div>
    `;
  }

  function buildShopContent() {
    return `
      <div class="modal-row"><span>💎 100 جوهرة</span><span style="color:#ffd54f;">1000 🪙</span></div>
      <div class="modal-row"><span>🛡 ترقية المدرعة</span><span style="color:#ffd54f;">500 🪙</span></div>
      <div class="modal-row"><span>🔥 قذائف سريعة ×10</span><span style="color:#ffd54f;">250 🪙</span></div>
      <div class="modal-row"><span>⚡ مضاعف نقاط ×2</span><span style="color:#00e5ff;">10 💎</span></div>
    `;
  }

  function buildMapsContent() {
    return `
      <div class="modal-row"><span>🗺 ساحة التدريب</span><span style="color:#7dff56;">✓</span></div>
      <div class="modal-row"><span>🏭 مصنع مهجور</span><span style="color:#9a9a9a;">🔒</span></div>
      <div class="modal-row"><span>🏜 صحراء الجحيم</span><span style="color:#9a9a9a;">🔒</span></div>
      <div class="modal-row"><span>❄ أرض الجليد</span><span style="color:#9a9a9a;">🔒</span></div>
    `;
  }

  function buildAchievementsContent() {
    return `
      <div class="modal-row"><span>🎯 أول فوز</span><span style="color:#7dff56;">✓</span></div>
      <div class="modal-row"><span>💀 10 قتلات</span><span>3/10</span></div>
      <div class="modal-row"><span>🏆 50 قتلة</span><span>0/50</span></div>
      <div class="modal-row"><span>💯 دقة 90%</span><span>0/1</span></div>
    `;
  }

  function buildInventoryContent() {
    return `
      <div class="modal-row"><span>🔫 مدفع أساسي</span><span style="color:#00e5ff;">مفعّل</span></div>
      <div class="modal-row"><span>🛡 درع خفيف</span><span style="color:#00e5ff;">مفعّل</span></div>
      <div class="modal-row"><span>💥 قذيفة HE</span><span>×5</span></div>
      <div class="modal-row"><span>⚡ معزز سرعة</span><span>×2</span></div>
    `;
  }

  function claimDailyReward() {
    if (!currentProfile) return;
    if (window.COA && window.COA.profile) {
      window.COA.profile.addGold(200);
      window.COA.profile.addGems(5);
      currentProfile = window.COA.profile.get();
      updatePlayerHUD(currentProfile);
    }
    if (window.CoaAudio) window.CoaAudio.coin();
    showToast('🎁 استلمت 200 ذهب + 5 جواهر!');
    const badge = $('dailyBadge');
    if (badge) badge.style.display = 'none';
  }

  /* ============================================
     8) TOAST
     ============================================ */
  let toastTimer = null;
  function showToast(msg, duration = 2200) {
    const t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('visible'), duration);
  }
  window.showToast = showToast;

  /* ============================================
     9) BOOT
     ============================================ */
  window.addEventListener('DOMContentLoaded', () => {
    runSplash();
  });

  window.CoaApp = { startLobby, showToast };
})();
