/* ============================================
   Clash of Armored - App Bootstrap (Splash + Lobby)
   ============================================ */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  /* ===== بيانات اللاعب (مؤقتة حتى نربط Cache) ===== */
  const player = {
    name: 'Commander',
    level: 1,
    xp: 35,      // %
    gold: 1500,
    gems: 25
  };

  /* ============================================
     1) SPLASH SCREEN LOGIC
     ============================================ */
  function runSplash() {
    const splash  = $('splash');
    const fill    = $('loadingFill');
    const percent = $('loadingPercent');
    const tip     = $('loadingTip');

    if (!splash) return startLobby();

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
      progress += Math.random() * 7 + 2;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
        clearInterval(tipInterval);
        setTimeout(() => {
          splash.classList.add('hidden');
          startLobby();
        }, 500);
      }
      fill.style.width = progress + '%';
      percent.textContent = Math.floor(progress) + '%';
    }, 110);
  }

  /* ============================================
     2) LOBBY INIT
     ============================================ */
  function startLobby() {
    const lobby = $('lobby');
    if (!lobby) return;
    lobby.classList.add('visible');

    updatePlayerHUD();
    spawnParticles();
    bindLobbyButtons();
    loadUserVolume();

    console.log('🎮 Lobby ready');
  }

  function updatePlayerHUD() {
    const name = $('playerName');
    const lvl  = $('playerLevel');
    const xp   = $('playerXp');
    const gold = $('playerGold');
    const gems = $('playerGems');

    if (name) name.textContent = player.name;
    if (lvl)  lvl.textContent  = player.level;
    if (xp)   xp.style.width   = player.xp + '%';
    if (gold) gold.textContent = player.gold.toLocaleString();
    if (gems) gems.textContent = player.gems;
  }

  /* ============================================
     3) PARTICLES (Fire + Smoke)
     ============================================ */
  function spawnParticles() {
    const box = $('particles');
    if (!box) return;

    function createParticle(kind) {
      const p = document.createElement('div');
      p.className = 'particle ' + kind;

      const size = kind === 'fire'
        ? 8 + Math.random() * 14
        : 20 + Math.random() * 30;

      p.style.width  = size + 'px';
      p.style.height = size + 'px';
      p.style.left   = Math.random() * 100 + '%';
      p.style.setProperty('--drift', (Math.random() * 200 - 100) + 'px');

      const dur = kind === 'fire'
        ? 3 + Math.random() * 2.5
        : 6 + Math.random() * 4;

      p.style.animationDuration = dur + 's';
      p.style.animationDelay    = (Math.random() * 4) + 's';

      box.appendChild(p);

      // تنظيف بعد انتهاء الحركة
      setTimeout(() => p.remove(), (dur + 4) * 1000);
    }

    // جزيئات أولية
    for (let i = 0; i < 12; i++) createParticle('fire');
    for (let i = 0; i < 6; i++)  createParticle('smoke');

    // استمرار توليد الجزيئات
    setInterval(() => {
      createParticle('fire');
      if (Math.random() > 0.5) createParticle('smoke');
    }, 900);
  }

  /* ============================================
     4) BUTTON BINDINGS
     ============================================ */
  function bindLobbyButtons() {
    // زر ابدأ المعركة
    const play = $('btnPlay');
    if (play) {
      play.addEventListener('click', () => {
        window.CoaAudio && window.CoaAudio.click();
        showToast('⚔ جاري تحميل المعركة...');
        setTimeout(() => {
          window.location.href = 'game/index.html';
        }, 600);
      });
    }

    // الأزرار الثانوية
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        window.CoaAudio && window.CoaAudio.click();
        handleAction(action);
      });
    });
  }

  function handleAction(action) {
    switch (action) {
      case 'settings':   openModal('الإعدادات',    buildSettingsContent()); break;
      case 'shop':       openModal('المتجر',       buildShopContent());     break;
      case 'daily':      claimDailyReward();                                break;
      case 'maps':       openModal('الخرائط',      buildMapsContent());     break;
      case 'achievements': openModal('الإنجازات',  buildAchievementsContent()); break;
      case 'inventory':  openModal('الحقيبة',      buildInventoryContent()); break;
      default:
        showToast('🚧 قيد التطوير');
    }
  }

  function claimDailyReward() {
    player.gold += 200;
    player.gems += 5;
    updatePlayerHUD();
    window.CoaAudio && window.CoaAudio.coin();
    showToast('🎁 استلمت 200 ذهب + 5 جواهر!');
    const badge = $('dailyBadge');
    if (badge) badge.style.display = 'none';
  }

  /* ============================================
     5) MODAL SYSTEM
     ============================================ */
  function openModal(title, contentHTML) {
    const overlay = $('modalOverlay');
    const ttl     = $('modalTitle');
    const body    = $('modalBody');
    if (!overlay || !ttl || !body) return;

    ttl.textContent = title;
    body.innerHTML  = contentHTML;
    overlay.classList.add('visible');

    // زر الإغلاق
    const close = $('modalClose');
    if (close) close.onclick = closeModal;

    // إغلاق عند النقر على الخلفية
    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };
  }

  function closeModal() {
    const overlay = $('modalOverlay');
    if (overlay) overlay.classList.remove('visible');
  }
  window.closeModal = closeModal;

  /* ===== محتوى النوافذ ===== */
  function buildSettingsContent() {
    return `
      <div class="modal-row">
        <span>🔊 مستوى الصوت</span>
        <input type="range" id="modalVolume" min="0" max="100" value="60" style="width:120px;">
      </div>
      <div class="modal-row">
        <span>🎮 الحساسية</span>
        <input type="range" id="modalSensitivity" min="1" max="10" value="5" style="width:120px;">
      </div>
      <div class="modal-row">
        <span>📳 الاهتزاز</span>
        <input type="checkbox" id="modalVibration" checked>
      </div>
      <div class="modal-row">
        <span>🎵 الموسيقى</span>
        <input type="checkbox" id="modalMusic" checked>
      </div>
    `;
  }

  function buildShopContent() {
    return `
      <div class="modal-row"><span>💎 100 جوهرة</span><span style="color:#ffd54f;">1000 🪙</span></div>
      <div class="modal-row"><span>🛡 ترقية المدرعة</span><span style="color:#ffd54f;">500 🪙</span></div>
      <div class="modal-row"><span>🔥 قذائف سريعة ×10</span><span style="color:#ffd54f;">250 🪙</span></div>
      <div class="modal-row"><span>⚡ مضاعف نقاط ×2 (يوم)</span><span style="color:#00e5ff;">10 💎</span></div>
    `;
  }

  function buildMapsContent() {
    return `
      <div class="modal-row"><span>🗺 ساحة التدريب</span><span style="color:#7dff56;">✓ مفتوحة</span></div>
      <div class="modal-row"><span>🏭 مصنع مهجور</span><span style="color:#9a9a9a;">🔒 مغلقة</span></div>
      <div class="modal-row"><span>🏜 صحراء الجحيم</span><span style="color:#9a9a9a;">🔒 مغلقة</span></div>
      <div class="modal-row"><span>❄ أرض الجليد</span><span style="color:#9a9a9a;">🔒 مغلقة</span></div>
    `;
  }

  function buildAchievementsContent() {
    return `
      <div class="modal-row"><span>🎯 أول فوز</span><span style="color:#7dff56;">✓ مكتمل</span></div>
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

  /* ============================================
     6) TOAST
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
     7) LOAD USER VOLUME
     ============================================ */
  function loadUserVolume() {
    try {
      const raw = localStorage.getItem('coa_settings');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.volume !== undefined && window.CoaAudio) {
        window.CoaAudio.setVolume(s.volume / 100);
      }
      if (s.sound !== undefined && window.CoaAudio) {
        window.CoaAudio.setEnabled(s.sound);
      }
    } catch (e) { /* ignore */ }
  }

  /* ============================================
     8) BOOT
     ============================================ */
  window.addEventListener('DOMContentLoaded', () => {
    runSplash();
  });

})();
