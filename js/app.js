// ============================================================
// Căn Hộ Vinhomes Ocean Park 1 — SPA
// ============================================================
import {
  initData, getRooms, getRoomById, addRoom, updateRoom, deleteRoom,
  getContactInfo, saveContactInfo, verifyAdmin,
  trackPageView, trackClick, getAnalyticsSummary
} from './data.js';

// ======================== UTILITIES ========================

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

function isExpired(room) {
  if (!room.moveInDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const moveIn = new Date(room.moveInDate);
  moveIn.setHours(0, 0, 0, 0);
  return moveIn < today;
}

function formatDate(dateStr) {
  if (!dateStr) return 'Có thể vào ở luôn';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Có thể vào ở luôn';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function showToast(msg, type = 'success') {
  let container = document.getElementById('toasts');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toasts';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  const iconMap = { success: 'check_circle', error: 'error', info: 'info' };
  toast.innerHTML = `<span class="material-symbols-rounded">${iconMap[type] || 'info'}</span><span class="toast__msg">${msg}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

function navigateTo(hash) {
  window.location.hash = hash;
}

function getRoomCategoryName(cat) {
  return cat === 'phongthu' ? 'Phòng thuê' : cat === 'duan' ? 'Dự Án' : cat || '';
}

function getRoomCategoryIcon(cat) {
  return cat === 'phongthu' ? 'real_estate_agent' : cat === 'duan' ? 'domain' : 'home';
}

function getRoomTypeName(type) {
  const map = {
    studio: 'Studio', '1pn': '1PN', '1pn1': '1PN+1',
    '2pn1wc': '2PN1WC', '2pn2wc': '2PN 2WC', '2pn1': '2PN+1', '3pn2wc': '3PN 2WC'
  };
  return map[type] || type || '';
}

function removeDiacritics(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// ======================== ROUTER ========================

function getRoute() {
  const hash = window.location.hash || '#/';
  const parts = hash.replace('#', '').split('/').filter(Boolean);

  if (parts.length === 0) return { page: 'home', params: {} };
  if (parts[0] === 'room' && parts[1]) return { page: 'detail', params: { id: parts[1] } };
  if (parts[0] === 'admin') return { page: 'admin', params: {} };
  return { page: 'home', params: {} };
}

function updateActiveNav(page) {
  document.querySelectorAll('.topbar__link').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href') || '';
    if (page === 'home' && (href === '#/' || href === '#')) {
      link.classList.add('active');
    } else if (page === 'admin' && href === '#/admin') {
      link.classList.add('active');
    }
  });
}

function handleRoute() {
  const { page, params } = getRoute();
  updateActiveNav(page);
  const app = document.getElementById('app');
  if (!app) return;

  switch (page) {
    case 'home':
      renderHome();
      break;
    case 'detail':
      renderDetail(params.id);
      break;
    case 'admin':
      if (isAdminAuthenticated()) {
        renderDashboard();
      } else {
        renderLogin();
      }
      break;
    default:
      renderHome();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ======================== ADMIN AUTH ========================

function isAdminAuthenticated() {
  return sessionStorage.getItem('adminAuth') === 'true';
}

function setAdminAuthenticated(val) {
  if (val) {
    sessionStorage.setItem('adminAuth', 'true');
  } else {
    sessionStorage.removeItem('adminAuth');
  }
}

function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth">
      <div class="auth__card">
        <a href="#/" class="auth__back"><span class="material-symbols-rounded">arrow_back</span> Về trang chủ</a>
        <div class="auth__icon">
          <span class="material-symbols-rounded">lock</span>
        </div>
        <h2 class="auth__title">Đăng nhập quản trị</h2>
        <p class="auth__subtitle">Nhập mật khẩu để truy cập trang quản trị</p>
        <div class="auth__error" id="auth-error">
          <span class="material-symbols-rounded">error</span>
          <span id="auth-error-msg">Mật khẩu không đúng</span>
        </div>
        <form id="login-form" autocomplete="off">
          <div class="field">
            <label class="field__label" for="admin-password">Mật khẩu</label>
            <div class="field__input-wrap">
              <span class="field__icon"><span class="material-symbols-rounded">key</span></span>
              <input class="field__input" type="password" id="admin-password" placeholder="Nhập mật khẩu..." required>
              <button type="button" class="field__toggle" id="toggle-password">
                <span class="material-symbols-rounded">visibility</span>
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn--primary btn--full">
            <span class="material-symbols-rounded">login</span> Đăng nhập
          </button>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById('login-form');
  const passwordInput = document.getElementById('admin-password');
  const toggleBtn = document.getElementById('toggle-password');
  const errorEl = document.getElementById('auth-error');

  toggleBtn.addEventListener('click', () => {
    const isPass = passwordInput.type === 'password';
    passwordInput.type = isPass ? 'text' : 'password';
    toggleBtn.querySelector('.material-symbols-rounded').textContent = isPass ? 'visibility_off' : 'visibility';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = passwordInput.value.trim();
    if (!password) return;

    const valid = await verifyAdmin('admin', password);
    if (valid) {
      setAdminAuthenticated(true);
      showToast('Đăng nhập thành công!', 'success');
      renderDashboard();
    } else {
      errorEl.classList.add('visible');
      const card = document.querySelector('.auth__card');
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 500);
      passwordInput.value = '';
      passwordInput.focus();
    }
  });

  passwordInput.focus();
}

// ======================== HOME PAGE ========================

// Building → Tower mapping
// BUILDING_TOWERS derived from TOWER_GROUPS (defined below, near admin form)
// Lazily populated on first use
let _buildingTowersCache = null;
function getBuildingTowers() {
  if (!_buildingTowersCache && typeof TOWER_GROUPS !== 'undefined') {
    _buildingTowersCache = {};
    TOWER_GROUPS.forEach(g => _buildingTowersCache[g.label] = g.codes);
  }
  return _buildingTowersCache || {};
}

let currentCategory = 'giatot';
let currentBuilding = 'all';
let currentTypeFilter = 'all';
let currentPriceSort = 'default';
let currentSearchQuery = '';

function renderHome() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="wrap">
      <div class="loader" id="home-loader">
        <div class="loader__spinner"></div>
        <p class="loader__text">Đang tải dữ liệu...</p>
      </div>
    </div>
  `;

  setTimeout(async () => {
    const rooms = await getRooms();
    const activeRooms = rooms.filter(r => !isExpired(r));
    const contact = await getContactInfo();

    app.innerHTML = `
      <div class="wrap">
        <div class="hero">
          <h1 class="hero__title">Quỹ Căn <span class="text-gradient">Vinhomes</span> Giá Tốt</h1>
          <p class="hero__subtitle">Mua bán, cho thuê và ký gửi căn hộ Vinhomes Ocean Park.<br>Cập nhật căn thật, giá thật, hỗ trợ xem nhà nhanh và tư vấn miễn phí.</p>
        </div>

        <div class="filter-panel">
          <div class="filter-panel__tabs" id="category-tabs">
            <button class="filter-tab active" data-category="giatot">Quỹ Căn Giá Tốt</button>
            <button class="filter-tab" data-category="chothue">Quỹ Căn Cho Thuê</button>
          </div>
          <div class="filter-panel__buildings" id="building-chips">
            <button class="chip chip--building active" data-building="all">Tất cả</button>
            <button class="chip chip--building" data-building="The Sapphire 1">Sapphire 1</button>
            <button class="chip chip--building" data-building="The Sapphire 2">Sapphire 2</button>
            <button class="chip chip--building" data-building="Masteri WaterFront">Masteri</button>
            <button class="chip chip--building" data-building="The Hawaii">Hawaii</button>
            <button class="chip chip--building" data-building="The Pavilion">Pavilion</button>
            <button class="chip chip--building" data-building="The Zenpark">Zenpark</button>
            <button class="chip chip--building" data-building="The Zurich">Zurich</button>
            <button class="chip chip--building" data-building="The Beverly">Beverly</button>
            <button class="chip chip--building" data-building="The Lakeside">Lakeside</button>
            <button class="chip chip--building" data-building="The Senique Hanoi">Senique</button>
            <button class="chip chip--building" data-building="The London">London</button>
            <button class="chip chip--building" data-building="The Paris">Paris</button>
            <select class="sort-select" id="sort-select">
              <option value="default">Sắp xếp giá</option>
              <option value="asc">Giá: Thấp → Cao</option>
              <option value="desc">Giá: Cao → Thấp</option>
            </select>
          </div>
          <div class="filter-panel__search-row">
            <div class="search-box" id="home-search-box">
              <span class="search-box__icon"><span class="material-symbols-rounded">search</span></span>
              <input class="search-box__input" type="text" id="search-input" placeholder="Tìm theo tên, địa chỉ...">
              <button class="search-box__clear hidden" id="search-clear">
                <span class="material-symbols-rounded">close</span>
              </button>
            </div>
            <div class="filter-panel__type-chips" id="room-type-chips">
              <button class="chip chip--type" data-roomtype="studio">Studio</button>
              <button class="chip chip--type" data-roomtype="1pn">1PN</button>
              <button class="chip chip--type" data-roomtype="1pn1">1PN+1</button>
              <button class="chip chip--type" data-roomtype="2pn1wc">2PN1WC</button>
              <button class="chip chip--type" data-roomtype="2pn2wc">2PN 2WC</button>
              <button class="chip chip--type" data-roomtype="2pn1">2PN+1</button>
              <button class="chip chip--type" data-roomtype="3pn2wc">3PN 2WC</button>
            </div>
          </div>
        </div>

        <div class="grid" id="room-grid">
          ${activeRooms.length > 0
            ? activeRooms.map((room, i) => renderCard(room, i)).join('')
            : `<div class="empty"><span class="empty__icon"><span class="material-symbols-rounded">search_off</span></span><p class="empty__text">Không có phòng nào</p></div>`
          }
        </div>

        <div class="cta-banner cta-banner--red">
          <span class="cta-banner__icon"><span class="material-symbols-rounded">support_agent</span></span>
          <p class="cta-banner__desc">Nếu bạn chưa tìm được phòng phù hợp với nhu cầu, liên hệ trực tiếp với <strong>Hoàng Văn Hiệp</strong> để tìm phòng nhé!</p>
          <a href="${contact.zalo || 'https://zalo.me/0123456789'}" target="_blank" class="cta-banner__btn-red">
            <span class="material-symbols-rounded">chat</span> Zalo: ${contact.phone || '0123456789'}
          </a>
        </div>
      </div>

    <!-- Floating contact widget -->
    <div class="floating-contact" id="floating-contact">
      <a href="tel:${contact.phone || '0123456789'}" class="floating-contact__btn floating-contact__btn--phone" title="Hỗ trợ trực tiếp">
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.02l-2.2 2.19z"/></svg>
      </a>
      <a href="${contact.zalo || 'https://zalo.me/0123456789'}" target="_blank" class="floating-contact__btn floating-contact__btn--zalo" title="Nhắn tin tư vấn">
        <svg viewBox="0 0 460.1 436.6" width="30" height="30"><path d="M82.6 380.9c-1.8-.8-3.1-1.7-1-3.5 1.3-1.2 2.4-2.6 3.5-3.9 13.5-17.3 20.3-37.3 21.6-59.1.4-6.2 0-12.5-1-18.7C83.1 278.4 68.9 256 60.1 231c-18-51.4-2.3-116.4 53-155.8C150.4 48.8 193.5 32 240.6 30.5c38.4-1.2 74.3 8.4 107.1 28.4 43.1 26.2 71.8 63.8 82.8 113.2 11.7 52.4.8 100.8-31.5 143.5-31.7 41.8-74.5 65.2-125.5 74.4-29.9 5.4-59.7 3.4-89-4.8-5.8-1.6-11.4-3.8-17.2-5.2-6.1-1.5-12-1-17.8 1.9-24.5 12.1-49.2 23.8-73.8 35.7-1.5.7-3.1 1.3-4.8 2 0-.3.1-.4.1-.5 3.7-12.5 7.5-25 11.2-37.5l.4-1.7z" fill="#fff"/><path d="M185 241c-2 0-3.9 0-5.9 0-11.5-.1-22.9-.1-34.4-.2-.8 0-1.5-.1-2.5-.2.3-.6.5-1 .7-1.5 11.2-19.9 22.5-39.9 33.7-59.8 3-5.3 6-10.6 8.9-15.9.5-.9.5-1.8-.2-2.7-.7-.8-1.5-1-2.6-1-14.2 0-28.4 0-42.6 0h-2.2c0-.7-.1-1.3-.1-1.8 0-5.4.1-10.8-.1-16.1-.1-1.9.6-2.4 2.4-2.3 8.2.1 16.4 0 24.6 0h34.3c0 .6.1 1.1.1 1.6 0 5.4-.1 10.7.1 16.1.1 2.1-.7 3.5-1.7 5.2-13.9 24.5-27.8 49-41.7 73.6-.5.8-.9 1.7-1.3 2.5.1.1.2.2.4.3 3.2 0 6.5 0 9.7 0 6.9 0 13.8 0 20.7 0 .5 0 1.3.1 1.4.3.3.6.3 1.3.3 2v.2c0 6.3 0 12.6 0 18.9-.1-.3-.1-.6-.1-.9v-1.2c0-5.4 0-10.8 0-16.3.1-.3-.1-.7-.1-.9zM233.9 179.9c0-13.3 0-26.6 0-39.9 0-1.7.4-2.2 2.2-2.2 5.8.1 11.7.1 17.5 0 1.7 0 2.2.5 2.2 2.2 0 26.6-.1 53.2 0 79.8 0 1.8-.6 2.3-2.3 2.2-5.8-.1-11.5-.1-17.3 0-1.9 0-2.3-.6-2.3-2.4.1-13.3 0-26.5 0-39.8zM364.3 181.7c-.1 1.4-.2 2.9-.4 4.3-2.3 16.5-11.2 28.5-26.4 35.2-21.1 9.3-46.2.1-55.5-20.5-7.6-16.9-5.1-33.1 7.4-47.1 9.3-10.4 21.3-14.6 35-13.5 15.6 1.3 26.7 9.5 33.5 23.4 3.3 6.8 5.3 14 5.8 21.5.3 0 .5-1.6.6-3.3zM320.4 200.8c12.4.1 21-9.6 21.1-21.2.1-11.3-8.9-21-20.7-21.1-12-.1-21.3 9-21.4 21-.1 12.1 9.1 21.2 21 21.3zM210.2 204.8c-12.2-.1-22.3-7.2-25.5-18-5.1-17 7-34.3 24.4-35.2 14.5-.7 27 10.3 27.6 24.4.8 16.1-11.1 28.8-26.5 28.8zM210.2 161.5c-9.5-.5-18.5 7.5-18.5 18.4-.1 11.1 7.6 18.5 18.5 18.5 10.7 0 18.3-7.5 18.4-18.1.1-10.2-7-18.3-18.4-18.8z" fill="#0068ff"/></svg>
      </a>
    </div>
    `;

    currentCategory = 'giatot';
    currentBuilding = 'all';
    currentTypeFilter = 'all';
    currentPriceSort = 'default';
    currentSearchQuery = '';
    bindHomeEvents();
    applyFilters();

    // Welcome popup — show once per session
    if (!sessionStorage.getItem('welcomeShown')) {
      sessionStorage.setItem('welcomeShown', '1');
      const overlay = document.createElement('div');
      overlay.className = 'welcome-overlay';
      overlay.innerHTML = `
        <div class="welcome-popup">
          <button class="welcome-popup__close" id="welcome-close">&times;</button>
          <div class="welcome-popup__emoji">👋</div>
          <h2 class="welcome-popup__title">Xin chào, chào mừng bạn đến với<br>Quỹ Căn Vinhomes Ocean Park 1</h2>
          <div class="welcome-popup__list">
            <p>🏡 <strong>Chuyên cập nhật:</strong></p>
            <p>✅ Căn hộ cho thuê giá tốt</p>
            <p>✅ Căn hộ chuyển nhượng chính chủ</p>
            <p>✅ Quỹ căn ký gửi mới mỗi ngày</p>
            <p>✅ Hỗ trợ tìm căn theo ngân sách & nhu cầu</p>
          </div>
          <p class="welcome-popup__text"><strong>Không thấy căn phù hợp trên website?</strong></p>
          <p class="welcome-popup__text">📲 Nhắn Zalo ngay để nhận thêm nhiều quỹ căn chưa đăng công khai.</p>
          <p class="welcome-popup__thanks">Cam kết tư vấn nhanh - đúng nhu cầu - miễn phí ✨</p>
          <a href="${contact.zalo || 'https://zalo.me/0123456789'}" target="_blank" class="welcome-popup__btn">
            <span class="material-symbols-rounded">chat</span> Nhắn Zalo Hiệp
          </a>
          <div class="welcome-popup__progress"><div class="welcome-popup__progress-bar"></div></div>
        </div>
      `;
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('show'));

      const closeWelcome = () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 350);
      };
      document.getElementById('welcome-close').addEventListener('click', closeWelcome);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeWelcome(); });
      setTimeout(closeWelcome, 10000);
    }
  }, 300);
}

