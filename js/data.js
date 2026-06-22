// ============================================================================
// data.js — localStorage Data Layer for Nhà Trọ Website
// API mirrors Supabase so it can be swapped later with zero refactoring.
// All functions return Promises (async/await).
// ============================================================================

const STORAGE_KEYS = {
  rooms: 'nhatro_rooms',
  contact: 'nhatro_contact',
  analytics: 'nhatro_analytics',
};

const DEFAULT_ADMIN = { username: 'admin', password: 'admin123' };

const DEFAULT_CONTACT = {
  name: 'Chủ nhà',
  phone: '0123456789',
  zalo: '0123456789',
};

// ---------------------------------------------------------------------------
// Helper: read / write localStorage as JSON
// ---------------------------------------------------------------------------
function _read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function _write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// Sample Data — 10 realistic Vietnamese room listings
// ---------------------------------------------------------------------------
function _buildSampleRooms() {
  const now = new Date().toISOString();

  return [
    {
      id: 1,
      title: 'Studio 1PN ban công Đông Nam - S1.02',
      price: 6500000,
      address: 'Tòa S1.02, Vinhomes Ocean Park 1, Gia Lâm, Hà Nội',
      area: 'S1.02',
      roomType: 'studio',
      roomCategory: 'phongthu',
      description: `<ul>
  <li>Diện tích: 30m² — ban công hướng Đông Nam thoáng mát</li>
  <li>Nội thất đầy đủ: giường, tủ, bàn làm việc, điều hòa, nóng lạnh</li>
  <li>Bếp từ + tủ lạnh mini, máy giặt riêng</li>
  <li>View hồ, tầng 12 — ánh sáng tự nhiên cả ngày</li>
  <li>Free wifi, gửi xe miễn phí</li>
</ul>`,
      adminNote: 'Khách ưu tiên ở lâu dài, hợp đồng tối thiểu 6 tháng.',
      moveInDate: '2026-07-01',
      images: [
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      ],
      videos: [],
      createdAt: now,
    },
    {
      id: 2,
      title: 'Phòng trọ khép kín khu Hải Âu - S1.08',
      price: 2800000,
      address: 'Tòa S1.08, Vinhomes Ocean Park 1, Gia Lâm, Hà Nội',
      area: 'S1.08',
      roomType: 'phongtro',
      roomCategory: 'phongthu',
      description: `<ul>
  <li>Diện tích: 18m² — phòng khép kín, WC riêng</li>
  <li>Nội thất cơ bản: giường, quạt trần, nóng lạnh</li>
  <li>Chung chủ, an ninh tốt, giờ giấc tự do</li>
  <li>Gần trường học, siêu thị Vinmart</li>
  <li>Điện nước giá dân, internet 100k/tháng</li>
</ul>`,
      adminNote: '',
      moveInDate: '',
      images: [
        'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
        'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800',
      ],
      videos: [],
      createdAt: now,
    },
    {
      id: 3,
      title: 'Căn hộ 2PN full nội thất cao cấp - S2.05',
      price: 9500000,
      address: 'Tòa S2.05, Vinhomes Ocean Park 2 - The Empire, Văn Giang, Hưng Yên',
      area: 'S2.05',
      roomType: 'nhanguyencan',
      roomCategory: 'duan',
      description: `<ul>
  <li>Diện tích: 65m² — 2 phòng ngủ, 2 WC</li>
  <li>Full nội thất cao cấp: sofa, bàn ăn, tủ bếp, máy giặt, tủ lạnh</li>
  <li>2 điều hòa, 2 nóng lạnh, rèm cửa cao cấp</li>
  <li>View quảng trường, tầng 18</li>
  <li>Hầm để xe ô tô, an ninh 24/7</li>
</ul>`,
      adminNote: 'Căn góc, view đẹp nhất tòa. Có thể thương lượng giá nếu ở dài.',
      moveInDate: '2026-07-15',
      images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      ],
      videos: [],
      createdAt: now,
    },
    {
      id: 4,
      title: 'Studio ban công view hồ - S2.09',
      price: 5800000,
      address: 'Tòa S2.09, Vinhomes Ocean Park 2 - The Empire, Văn Giang, Hưng Yên',
      area: 'S2.09',
      roomType: 'studio',
      roomCategory: 'phongthu',
      description: `<ul>
  <li>Diện tích: 28m² — ban công rộng, view hồ trung tâm</li>
  <li>Nội thất mới 100%: giường 1m6, tủ quần áo, bàn trang điểm</li>
  <li>Bếp từ đôi, hút mùi, tủ lạnh, máy giặt</li>
  <li>Tầng 15, hướng Tây Bắc mát mẻ</li>
  <li>Gần hồ bơi, gym, công viên</li>
</ul>`,
      adminNote: 'Phù hợp cho 1-2 người. Không nuôi thú cưng.',
      moveInDate: '',
      images: [
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
        'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
      ],
      videos: [],
      createdAt: now,
    },
    {
      id: 5,
      title: 'Nhà nguyên căn 3PN khu biệt thự - BE2',
      price: 12000000,
      address: 'Tòa BE2, The Beverly, Vinhomes Ocean Park, Gia Lâm, Hà Nội',
      area: 'BE2',
      roomType: 'nhanguyencan',
      roomCategory: 'duan',
      description: `<ul>
  <li>Diện tích: 90m² — 3 phòng ngủ, 2 WC, phòng khách rộng</li>
  <li>Nội thất đầy đủ: sofa da, bàn ăn 6 ghế, tủ bếp trên dưới</li>
  <li>3 điều hòa, máy giặt, tủ lạnh side-by-side</li>
  <li>Sân vườn nhỏ, chỗ để xe ô tô riêng</li>
  <li>Khu biệt thự yên tĩnh, bảo vệ 24/7</li>
</ul>`,
      adminNote: 'Ưu tiên gia đình. Hợp đồng tối thiểu 1 năm.',
      moveInDate: '2026-08-01',
      images: [
        'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
      ],
      videos: [],
      createdAt: now,
    },
    {
      id: 6,
      title: 'Phòng trọ mini gần Vincom - S1.06',
      price: 2500000,
      address: 'Tòa S1.06, Vinhomes Ocean Park 1, Gia Lâm, Hà Nội',
      area: 'S1.06',
      roomType: 'phongtro',
      roomCategory: 'phongthu',
      description: `<ul>
  <li>Diện tích: 15m² — phòng gọn gàng, sạch sẽ</li>
  <li>Nội thất: giường đơn, quạt, nóng lạnh</li>
  <li>WC khép kín, cửa sổ thoáng</li>
  <li>Cách Vincom 200m, gần trạm bus</li>
  <li>Điện 3.500đ/kWh, nước 30k/người</li>
</ul>`,
      adminNote: 'Phòng nhỏ, phù hợp sinh viên hoặc 1 người đi làm.',
      moveInDate: '',
      images: [
        'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800',
        'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
      ],
      videos: [],
      createdAt: now,
    },
    {
      id: 7,
      title: 'Căn hộ du lịch view biển hồ - M2',
      price: 8000000,
      address: 'Tòa M2, Masteri WaterFront, Vinhomes Ocean Park, Gia Lâm, Hà Nội',
      area: 'M2',
      roomType: 'dulich',
      roomCategory: 'duan',
      description: `<ul>
  <li>Diện tích: 45m² — 1PN thiết kế resort phong cách nhiệt đới</li>
  <li>Full nội thất 5 sao: ga gối khách sạn, minibar</li>
  <li>Ban công rộng view biển hồ nước mặn</li>
  <li>Smart TV 55", loa Bluetooth, Netflix</li>
  <li>Cho thuê ngắn hạn từ 1 đêm, dài hạn giảm 20%</li>
</ul>`,
      adminNote: 'Căn du lịch, giá trên là giá tháng. Giá đêm 500k-800k tùy mùa.',
      moveInDate: '',
      images: [
        'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      ],
      videos: [],
      createdAt: now,
    },
    {
      id: 8,
      title: 'Studio áp mái Penthouse - S2.14',
      price: 7200000,
      address: 'Tòa S2.14, Vinhomes Ocean Park, Gia Lâm, Hà Nội',
      area: 'S2.14',
      roomType: 'studio',
      roomCategory: 'phongthu',
      description: `<ul>
  <li>Diện tích: 35m² — tầng áp mái, trần cao 3.2m</li>
  <li>Thiết kế loft hiện đại, cửa kính lớn</li>
  <li>Nội thất Bắc Âu: giường gỗ sồi, đèn trang trí</li>
  <li>Bếp chữ L đầy đủ thiết bị, quầy bar mini</li>
  <li>Sân thượng chung có thể BBQ</li>
</ul>`,
      adminNote: 'Căn đặc biệt, ít căn như này. Giữ cọc 2 tháng.',
      moveInDate: '2026-07-10',
      images: [
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      ],
      videos: [],
      createdAt: now,
    },
    {
      id: 9,
      title: 'Phòng trọ cao cấp có gác xép - LD1',
      price: 3500000,
      address: 'Tòa LD1, The London, Vinhomes Ocean Park, Gia Lâm, Hà Nội',
      area: 'LD1',
      roomType: 'phongtro',
      roomCategory: 'phongthu',
      description: `<ul>
  <li>Diện tích: 22m² + gác xép 8m² — không gian rộng rãi</li>
  <li>Nội thất: giường tầng gác, tủ quần áo, bàn học</li>
  <li>Điều hòa, nóng lạnh, WC riêng khép kín</li>
  <li>Khu dân cư yên tĩnh, gần công viên</li>
  <li>Wifi miễn phí, giặt là 20k/lần</li>
</ul>`,
      adminNote: '',
      moveInDate: '',
      images: [
        'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
        'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      ],
      videos: [],
      createdAt: now,
    },
    {
      id: 10,
      title: 'Căn hộ du lịch 2PN hồ bơi riêng - PR2',
      price: 11000000,
      address: 'Tòa PR2, The Paris, Vinhomes Ocean Park, Gia Lâm, Hà Nội',
      area: 'PR2',
      roomType: 'dulich',
      roomCategory: 'duan',
      description: `<ul>
  <li>Diện tích: 70m² — 2PN, 2WC, phòng khách rộng</li>
  <li>Nội thất resort 5 sao, bộ chăn ga gối Hàn Quốc</li>
  <li>Hồ bơi riêng tầng 1, sân vườn nhỏ</li>
  <li>Bếp đầy đủ, máy rửa bát, lò vi sóng</li>
  <li>Cho thuê theo đêm (1.2tr) hoặc theo tháng giảm 15%</li>
</ul>`,
      adminNote: 'Căn VIP nhất khu. Khách check-in sau 14h, check-out trước 12h.',
      moveInDate: '2026-06-25',
      images: [
        'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
      ],
      videos: [],
      createdAt: now,
    },
  ];
}

// ---------------------------------------------------------------------------
// initData — seed localStorage with sample data when empty
// ---------------------------------------------------------------------------
export async function initData() {
  // Only seed sample rooms if no room data exists at all
  const existingRooms = _read(STORAGE_KEYS.rooms);
  if (!existingRooms) {
    _write(STORAGE_KEYS.rooms, _buildSampleRooms());
  }
  if (!_read(STORAGE_KEYS.contact)) {
    _write(STORAGE_KEYS.contact, DEFAULT_CONTACT);
  }
  if (!_read(STORAGE_KEYS.analytics)) {
    _write(STORAGE_KEYS.analytics, { pageViews: [], clicks: [] });
  }
}

// ---------------------------------------------------------------------------
// Room CRUD
// ---------------------------------------------------------------------------
export async function getRooms() {
  const rooms = _read(STORAGE_KEYS.rooms);
  return rooms || [];
}

export async function getRoomById(id) {
  const rooms = await getRooms();
  return rooms.find((r) => r.id === Number(id)) || null;
}

export async function addRoom(roomData) {
  const rooms = await getRooms();
  const maxId = rooms.reduce((max, r) => Math.max(max, r.id), 0);
  const newRoom = {
    ...roomData,
    id: maxId + 1,
    createdAt: new Date().toISOString(),
  };
  rooms.push(newRoom);
  _write(STORAGE_KEYS.rooms, rooms);
  return newRoom;
}

export async function updateRoom(id, roomData) {
  const rooms = await getRooms();
  const index = rooms.findIndex((r) => r.id === Number(id));
  if (index === -1) throw new Error(`Room with id ${id} not found`);

  const updatedRoom = { ...rooms[index], ...roomData, id: Number(id) };
  rooms[index] = updatedRoom;
  _write(STORAGE_KEYS.rooms, rooms);
  return updatedRoom;
}

export async function deleteRoom(id) {
  let rooms = await getRooms();
  rooms = rooms.filter((r) => r.id !== Number(id));
  _write(STORAGE_KEYS.rooms, rooms);
}

// ---------------------------------------------------------------------------
// Contact Info
// ---------------------------------------------------------------------------
export async function getContactInfo() {
  return _read(STORAGE_KEYS.contact) || DEFAULT_CONTACT;
}

export async function saveContactInfo(info) {
  _write(STORAGE_KEYS.contact, info);
}

// ---------------------------------------------------------------------------
// Admin Authentication
// ---------------------------------------------------------------------------
export async function verifyAdmin(username, password) {
  return username === DEFAULT_ADMIN.username && password === DEFAULT_ADMIN.password;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
export async function trackPageView(page, roomId = null) {
  const analytics = _read(STORAGE_KEYS.analytics) || { pageViews: [], clicks: [] };
  analytics.pageViews.push({
    page,
    roomId: roomId ? Number(roomId) : null,
    timestamp: new Date().toISOString(),
  });
  // Keep only the last 10 000 entries to avoid bloating localStorage
  if (analytics.pageViews.length > 10000) {
    analytics.pageViews = analytics.pageViews.slice(-10000);
  }
  _write(STORAGE_KEYS.analytics, analytics);
}

export async function trackClick(type) {
  const analytics = _read(STORAGE_KEYS.analytics) || { pageViews: [], clicks: [] };
  analytics.clicks.push({
    type,
    timestamp: new Date().toISOString(),
  });
  if (analytics.clicks.length > 10000) {
    analytics.clicks = analytics.clicks.slice(-10000);
  }
  _write(STORAGE_KEYS.analytics, analytics);
}

export async function getAnalyticsSummary(days = null) {
  const analytics = _read(STORAGE_KEYS.analytics) || { pageViews: [], clicks: [] };
  const now = new Date();

  // Filter helper: null = all time, 0 = today, 7 = last 7 days, 30 = last 30 days
  function inRange(timestamp) {
    if (days === null) return true;
    const d = new Date(timestamp);
    if (days === 0) {
      return d.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
    }
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);
    return d >= cutoff;
  }

  const filteredViews = analytics.pageViews.filter(v => inRange(v.timestamp));
  const filteredClicks = analytics.clicks.filter(c => inRange(c.timestamp));

  // Total page views (visits)
  const totalViews = filteredViews.length;

  // Room detail views only
  const roomViews = filteredViews.filter(v => v.roomId != null).length;

  // Click stats by type
  const clickCounts = {};
  for (const c of filteredClicks) {
    clickCounts[c.type] = (clickCounts[c.type] || 0) + 1;
  }

  // Top rooms by view count
  const roomViewCounts = {};
  for (const v of filteredViews) {
    if (v.roomId != null) {
      roomViewCounts[v.roomId] = (roomViewCounts[v.roomId] || 0) + 1;
    }
  }
  const topRooms = Object.entries(roomViewCounts)
    .map(([roomId, count]) => ({ roomId: Number(roomId), views: count }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  return {
    totalViews,
    roomViews,
    zaloClicks: clickCounts['zalo'] || 0,
    phoneClicks: clickCounts['phone'] || 0,
    topRooms,
    clickStats: clickCounts,
  };
}