// ======================== FILTERS ========================

function applyFilters() {
  const grid = document.getElementById('room-grid');
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll('.card'));
  const searchNorm = removeDiacritics(currentSearchQuery);

  let visibleCards = [];

  cards.forEach(card => {
    const area = card.dataset.area || '';
    const type = card.dataset.type || '';
    const title = removeDiacritics(card.querySelector('.card__title')?.textContent || '');
    const address = removeDiacritics(card.dataset.address || '');

    let show = true;

    // Category filter: phongthu → chothue tab, duan → giatot tab
    const cardCategory = card.dataset.category || '';
    if (currentCategory === 'chothue' && cardCategory !== 'phongthu') show = false;
    if (currentCategory === 'giatot' && cardCategory !== 'duan') show = false;

    // Building filter - check if room's area is in the selected building's towers
    if (currentBuilding !== 'all') {
      const towers = getBuildingTowers()[currentBuilding] || [];
      if (!towers.includes(area)) show = false;
    }

    // Room type filter
    if (currentTypeFilter !== 'all') {
      const cardRoomType = card.dataset.roomtype || '';
      if (cardRoomType !== currentTypeFilter) show = false;
    }

    if (searchNorm && !title.includes(searchNorm) && !address.includes(searchNorm)) show = false;

    if (show) {
      card.classList.remove('hidden');
      visibleCards.push(card);
    } else {
      card.classList.add('hidden');
    }
  });

  // Sort
  if (currentPriceSort !== 'default') {
    visibleCards.sort((a, b) => {
      const pa = parseFloat(a.dataset.price) || 0;
      const pb = parseFloat(b.dataset.price) || 0;
      return currentPriceSort === 'asc' ? pa - pb : pb - pa;
    });
    visibleCards.forEach(card => grid.appendChild(card));
    // Also append hidden cards at the end
    cards.filter(c => c.classList.contains('hidden')).forEach(c => grid.appendChild(c));
  }

  // Show empty state if needed
  let emptyEl = grid.querySelector('.empty');
  if (visibleCards.length === 0) {
    if (!emptyEl) {
      emptyEl = document.createElement('div');
      emptyEl.className = 'empty';
      emptyEl.innerHTML = `<span class="empty__icon"><span class="material-symbols-rounded">search_off</span></span><p class="empty__text">Không tìm thấy phòng phù hợp</p>`;
      grid.appendChild(emptyEl);
    }
    emptyEl.classList.remove('hidden');
  } else if (emptyEl) {
    emptyEl.classList.add('hidden');
  }

  // Update price labels based on category
  const isRental = currentCategory === 'chothue';
  cards.forEach(card => {
    const priceEl = card.querySelector('.card__price');
    if (priceEl) {
      const priceVal = parseFloat(card.dataset.price) || 0;
      priceEl.innerHTML = isRental
        ? `${formatPrice(priceVal)} <small>/tháng</small>`
        : `${formatPrice(priceVal)}`;
    }
  });
}

function bindHomeEvents() {
  // Track floating contact clicks
  const phoneBtn = document.querySelector('.floating-contact__btn--phone');
  const zaloBtn = document.querySelector('.floating-contact__btn--zalo');
  if (phoneBtn) phoneBtn.addEventListener('click', () => trackClick('phone'));
  if (zaloBtn) zaloBtn.addEventListener('click', () => trackClick('zalo'));

  // Category tabs (Quỹ Căn Giá Tốt / Quỹ Căn Cho Thuê)
  const categoryTabs = document.querySelectorAll('#category-tabs .filter-tab');
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      categoryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.category;
      // Reset building filter
      currentBuilding = 'all';
      const buildingChips = document.querySelectorAll('#building-chips .chip');
      buildingChips.forEach(c => c.classList.remove('active'));
      buildingChips[0]?.classList.add('active');
      // Show search box when reset to "all"
      const searchBox = document.getElementById('home-search-box');
      if (searchBox) searchBox.style.display = '';
      applyFilters();
    });
  });

  // Building chips
  const buildingChips = document.querySelectorAll('#building-chips .chip');
  buildingChips.forEach(chip => {
    chip.addEventListener('click', () => {
      buildingChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentBuilding = chip.dataset.building;
      // Show/hide only the search box, type chips stay visible
      const searchBox = document.getElementById('home-search-box');
      if (searchBox) {
        searchBox.style.display = currentBuilding === 'all' ? '' : 'none';
      }
      applyFilters();
    });
  });



  // Room type chips (toggle: click active again = show all)
  const typeChips = document.querySelectorAll('#room-type-chips .chip');
  typeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const wasActive = chip.classList.contains('active');
      typeChips.forEach(c => c.classList.remove('active'));
      if (wasActive) {
        currentTypeFilter = 'all';
      } else {
        chip.classList.add('active');
        currentTypeFilter = chip.dataset.roomtype;
      }
      applyFilters();
    });
  });

  // Search
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentSearchQuery = searchInput.value;
      if (searchClear) {
        searchClear.classList.toggle('hidden', !currentSearchQuery);
      }
      applyFilters();
    });
  }
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      currentSearchQuery = '';
      searchClear.classList.add('hidden');
      applyFilters();
    });
  }

  // Sort
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentPriceSort = sortSelect.value;
      applyFilters();
    });
  }

  // Card clicks
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const roomId = card.dataset.roomId;
      if (roomId) {
        trackClick(roomId);
        navigateTo(`#/room/${roomId}`);
      }
    });
  });
}

// ======================== ROOM CARD ========================

function detectRoomType(room) {
  // Use saved roomType if available
  if (room.roomType) return room.roomType;
  // Fallback: detect from title
  const t = (room.title || '').toLowerCase();
  if (t.includes('3n2wc') || t.includes('3 ngủ') || t.includes('3pn')) return '3n2wc';
  if (t.includes('2n1wc') || t.includes('2 ngủ') || t.includes('2pn')) return '2n1wc';
  if (t.includes('1n+') || t.includes('1 ngủ') || t.includes('1pn') || t.includes('1n ')) return '1n+';
  if (t.includes('studio')) return 'studio';
  return '';
}

function renderCard(room, index) {
  const hasImages = room.images && room.images.length > 0;
  const imgSrc = hasImages ? room.images[0] : '';
  const roomType = detectRoomType(room);
  const isRental = (room.roomCategory === 'phongthu') || (currentCategory === 'chothue');

  return `
    <div class="card animate-in" data-room-id="${room.id}" data-area="${room.area || ''}" data-price="${room.price || 0}" data-address="${room.address || ''}" data-roomtype="${roomType}" data-category="${room.roomCategory || ''}" style="animation-delay:${index * 0.06}s">
      <div class="card__img">
        ${hasImages
          ? `<img src="${imgSrc}" loading="lazy" alt="${room.title || 'Căn hộ'}">`
          : `<div class="card__placeholder"><span class="material-symbols-rounded">apartment</span></div>`
        }
      </div>
      <div class="card__body">
        <h3 class="card__title">${room.title || 'Chưa có tiêu đề'}</h3>
        <div class="card__price">${formatPrice(room.price || 0)}${isRental ? ' <small>/tháng</small>' : ''}</div>
        <div class="card__meta"><span class="material-symbols-rounded">location_on</span> ${room.area ? (room.area + (getTowerBuilding(room.area) ? ' - ' + getTowerBuilding(room.area) : '')) : 'N/A'}</div>
      </div>
    </div>
  `;
}

// ======================== DETAIL PAGE ========================

function renderDetail(id) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="wrap">
      <div class="loader" id="detail-loader">
        <div class="loader__spinner"></div>
        <p class="loader__text">Đang tải thông tin phòng...</p>
      </div>
    </div>
  `;

  setTimeout(async () => {
    const room = await getRoomById(id);
    if (!room) {
      app.innerHTML = `
        <div class="wrap">
          <div class="not-found">
            <span class="not-found__icon"><span class="material-symbols-rounded">sentiment_dissatisfied</span></span>
            <h2 class="not-found__title">Không tìm thấy phòng</h2>
            <p class="not-found__text">Phòng này có thể đã bị xóa hoặc không tồn tại.</p>
            <a href="#/" class="btn btn--primary">Về trang chủ</a>
          </div>
        </div>
      `;
      return;
    }

    trackPageView(id);
    const contact = await getContactInfo();
    const hasImages = room.images && room.images.length > 0;
    const images = hasImages ? room.images : [];
    const catName = getRoomCategoryName(room.roomCategory);
    const catIcon = getRoomCategoryIcon(room.roomCategory);

    // Determine video embed
    let videoHTML = '';
    if (room.videoUrl) {
      const ytMatch = room.videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (ytMatch) {
        videoHTML = `
          <div class="detail__section">
            <h3 class="detail__section-title"><span class="material-symbols-rounded">videocam</span> Video</h3>
            <div class="detail__video">
              <iframe src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
            </div>
          </div>
        `;
      } else {
        videoHTML = `
          <div class="detail__section">
            <h3 class="detail__section-title"><span class="material-symbols-rounded">videocam</span> Video</h3>
            <div class="detail__video">
              <video controls src="${room.videoUrl}" preload="metadata"></video>
            </div>
          </div>
        `;
      }
    }

    let noteHTML = '';
    if (room.adminNote) {
      noteHTML = `
        <div class="detail__note">
          <span class="material-symbols-rounded">warning</span>
          <div>
            <strong>Ghi chú</strong>
            <p>${room.adminNote}</p>
          </div>
        </div>
      `;
    }

    app.innerHTML = `
      <div class="wrap">
        <div class="detail">
          <button class="detail__back" id="detail-back-btn">
            <span class="material-symbols-rounded">arrow_back</span> Quay lại
          </button>

          <div class="detail__top">
            <h1 class="detail__title">${room.title || 'Chưa có tiêu đề'}</h1>
            <div class="detail__badges">
              <span class="detail__badge"><span class="material-symbols-rounded">location_on</span> ${room.area || 'N/A'}</span>
              <span class="detail__badge"><span class="material-symbols-rounded">${catIcon}</span> ${catName}</span>
            </div>
          </div>

          ${hasImages ? `
            <div class="detail__gallery">
              <div class="detail__gallery-main" id="gallery-main">
                <img src="${images[0]}" alt="${room.title}" id="main-gallery-img">
                ${images.length > 1 ? `
                  <button class="detail__gallery-arrow detail__gallery-arrow--prev" id="gallery-prev">
                    <span class="material-symbols-rounded">chevron_left</span>
                  </button>
                  <button class="detail__gallery-arrow detail__gallery-arrow--next" id="gallery-next">
                    <span class="material-symbols-rounded">chevron_right</span>
                  </button>
                ` : ''}
              </div>
              ${images.length > 1 ? `
                <div class="detail__gallery-strip">
                  ${images.map((img, i) => `
                    <div class="detail__thumb${i === 0 ? ' active' : ''}" data-index="${i}">
                      <img src="${img}" alt="Ảnh ${i + 1}" loading="lazy">
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          ` : ''}

          <div class="detail__price-box">
            <div class="detail__price">${formatPrice(room.price || 0)} <small>/tháng</small></div>
          </div>

          <div class="detail__info">
            <div class="detail__info-item">
              <span class="detail__info-label"><span class="material-symbols-rounded">location_on</span> Khu vực</span>
              <span class="detail__info-value">${room.area || 'N/A'}</span>
            </div>
            <div class="detail__info-item">
              <span class="detail__info-label"><span class="material-symbols-rounded">${catIcon}</span> Loại phòng</span>
              <span class="detail__info-value">${catName}</span>
            </div>
            <div class="detail__info-item">
              <span class="detail__info-label"><span class="material-symbols-rounded">payments</span> Giá thuê</span>
              <span class="detail__info-value">${formatPrice(room.price || 0)}</span>
            </div>
            <div class="detail__info-item">
              <span class="detail__info-label"><span class="material-symbols-rounded">calendar_month</span> Ngày vào ở</span>
              <span class="detail__info-value">${formatDate(room.moveInDate)}</span>
            </div>
          </div>

          ${room.description ? `
            <div class="detail__section">
              <h3 class="detail__section-title"><span class="material-symbols-rounded">description</span> Mô tả</h3>
              <div class="detail__desc">${room.description}</div>
            </div>
          ` : ''}

          ${videoHTML}
          ${noteHTML}

          <div class="detail__contact">
            <h3 class="detail__section-title"><span class="material-symbols-rounded">contact_phone</span> Liên hệ</h3>
            <p>Liên hệ chủ trọ để biết thêm chi tiết và đặt lịch xem phòng.</p>
            <a href="${contact && contact.zaloLink ? contact.zaloLink : '#'}" target="_blank" class="btn btn--primary detail__contact-btn">
              <span class="material-symbols-rounded">chat</span> Nhắn Zalo ngay
            </a>
          </div>
        </div>
      </div>
    `;

    bindDetailEvents(images);
  }, 300);
}

let currentGalleryIndex = 0;

function bindDetailEvents(images) {
  // Back button
  const backBtn = document.getElementById('detail-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.history.back();
    });
  }

  if (!images || images.length === 0) return;
  currentGalleryIndex = 0;

  // Thumbnails
  const thumbs = document.querySelectorAll('.detail__thumb');
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const idx = parseInt(thumb.dataset.index, 10);
      setGalleryImage(images, idx);
    });
  });

  // Prev/Next
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newIdx = (currentGalleryIndex - 1 + images.length) % images.length;
      setGalleryImage(images, newIdx);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newIdx = (currentGalleryIndex + 1) % images.length;
      setGalleryImage(images, newIdx);
    });
  }

  // Click main image to open lightbox
  const mainImg = document.getElementById('main-gallery-img');
  if (mainImg) {
    mainImg.addEventListener('click', () => {
      openLightbox(images, currentGalleryIndex);
    });
    mainImg.style.cursor = 'zoom-in';
  }
}

function setGalleryImage(images, index) {
  currentGalleryIndex = index;
  const mainImg = document.getElementById('main-gallery-img');
  if (mainImg) mainImg.src = images[index];

  document.querySelectorAll('.detail__thumb').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === index);
  });
}

// ======================== LIGHTBOX ========================

let lbImages = [];
let lbIndex = 0;

function openLightbox(images, index) {
  lbImages = images;
  lbIndex = index;
  const lb = document.getElementById('lightbox');
  if (!lb) return;

  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
  updateLightbox();
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
  document.body.style.overflow = '';
}

function lbNav(dir) {
  if (lbImages.length === 0) return;
  lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length;
  updateLightbox();
}

function updateLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;

  const stage = lb.querySelector('.lb__stage');
  const dotsContainer = lb.querySelector('.lb__dots');
  if (stage) {
    stage.innerHTML = `<img src="${lbImages[lbIndex]}" alt="Ảnh ${lbIndex + 1}">`;
  }
  if (dotsContainer) {
    dotsContainer.innerHTML = lbImages.map((_, i) =>
      `<span class="lb__dot${i === lbIndex ? ' active' : ''}" data-lb-index="${i}"></span>`
    ).join('');

    dotsContainer.querySelectorAll('.lb__dot').forEach(dot => {
      dot.addEventListener('click', () => {
        lbIndex = parseInt(dot.dataset.lbIndex, 10);
        updateLightbox();
      });
    });
  }

  // Toggle arrows visibility
  const prevArrow = lb.querySelector('.lb__arrow--prev');
  const nextArrow = lb.querySelector('.lb__arrow--next');
  if (prevArrow) prevArrow.style.display = lbImages.length > 1 ? '' : 'none';
  if (nextArrow) nextArrow.style.display = lbImages.length > 1 ? '' : 'none';
}

// ======================== ADMIN DASHBOARD ========================

function renderDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="wrap">
      <div class="loader" id="admin-loader">
        <div class="loader__spinner"></div>
        <p class="loader__text">Đang tải dữ liệu quản trị...</p>
      </div>
    </div>
  `;

  setTimeout(async () => {
    const rooms = await getRooms();
    const contact = await getContactInfo();
    const activeRooms = rooms.filter(r => !isExpired(r));
    const expiredRooms = rooms.filter(r => isExpired(r));
    const phongthuRooms = rooms.filter(r => (r.roomCategory || r.roomType) === 'phongthu');
    const duanRooms = rooms.filter(r => (r.roomCategory || r.roomType) === 'duan');

    app.innerHTML = `
      <div class="wrap">
        <div class="admin">
          <div class="admin__top">
            <h1 class="admin__title"><span class="material-symbols-rounded">admin_panel_settings</span> Quản trị phòng</h1>
            <div class="admin__actions">
              <button class="btn btn--ghost" id="admin-logout-btn">
                <span class="material-symbols-rounded">logout</span> Đăng xuất
              </button>
            </div>
          </div>

          <!-- 4 Tab Navigation Cards -->
          <div class="admin-tabs">
            <button class="admin-tab" data-tab="add">
              <span class="admin-tab__icon"><span class="material-symbols-rounded">add_circle</span></span>
              <span class="admin-tab__label">Thêm phòng mới</span>
            </button>
            <button class="admin-tab active" data-tab="manage">
              <span class="admin-tab__icon"><span class="material-symbols-rounded">grid_view</span></span>
              <span class="admin-tab__label">Quản lý phòng</span>
              <span class="admin-tab__badge">${rooms.length}</span>
            </button>
            <button class="admin-tab" data-tab="search">
              <span class="admin-tab__icon"><span class="material-symbols-rounded">search</span></span>
              <span class="admin-tab__label">Tìm kiếm phòng</span>
            </button>
            <button class="admin-tab" data-tab="stats">
              <span class="admin-tab__icon"><span class="material-symbols-rounded">bar_chart</span></span>
              <span class="admin-tab__label">Thống kê</span>
            </button>
            <button class="admin-tab" data-tab="contact">
              <span class="admin-tab__icon"><span class="material-symbols-rounded">contact_phone</span></span>
              <span class="admin-tab__label">Liên hệ</span>
            </button>
          </div>

          <!-- Tab Content: Quản lý phòng (default) -->
          <div class="admin-panel" id="panel-manage">
            ${rooms.length > 0 ? `
            <div class="bulk-toolbar" id="bulk-toolbar">
              <label class="bulk-toolbar__check">
                <input type="checkbox" id="select-all-rooms">
                <span>Chọn tất cả</span>
              </label>
              <button class="btn btn--danger btn--sm" id="delete-selected-btn" disabled>
                <span class="material-symbols-rounded">delete_sweep</span> Xóa đã chọn (<span id="selected-count">0</span>)
              </button>
            </div>` : ''}
            <div class="room-list" id="admin-room-list">
              ${rooms.length > 0 ? rooms.map(room => renderRoomItem(room)).join('') : `
                <div class="empty">
                  <span class="empty__icon"><span class="material-symbols-rounded">inbox</span></span>
                  <p class="empty__text">Chưa có phòng nào</p>
                  <button class="btn btn--primary" id="empty-add-btn">
                    <span class="material-symbols-rounded">add</span> Thêm phòng mới
                  </button>
                </div>
              `}
            </div>
          </div>

          <!-- Tab Content: Tìm kiếm phòng -->
          <div class="admin-panel hidden" id="panel-search">
            <div class="admin-search-panel">
              <div class="search-box" style="max-width:100%">
                <span class="search-box__icon"><span class="material-symbols-rounded">search</span></span>
                <input class="search-box__input" type="text" id="admin-search-input" placeholder="Tìm theo tên phòng, tòa, địa chỉ...">
                <button class="search-box__clear hidden" id="admin-search-clear">
                  <span class="material-symbols-rounded">close</span>
                </button>
              </div>
              <p class="admin-search-hint" id="search-result-hint">Nhập từ khóa để tìm kiếm trong ${rooms.length} phòng</p>
              <div class="room-list" id="search-room-list">
                ${rooms.map(room => renderRoomItem(room)).join('')}
              </div>
            </div>
          </div>

          <!-- Tab Content: Thống kê -->
          <div class="admin-panel hidden" id="panel-stats">
            <!-- Time period tabs -->
            <div class="stats-period-tabs" id="stats-period-tabs">
              <button class="stats-period-tab" data-days="0">Hôm nay</button>
              <button class="stats-period-tab" data-days="7">7 ngày qua</button>
              <button class="stats-period-tab active" data-days="30">30 ngày qua</button>
            </div>

            <!-- Metric cards container -->
            <div class="stats" id="stats-cards">
              <div class="stat stat--highlight">
                <div class="stat__icon stat__icon--views"><span class="material-symbols-rounded">visibility</span></div>
                <div class="stat__number" id="stat-pageviews">0</div>
                <div class="stat__label">Lượt truy cập</div>
              </div>
              <div class="stat">
                <div class="stat__icon" style="background:linear-gradient(135deg,#0068ff,#0045b5);color:#fff"><span class="material-symbols-rounded">chat</span></div>
                <div class="stat__number" id="stat-zalo">0</div>
                <div class="stat__label">Click Zalo</div>
              </div>
              <div class="stat">
                <div class="stat__icon" style="background:linear-gradient(135deg,#25D366,#128C7E);color:#fff"><span class="material-symbols-rounded">call</span></div>
                <div class="stat__number" id="stat-phone">0</div>
                <div class="stat__label">Click gọi điện</div>
              </div>
              <div class="stat">
                <div class="stat__icon" style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff"><span class="material-symbols-rounded">home_work</span></div>
                <div class="stat__number" id="stat-roomviews">0</div>
                <div class="stat__label">Lượt xem phòng</div>
              </div>
            </div>

            <!-- Top rooms ranking -->
            <div class="stats-top-rooms" id="stats-top-rooms">
              <h3 class="stats-top-rooms__title"><span class="material-symbols-rounded">trending_up</span> Phòng được xem nhiều nhất — <span id="stats-period-label">30 ngày qua</span></h3>
              <div class="stats-top-rooms__list" id="stats-room-list">
                <p class="empty__text">Chưa có dữ liệu</p>
              </div>
            </div>

            <!-- Reload button -->
            <button class="btn btn--primary" id="stats-reload-btn" style="margin-top:20px">
              <span class="material-symbols-rounded">refresh</span> Tải lại thống kê
            </button>
          </div>

          </div>

          <!-- Tab Content: Liên hệ -->
          <div class="admin-panel hidden" id="panel-contact">
            <div class="contact-settings">
              <h3 class="contact-settings__title"><span class="material-symbols-rounded">contact_phone</span> Cài đặt thông tin liên hệ</h3>
              <p class="contact-settings__desc">Thông tin này sẽ hiển thị trên nút liên hệ của trang web.</p>
              <form id="contact-form" class="contact-settings__form">
                <div class="field">
                  <label class="field__label">Hỗ trợ trực tiếp (Số điện thoại) *</label>
                  <div class="field__input-wrap">
                    <span class="field__icon"><span class="material-symbols-rounded">call</span></span>
                    <input type="tel" class="field__input" id="contact-phone" value="${contact.phone || ''}" placeholder="VD: 0912345678" required>
                  </div>
                </div>
                <div class="field">
                  <label class="field__label">Nhắn tin tư vấn (Link Zalo) *</label>
                  <div class="field__input-wrap">
                    <span class="field__icon" style="color:#0068ff"><span class="material-symbols-rounded">chat</span></span>
                    <input type="url" class="field__input" id="contact-zalo" value="${contact.zalo || ''}" placeholder="VD: https://zalo.me/0912345678" required>
                  </div>
                </div>
                <div class="form-actions" style="margin-top:20px">
                  <button type="submit" class="btn btn--primary">
                    <span class="material-symbols-rounded">save</span> Lưu thông tin
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    `;

    bindDashboardEvents();
  }, 300);
}

function renderRoomItem(room) {
  const hasImages = room.images && room.images.length > 0;
  const expired = isExpired(room);
  const catLabel = getRoomCategoryName(room.roomCategory || room.roomType);

  return `
    <div class="room-item${expired ? ' room-item--expired' : ''}" data-id="${room.id}">
      <label class="room-item__checkbox">
        <input type="checkbox" class="room-select-cb" data-id="${room.id}">
      </label>
      <div class="room-item__thumb">
        ${hasImages
          ? `<img src="${room.images[0]}" alt="${room.title}" loading="lazy">`
          : `<span class="material-symbols-rounded">apartment</span>`
        }
      </div>
      <div class="room-item__info">
        <h3 class="room-item__title">${room.title || 'Chưa có tiêu đề'}${expired ? ' <span style="color:var(--clr-error);font-size:0.75rem;">(Hết hạn)</span>' : ''}</h3>
        <p class="room-item__meta">${room.area || 'N/A'} · ${catLabel} · ${room.address || 'N/A'}</p>
      </div>
      <div class="room-item__price">${formatPrice(room.price || 0)}</div>
      <div class="room-item__actions">
        <button class="btn btn--ghost btn--sm admin-edit-btn" data-id="${room.id}" title="Chỉnh sửa">
          <span class="material-symbols-rounded">edit</span>
        </button>
        <button class="btn btn--danger btn--sm admin-delete-btn" data-id="${room.id}" title="Xóa">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </div>
    </div>
  `;
}

function bindDashboardEvents() {
  // Logout
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      setAdminAuthenticated(false);
      showToast('Đã đăng xuất', 'info');
      navigateTo('#/');
    });
  }

  // Tab switching
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      // Handle "add" tab — go to form
      if (target === 'add') {
        renderRoomForm();
        return;
      }

      // Switch active tab
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Switch panels
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));
      const panel = document.getElementById(`panel-${target}`);
      if (panel) panel.classList.remove('hidden');

      // Focus search input when switching to search tab
      if (target === 'search') {
        const searchInput = document.getElementById('admin-search-input');
        if (searchInput) setTimeout(() => searchInput.focus(), 100);
      }
    });
  });

  // Empty state add button
  const emptyAddBtn = document.getElementById('empty-add-btn');
  if (emptyAddBtn) {
    emptyAddBtn.addEventListener('click', () => renderRoomForm());
  }

  // ---- Bulk select & delete ----
  const selectAllCb = document.getElementById('select-all-rooms');
  const deleteSelectedBtn = document.getElementById('delete-selected-btn');
  const selectedCountEl = document.getElementById('selected-count');
  const allCheckboxes = () => document.querySelectorAll('.room-select-cb');

  function updateSelectedCount() {
    const checked = document.querySelectorAll('.room-select-cb:checked');
    const count = checked.length;
    if (selectedCountEl) selectedCountEl.textContent = count;
    if (deleteSelectedBtn) deleteSelectedBtn.disabled = count === 0;
    if (selectAllCb) selectAllCb.checked = count > 0 && count === allCheckboxes().length;
  }

  if (selectAllCb) {
    selectAllCb.addEventListener('change', () => {
      allCheckboxes().forEach(cb => cb.checked = selectAllCb.checked);
      updateSelectedCount();
    });
  }

  allCheckboxes().forEach(cb => {
    cb.addEventListener('change', updateSelectedCount);
  });

  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener('click', async () => {
      const checked = document.querySelectorAll('.room-select-cb:checked');
      const ids = Array.from(checked).map(cb => cb.dataset.id);
      if (ids.length === 0) return;
      if (!confirm(`Bạn có chắc chắn muốn xóa ${ids.length} phòng đã chọn?`)) return;
      for (const id of ids) {
        await deleteRoom(id);
      }
      showToast(`🗑️ Đã xóa ${ids.length} phòng thành công`, 'success');
      renderDashboard();
    });
  }

  // Edit buttons (both manage and search panels)
  document.querySelectorAll('.admin-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      renderRoomForm(btn.dataset.id);
    });
  });

  // Delete buttons (both panels)
  document.querySelectorAll('.admin-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const roomId = btn.dataset.id;
      if (confirm('Bạn có chắc chắn muốn xóa phòng này?')) {
        await deleteRoom(roomId);
        showToast('Đã xóa phòng thành công', 'success');
        renderDashboard();
      }
    });
  });

  // Search functionality
  const searchInput = document.getElementById('admin-search-input');
  const searchClear = document.getElementById('admin-search-clear');
  const searchHint = document.getElementById('search-result-hint');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = removeDiacritics(searchInput.value.trim());
      let count = 0;
      document.querySelectorAll('#search-room-list .room-item').forEach(item => {
        const title = removeDiacritics(item.querySelector('.room-item__title')?.textContent || '');
        const meta = removeDiacritics(item.querySelector('.room-item__meta')?.textContent || '');
        if (!query || title.includes(query) || meta.includes(query)) {
          item.style.display = '';
          count++;
        } else {
          item.style.display = 'none';
        }
      });

      if (searchClear) searchClear.classList.toggle('hidden', !searchInput.value);
      if (searchHint) {
        searchHint.textContent = query ? `Tìm thấy ${count} phòng` : `Nhập từ khóa để tìm kiếm`;
      }
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      searchInput.focus();
    });
  }

  // Contact form save
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('contact-phone').value.trim();
      const zalo = document.getElementById('contact-zalo').value.trim();
      if (!phone || !zalo) {
        showToast('Vui lòng điền đầy đủ thông tin', 'error');
        return;
      }
      const contact = await getContactInfo();
      contact.phone = phone;
      contact.zalo = zalo;
      await saveContactInfo(contact);
      showToast('✅ Lưu thông tin liên hệ thành công!', 'success');
    });
  }

  // ---- Stats panel: load data by period ----
  let currentStatsDays = 30;

  async function loadStats(days) {
    currentStatsDays = days;
    const analytics = await getAnalyticsSummary(days);
    const rooms = await getRooms();
    const periodLabels = { 0: 'Hôm nay', 7: '7 ngày qua', 30: '30 ngày qua' };

    // Update numbers
    const pvEl = document.getElementById('stat-pageviews');
    const zEl = document.getElementById('stat-zalo');
    const phEl = document.getElementById('stat-phone');
    const rvEl = document.getElementById('stat-roomviews');
    if (pvEl) pvEl.textContent = analytics.totalViews;
    if (zEl) zEl.textContent = analytics.zaloClicks;
    if (phEl) phEl.textContent = analytics.phoneClicks;
    if (rvEl) rvEl.textContent = analytics.roomViews;

    // Period label
    const label = document.getElementById('stats-period-label');
    if (label) label.textContent = periodLabels[days] || '';

    // Top rooms list
    const listEl = document.getElementById('stats-room-list');
    if (listEl) {
      if (analytics.topRooms.length === 0) {
        listEl.innerHTML = '<p class="empty__text">Chưa có dữ liệu</p>';
      } else {
        listEl.innerHTML = analytics.topRooms.map((tr, i) => {
          const room = rooms.find(r => r.id === tr.roomId);
          const name = room ? room.title : `Phòng #${tr.roomId}`;
          return `
            <div class="stats-room-row">
              <span class="stats-room-row__rank">#${i + 1}</span>
              <span class="stats-room-row__name">${name}</span>
              <span class="stats-room-row__views">${tr.views} lượt xem</span>
            </div>`;
        }).join('');
      }
    }
  }

  // Period tab clicks
  document.querySelectorAll('#stats-period-tabs .stats-period-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#stats-period-tabs .stats-period-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadStats(Number(tab.dataset.days));
    });
  });

  // Reload button
  const reloadBtn = document.getElementById('stats-reload-btn');
  if (reloadBtn) reloadBtn.addEventListener('click', () => loadStats(currentStatsDays));

  // Auto-load stats when stats tab is clicked
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.dataset.tab === 'stats') loadStats(currentStatsDays);
    });
  });
}

// ======================== ADMIN FORM ========================

async function renderRoomForm(roomId) {
  const app = document.getElementById('app');
  const isEdit = !!roomId;

  if (isEdit) {
    app.innerHTML = `
      <div class="wrap">
        <div class="loader">
          <div class="loader__spinner"></div>
          <p class="loader__text">Đang tải dữ liệu phòng...</p>
        </div>
      </div>
    `;

    setTimeout(async () => {
      const room = await getRoomById(roomId);
      if (!room) {
        showToast('Không tìm thấy phòng', 'error');
        renderDashboard();
        return;
      }
      await renderFormUI(room);
    }, 200);
  } else {
    await renderFormUI(null);
  }
}

// All tower codes for auto-detect matching
const TOWER_GROUPS = [
  { label: 'The Sapphire 1', codes: ['S1.01','S1.02','S1.03','S1.04','S1.05','S1.06','S1.07','S1.08','S1.09','S1.10','S1.11','S1.12'] },
  { label: 'The Sapphire 2', codes: ['S2.01','S2.02','S2.03','S2.04','S2.05','S2.06','S2.07','S2.08','S2.09','S2.10','S2.11','S2.12','S2.14','S2.15','S2.16','S2.17','S2.18','S2.19'] },
  { label: 'Masteri WaterFront', codes: ['M1','M2','M3','H1','H2','H3'] },
  { label: 'The Hawaii', codes: ['HW1','HW2','HW3'] },
  { label: 'The Pavilion', codes: ['P1','P2','P3','P4'] },
  { label: 'The Zenpark', codes: ['R1.01','R1.02','R1.03','R1.05'] },
  { label: 'The Zurich', codes: ['ZR1','ZR2','ZR3'] },
  { label: 'The Beverly', codes: ['BE1','BE2','BE3','BE4'] },
  { label: 'The Lakeside', codes: ['LS1','LS2','LS3'] },
  { label: 'The Senique Hanoi', codes: ['The Senique I','The Senique II','The Senique III'] },
  { label: 'The London', codes: ['LD1','LD2','LD3'] },
  { label: 'The Paris', codes: ['PR1','PR2','PR3','PR5','PR6'] },
];

function getTowerBuilding(code) {
  for (const g of TOWER_GROUPS) {
    if (g.codes.includes(code)) return g.label;
  }
  return '';
}

function buildTowerOptions(selectedValue) {
  let html = '<option value="">-- Chọn tòa --</option>';
  for (const g of TOWER_GROUPS) {
    html += `<optgroup label="${g.label}">`;
    for (const code of g.codes) {
      const sel = selectedValue === code ? ' selected' : '';
      html += `<option value="${code}"${sel}>${code} - ${g.label}</option>`;
    }
    html += '</optgroup>';
  }
  return html;
}

// Normalize: remove dots, spaces, dashes → lowercase for matching
function normalizeTowerInput(str) {
  return str.replace(/[\s.\-_]/g, '').toLowerCase();
}

function detectTowerFromAddress(address) {
  if (!address) return null;
  const normalized = normalizeTowerInput(address);

  // Build match list: { code, normalized, length } sorted longest first
  const matchList = [];
  for (const g of TOWER_GROUPS) {
    for (const code of g.codes) {
      matchList.push({ code, norm: normalizeTowerInput(code), len: code.length });
    }
  }
  matchList.sort((a, b) => b.len - a.len);

  for (const item of matchList) {
    if (normalized.includes(item.norm)) return item.code;
  }
  return null;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function renderFormUI(room) {
  const app = document.getElementById('app');
  const isEdit = !!room;
  const title = isEdit ? 'Chỉnh sửa phòng' : 'Thêm phòng mới';
  const subtitle = isEdit ? `Đang chỉnh sửa: ${room.title || 'Phòng'}` : 'Điền thông tin để đăng phòng mới';

  const existingImages = isEdit && room.images ? room.images : [];
  const existingVideos = isEdit && room.videos ? room.videos : [];

  // Determine category
  const formCategory = isEdit ? (room.roomCategory || 'phongthu') : 'phongthu';
  const isPhongThu = formCategory === 'phongthu';

  // Auto-increment title for new rooms based on category
  let defaultTitle = '';
  if (!isEdit) {
    const rooms = await getRooms();
    const catLabel = formCategory === 'phongthu' ? 'Phòng thuê' : 'Dự Án';
    const count = rooms.filter(r => (r.roomCategory || '') === formCategory).length;
    defaultTitle = `${catLabel} ${count + 1}`;
  }

  const priceLabel = isPhongThu ? 'Giá Thuê (VND/Tháng)' : 'Giá Bán (VND)';
  const moveInDisplay = isPhongThu ? '' : ' style="display:none"';

  app.innerHTML = `
    <div class="wrap">
      <div class="form-page">
        <div class="form-card">
          <button type="button" class="btn btn--ghost" id="form-back-btn" style="margin-bottom:12px">
            <span class="material-symbols-rounded">arrow_back</span> Quay lại quản trị
          </button>
          <h2 class="form-card__title"><span class="material-symbols-rounded">${isEdit ? 'edit' : 'add_home'}</span> ${title}</h2>
          <p class="form-card__subtitle">${subtitle}</p>

          <form id="room-form" autocomplete="off">
            <!-- 1. Loại phòng & Tiêu đề -->
            <div class="form-row">
              <div class="field" style="flex:0 0 180px">
                <label class="field__label" for="room-category">Loại phòng</label>
                <div class="field__input-wrap">
                  <span class="field__icon"><span class="material-symbols-rounded">category</span></span>
                  <select class="field__select" id="room-category">
                    <option value="phongthu"${formCategory === 'phongthu' ? ' selected' : ''}>Phòng thuê</option>
                    <option value="duan"${formCategory === 'duan' ? ' selected' : ''}>Dự Án</option>
                  </select>
                </div>
              </div>
              <div class="field" style="flex:1">
                <label class="field__label" for="room-title">Tiêu đề *</label>
                <div class="field__input-wrap">
                  <span class="field__icon"><span class="material-symbols-rounded">title</span></span>
                  <input class="field__input" type="text" id="room-title" placeholder="Nhập tiêu đề phòng..." value="${isEdit ? (room.title || '') : defaultTitle}" required>
                </div>
              </div>
            </div>

            <!-- 1.5 Loại phòng (Studio, 2N1WC, ...) -->
            <div class="field">
              <label class="field__label" for="room-type-select">Loại căn hộ</label>
              <div class="field__input-wrap">
                <span class="field__icon"><span class="material-symbols-rounded">bedroom_parent</span></span>
                <select class="field__select" id="room-type-select">
                  <option value=""${!isEdit || !room.roomType ? ' selected' : ''}>-- Chọn loại --</option>
                  <option value="studio"${isEdit && room.roomType === 'studio' ? ' selected' : ''}>Studio</option>
                  <option value="1pn"${isEdit && room.roomType === '1pn' ? ' selected' : ''}>1PN</option>
                  <option value="1pn1"${isEdit && room.roomType === '1pn1' ? ' selected' : ''}>1PN+1</option>
                  <option value="2pn1wc"${isEdit && room.roomType === '2pn1wc' ? ' selected' : ''}>2PN1WC</option>
                  <option value="2pn2wc"${isEdit && room.roomType === '2pn2wc' ? ' selected' : ''}>2PN 2WC</option>
                  <option value="2pn1"${isEdit && room.roomType === '2pn1' ? ' selected' : ''}>2PN+1</option>
                  <option value="3pn2wc"${isEdit && room.roomType === '3pn2wc' ? ' selected' : ''}>3PN 2WC</option>
                </select>
              </div>
            </div>

            <!-- 2. Giá -->
            <div class="field">
              <label class="field__label" for="room-price" id="price-label">${priceLabel} *</label>
              <div class="field__input-wrap">
                <span class="field__icon"><span class="material-symbols-rounded">payments</span></span>
                <input class="field__input" type="number" id="room-price" placeholder="VD: 3000000" value="${isEdit ? (room.price || '') : ''}" required min="0">
              </div>
            </div>

            <!-- 3. Ngày có thể vào ở (only for phongthu) -->
            <div class="field" id="movein-field"${moveInDisplay}>
              <label class="field__label" for="room-movein">Ngày có thể vào ở</label>
              <div class="field__input-wrap">
                <span class="field__icon"><span class="material-symbols-rounded">calendar_month</span></span>
                <input class="field__input" type="date" id="room-movein" value="${isEdit ? (room.moveInDate || '') : ''}">
              </div>
              <p class="field__hint">Để trống = Có thể vào ở luôn</p>
            </div>

            <!-- 4. Địa chỉ -->
            <div class="field">
              <label class="field__label" for="room-address">Địa chỉ *</label>
              <div class="field__input-wrap">
                <span class="field__icon"><span class="material-symbols-rounded">location_on</span></span>
                <input class="field__input" type="text" id="room-address" placeholder="Nhập địa chỉ..." value="${isEdit ? (room.address || '') : ''}" required>
              </div>
            </div>

            <!-- 5. Khu vực -->
            <div class="field">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                <label class="field__label" for="room-area" style="margin-bottom:0">Khu vực</label>
                <label class="toggle-label" style="display:flex;align-items:center;gap:8px;cursor:pointer">
                  <span>Tự động quét</span>
                  <span class="toggle-switch">
                    <input type="checkbox" id="auto-detect-toggle" checked>
                    <span class="toggle-switch__slider"></span>
                  </span>
                </label>
              </div>
              <div class="field__input-wrap">
                <span class="field__icon"><span class="material-symbols-rounded">map</span></span>
                <select class="field__select" id="room-area">
                  ${buildTowerOptions(isEdit ? (room.area || '') : '')}
                </select>
              </div>
            </div>

            <!-- 6. Mô tả -->
            <div class="field">
              <label class="field__label" for="room-description">Mô tả</label>
              <textarea class="field__textarea" id="room-description" rows="5" placeholder="Mô tả chi tiết phòng...">${isEdit ? (room.description || '') : ''}</textarea>
            </div>

            <!-- 7. Ảnh phòng -->
            <div class="field">
              <label class="field__label">Ảnh phòng</label>
              <div class="upload-zone" id="upload-zone">
                <span class="upload-zone__icon"><span class="material-symbols-rounded">cloud_upload</span></span>
                <p class="upload-zone__text">Kéo thả hình ảnh vào đây</p>
                <p class="upload-zone__hint">hoặc nhấn để chọn file (JPG, PNG, WebP)</p>
                <input type="file" id="image-input" multiple accept="image/*" style="display:none">
              </div>
              <div class="previews" id="image-previews">
                ${existingImages.map((url, i) => `
                  <div class="preview" data-src="${url}" draggable="true" data-index="${i}">
                    <img src="${url}" alt="Ảnh ${i + 1}">
                    <button type="button" class="preview__remove" data-idx="${i}">
                      <span class="material-symbols-rounded">close</span>
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 8. Video phòng -->
            <div class="field">
              <label class="field__label">Video phòng</label>
              <div class="upload-zone" id="video-upload-zone">
                <span class="upload-zone__icon"><span class="material-symbols-rounded">videocam</span></span>
                <p class="upload-zone__text">Kéo thả video vào đây</p>
                <p class="upload-zone__hint">hoặc nhấn để chọn file (tối đa 50MB/video)</p>
                <input type="file" id="video-input" multiple accept="video/*" style="display:none">
              </div>
              <div class="video-list" id="video-previews">
                ${existingVideos.map((v, i) => `
                  <div class="video-item" data-idx="${i}">
                    <span class="material-symbols-rounded">movie</span>
                    <span class="video-item__name">Video ${i + 1}</span>
                    <button type="button" class="preview__remove video-remove-btn" data-idx="${i}">
                      <span class="material-symbols-rounded">close</span>
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 9. Buttons -->
            <div class="form-actions">
              <button type="button" class="btn btn--ghost" id="form-cancel-btn">
                <span class="material-symbols-rounded">close</span> Hủy
              </button>
              <button type="submit" class="btn btn--primary" id="form-save-btn">
                <span class="material-symbols-rounded">save</span> ${isEdit ? 'Cập nhật' : 'Thêm phòng'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  bindFormEvents(room);
}

function bindFormEvents(existingRoom) {
  const isEdit = !!existingRoom;
  const form = document.getElementById('room-form');
  const uploadZone = document.getElementById('upload-zone');
  const imageInput = document.getElementById('image-input');
  const previewsContainer = document.getElementById('image-previews');
  const videoUploadZone = document.getElementById('video-upload-zone');
  const videoInput = document.getElementById('video-input');
  const videoPreviewsContainer = document.getElementById('video-previews');
  const cancelBtn = document.getElementById('form-cancel-btn');
  const categorySelect = document.getElementById('room-category');
  const priceLabel = document.getElementById('price-label');
  const moveinField = document.getElementById('movein-field');
  const addressInput = document.getElementById('room-address');
  const areaSelect = document.getElementById('room-area');
  const autoDetectToggle = document.getElementById('auto-detect-toggle');
  const backBtn = document.getElementById('form-back-btn');

  // Back button → return to dashboard
  if (backBtn) backBtn.addEventListener('click', () => renderDashboard());
  if (cancelBtn) cancelBtn.addEventListener('click', () => renderDashboard());

  // Track images as array of data URLs or existing URLs
  let imageList = isEdit && existingRoom.images ? [...existingRoom.images] : [];
  // Track videos as array of { dataUrl, name, size }
  let videoList = isEdit && existingRoom.videos
    ? existingRoom.videos.map((v, i) => (typeof v === 'string' ? { dataUrl: v, name: `Video ${i + 1}`, size: 0 } : v))
    : [];

  // ---- Category change: update price label, move-in visibility & title ----
  if (categorySelect) {
    categorySelect.addEventListener('change', async () => {
      const cat = categorySelect.value;
      if (priceLabel) {
        priceLabel.textContent = cat === 'phongthu' ? 'Giá Thuê (VND/Tháng) *' : 'Giá Bán (VND) *';
      }
      if (moveinField) {
        moveinField.style.display = cat === 'phongthu' ? '' : 'none';
      }
      // Auto-update title for new rooms
      if (!isEdit) {
        const titleInput = document.getElementById('room-title');
        if (titleInput) {
          const rooms = await getRooms();
          const catLabel = cat === 'phongthu' ? 'Phòng thuê' : 'Dự Án';
          const count = rooms.filter(r => (r.roomCategory || '') === cat).length;
          titleInput.value = `${catLabel} ${count + 1}`;
        }
      }
    });
  }

  // ---- Auto-detect tower from address ----
  if (addressInput && areaSelect && autoDetectToggle) {
    addressInput.addEventListener('input', () => {
      if (!autoDetectToggle.checked) return;
      const detected = detectTowerFromAddress(addressInput.value);
      if (detected) {
        areaSelect.value = detected;
      }
    });
  }

  // ---- Cancel ----
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      if (isEdit || confirm('Bạn có chắc muốn hủy?')) {
        renderDashboard();
      }
    });
  }

  // ---- Image upload zone ----
  if (uploadZone) {
    uploadZone.addEventListener('click', () => imageInput.click());

    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      processImageFiles(files);
    });
  }

  if (imageInput) {
    imageInput.addEventListener('change', () => {
      const files = Array.from(imageInput.files);
      processImageFiles(files);
      imageInput.value = '';
    });
  }

  function processImageFiles(files) {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        imageList.push(e.target.result);
        refreshImagePreviews();
      };
      reader.readAsDataURL(file);
    });
  }

  function refreshImagePreviews() {
    previewsContainer.innerHTML = imageList.map((src, i) => `
      <div class="preview" data-src="${src.substring(0, 50)}" draggable="true" data-index="${i}">
        <img src="${src}" alt="Ảnh ${i + 1}">
        <button type="button" class="preview__remove" data-idx="${i}">
          <span class="material-symbols-rounded">close</span>
        </button>
      </div>
    `).join('');

    // Remove buttons
    previewsContainer.querySelectorAll('.preview__remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        imageList.splice(idx, 1);
        refreshImagePreviews();
      });
    });

    // Drag reorder
    let dragIdx = null;
    previewsContainer.querySelectorAll('.preview').forEach((preview, idx) => {
      preview.addEventListener('dragstart', () => {
        dragIdx = idx;
        preview.classList.add('dragging');
      });

      preview.addEventListener('dragend', () => {
        preview.classList.remove('dragging');
        dragIdx = null;
      });

      preview.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      preview.addEventListener('drop', (e) => {
        e.preventDefault();
        if (dragIdx !== null && dragIdx !== idx) {
          const item = imageList.splice(dragIdx, 1)[0];
          imageList.splice(idx, 0, item);
          refreshImagePreviews();
        }
      });
    });
  }

  // Bind remove buttons for existing images
  previewsContainer.querySelectorAll('.preview__remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx, 10);
      imageList.splice(idx, 1);
      refreshImagePreviews();
    });
  });

  // Drag reorder for initial images
  let imgDragIdx = null;
  previewsContainer.querySelectorAll('.preview').forEach((preview, idx) => {
    preview.addEventListener('dragstart', () => {
      imgDragIdx = idx;
      preview.classList.add('dragging');
    });
    preview.addEventListener('dragend', () => {
      preview.classList.remove('dragging');
      imgDragIdx = null;
    });
    preview.addEventListener('dragover', (e) => e.preventDefault());
    preview.addEventListener('drop', (e) => {
      e.preventDefault();
      if (imgDragIdx !== null && imgDragIdx !== idx) {
        const item = imageList.splice(imgDragIdx, 1)[0];
        imageList.splice(idx, 0, item);
        refreshImagePreviews();
      }
    });
  });

  // ---- Video upload zone ----
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

  if (videoUploadZone) {
    videoUploadZone.addEventListener('click', () => videoInput.click());

    videoUploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      videoUploadZone.classList.add('dragover');
    });

    videoUploadZone.addEventListener('dragleave', () => {
      videoUploadZone.classList.remove('dragover');
    });

    videoUploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      videoUploadZone.classList.remove('dragover');
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
      processVideoFiles(files);
    });
  }

  if (videoInput) {
    videoInput.addEventListener('change', () => {
      const files = Array.from(videoInput.files);
      processVideoFiles(files);
      videoInput.value = '';
    });
  }

  function processVideoFiles(files) {
    files.forEach(file => {
      if (file.size > MAX_VIDEO_SIZE) {
        showToast(`Video "${file.name}" vượt quá 50MB, bỏ qua.`, 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        videoList.push({ dataUrl: e.target.result, name: file.name, size: file.size });
        refreshVideoPreviews();
      };
      reader.readAsDataURL(file);
    });
  }

  function refreshVideoPreviews() {
    videoPreviewsContainer.innerHTML = videoList.map((v, i) => `
      <div class="video-item" data-idx="${i}">
        <span class="material-symbols-rounded">movie</span>
        <span class="video-item__name">${v.name || 'Video ' + (i + 1)}</span>
        <span class="video-item__size">${v.size ? formatFileSize(v.size) : ''}</span>
        <button type="button" class="preview__remove video-remove-btn" data-idx="${i}">
          <span class="material-symbols-rounded">close</span>
        </button>
      </div>
    `).join('');

    videoPreviewsContainer.querySelectorAll('.video-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        videoList.splice(idx, 1);
        refreshVideoPreviews();
      });
    });
  }

  // Bind remove buttons for existing videos
  videoPreviewsContainer.querySelectorAll('.video-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx, 10);
      videoList.splice(idx, 1);
      refreshVideoPreviews();
    });
  });

  // ---- Form submit ----
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const titleVal = document.getElementById('room-title').value.trim();
      const price = parseFloat(document.getElementById('room-price').value) || 0;
      const address = document.getElementById('room-address').value.trim();
      const area = document.getElementById('room-area').value;
      const roomCategory = document.getElementById('room-category').value;
      const roomType = document.getElementById('room-type-select').value;
      const description = document.getElementById('room-description').value.trim();
      const moveInDate = document.getElementById('room-movein').value;

      if (!titleVal || !price || !address) {
        showToast('Vui lòng điền đầy đủ các trường bắt buộc', 'error');
        return;
      }

      const roomData = {
        title: titleVal,
        price,
        address,
        area,
        roomCategory,
        roomType,
        description,
        moveInDate: roomCategory === 'phongthu' ? moveInDate : '',
        images: imageList,
        videos: videoList.map(v => v.dataUrl),
        createdAt: isEdit ? (existingRoom.createdAt || new Date().toISOString()) : new Date().toISOString()
      };

      try {
        if (isEdit) {
          await updateRoom(existingRoom.id, roomData);
          showToast('Cập nhật phòng thành công!', 'success');
        } else {
          await addRoom(roomData);
          showToast('🎉 Thêm phòng mới thành công!', 'success');
        }
        renderDashboard();
      } catch (err) {
        if (err.name === 'QuotaExceededError' || (err.message && err.message.includes('quota'))) {
          // Storage full - try saving without videos
          const retryWithoutVideo = confirm('Bộ nhớ trình duyệt đã đầy! Video quá lớn để lưu cục bộ.\n\nBạn có muốn lưu phòng KHÔNG kèm video?');
          if (retryWithoutVideo) {
            try {
              roomData.videos = [];
              if (isEdit) {
                await updateRoom(existingRoom.id, roomData);
                showToast('Cập nhật phòng thành công (không kèm video)!', 'success');
              } else {
                await addRoom(roomData);
                showToast('🎉 Thêm phòng thành công (không kèm video)!', 'success');
              }
              renderDashboard();
            } catch (err2) {
              showToast('Vẫn không đủ bộ nhớ. Hãy xóa bớt phòng cũ.', 'error');
            }
          }
        } else {
          showToast('Có lỗi xảy ra: ' + err.message, 'error');
        }
      }
    });
  }
}

// ======================== TOPBAR SCROLL ========================

function bindScrollEffect() {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      topbar.classList.add('scrolled');
    } else {
      topbar.classList.remove('scrolled');
    }
  }, { passive: true });
}

// ======================== MOBILE MENU ========================

function bindMobileMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const mainNav = document.getElementById('main-nav');
  const overlay = document.getElementById('mobile-overlay');

  function closeMenu() {
    if (hamburger) hamburger.classList.remove('open');
    if (mainNav) mainNav.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      if (mainNav) mainNav.classList.toggle('open');
      if (overlay) overlay.classList.toggle('open');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  // Close menu when nav links are clicked
  document.querySelectorAll('.topbar__link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

// ======================== LIGHTBOX BINDINGS ========================

function bindLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;

  // Close button
  const closeBtn = lb.querySelector('.lb__close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }

  // Arrows
  const prevArrow = lb.querySelector('.lb__arrow--prev');
  const nextArrow = lb.querySelector('.lb__arrow--next');
  if (prevArrow) {
    prevArrow.addEventListener('click', () => lbNav(-1));
  }
  if (nextArrow) {
    nextArrow.addEventListener('click', () => lbNav(1));
  }

  // Click overlay (outside image) to close
  const stage = lb.querySelector('.lb__stage');
  if (stage) {
    stage.addEventListener('click', (e) => {
      if (e.target === stage) closeLightbox();
    });
  }

  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    switch (e.key) {
      case 'ArrowLeft':
        lbNav(-1);
        break;
      case 'ArrowRight':
        lbNav(1);
        break;
      case 'Escape':
        closeLightbox();
        break;
    }
  });
}

// ======================== INIT ========================

document.addEventListener('DOMContentLoaded', async () => {
  await initData();
  handleRoute();
  bindScrollEffect();
  bindMobileMenu();
  bindLightbox();
});

window.addEventListener('hashchange', handleRoute);
