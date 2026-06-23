// ============================================================================
// data.js — Supabase Data Layer for Căn Hộ Vinhomes Website
// All functions return Promises (async/await).
// ============================================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase config
const SUPABASE_URL = 'https://pxgrlbvmsnmcdsktfgso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4Z3JsYnZtc25tY2Rza3RmZ3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTkyNTAsImV4cCI6MjA5Nzc5NTI1MH0.EmBQBXUXJ5168h0RbOWfE4bdzx9VADJG35h1ICrz91w';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Password hash (SHA-256 of 'ab112233')
const ADMIN_HASH = '803f2ef238499fde88428069181232be67730aaba324931ba498789f515cb662';

// ---------------------------------------------------------------------------
// Helper: convert between DB snake_case ↔ JS camelCase
// ---------------------------------------------------------------------------
function _toJS(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title || '',
    price: row.price || 0,
    address: row.address || '',
    area: row.area || '',
    roomType: row.room_type || '',
    roomCategory: row.room_category || '',
    description: row.description || '',
    adminNote: row.admin_note || '',
    moveInDate: row.move_in_date || '',
    images: row.images || [],
    videos: row.videos || [],
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function _toDB(room) {
  const data = {};
  if (room.title !== undefined) data.title = room.title;
  if (room.price !== undefined) data.price = Number(room.price);
  if (room.address !== undefined) data.address = room.address;
  if (room.area !== undefined) data.area = room.area;
  if (room.roomType !== undefined) data.room_type = room.roomType;
  if (room.roomCategory !== undefined) data.room_category = room.roomCategory;
  if (room.description !== undefined) data.description = room.description;
  if (room.adminNote !== undefined) data.admin_note = room.adminNote;
  if (room.moveInDate !== undefined) data.move_in_date = room.moveInDate;
  if (room.images !== undefined) data.images = room.images;
  if (room.videos !== undefined) data.videos = room.videos;
  return data;
}

// ---------------------------------------------------------------------------
// initData — ensure tables have initial data
// ---------------------------------------------------------------------------
export async function initData() {
  // Migrate localStorage data to Supabase (one-time)
  await _migrateFromLocalStorage();

  // Check if rooms exist, if not seed sample data
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('id')
    .limit(1);

  if (!error && (!rooms || rooms.length === 0)) {
    await _seedSampleRooms();
  }
}

// ---------------------------------------------------------------------------
// Migration: localStorage → Supabase (runs once)
// ---------------------------------------------------------------------------
async function _migrateFromLocalStorage() {
  const MIGRATED_KEY = 'nhatro_migrated_to_supabase';
  if (localStorage.getItem(MIGRATED_KEY)) return; // Already migrated

  try {
    // Migrate rooms
    const roomsRaw = localStorage.getItem('nhatro_rooms');
    if (roomsRaw) {
      const localRooms = JSON.parse(roomsRaw);
      if (Array.isArray(localRooms) && localRooms.length > 0) {
        const dbRows = localRooms.map(r => ({
          title: r.title || '',
          price: Number(r.price) || 0,
          address: r.address || '',
          area: r.area || '',
          room_type: r.roomType || '',
          room_category: r.roomCategory || '',
          description: r.description || '',
          admin_note: r.adminNote || '',
          move_in_date: r.moveInDate || '',
          images: r.images || [],
          videos: r.videos || [],
        }));

        // Check if Supabase already has rooms (avoid duplicate migration)
        const { data: existing } = await supabase.from('rooms').select('id').limit(1);
        if (!existing || existing.length === 0) {
          await supabase.from('rooms').insert(dbRows);
          console.log(`Migrated ${dbRows.length} rooms to Supabase`);
        }
      }
    }

    // Migrate contact info — only if Supabase still has default values
    const contactRaw = localStorage.getItem('nhatro_contact');
    if (contactRaw) {
      const c = JSON.parse(contactRaw);
      // Only migrate if localStorage has REAL data (not default 0123456789)
      if (c && c.phone && c.phone !== '0123456789') {
        const { data: existing } = await supabase.from('contact').select('phone').eq('id', 1).single();
        // Only overwrite if Supabase still has default
        if (existing && existing.phone === '0123456789') {
          await supabase.from('contact').upsert({
            id: 1,
            name: c.name || 'Chủ nhà',
            phone: c.phone,
            zalo: c.zalo || c.phone,
          });
          console.log('Migrated contact info to Supabase');
        }
      }
    }

    // Mark as migrated
    localStorage.setItem(MIGRATED_KEY, 'true');
    console.log('localStorage → Supabase migration complete');
  } catch (err) {
    console.error('Migration error:', err);
  }
}

// ---------------------------------------------------------------------------
// Room CRUD
// ---------------------------------------------------------------------------
export async function getRooms() {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getRooms error:', error);
    return [];
  }
  return (data || []).map(_toJS);
}

export async function getRoomById(id) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', Number(id))
    .single();

  if (error) {
    console.error('getRoomById error:', error);
    return null;
  }
  return _toJS(data);
}

export async function addRoom(roomData) {
  // Upload images & videos to Storage if they are base64
  const images = await _processMedia(roomData.images || [], 'rooms');
  const videos = await _processMedia(roomData.videos || [], 'videos');

  const dbData = _toDB({ ...roomData, images, videos });

  const { data, error } = await supabase
    .from('rooms')
    .insert(dbData)
    .select()
    .single();

  if (error) {
    console.error('addRoom error:', error);
    throw new Error('Không thể thêm phòng: ' + error.message);
  }
  return _toJS(data);
}

export async function updateRoom(id, roomData) {
  // Upload new images & videos to Storage if they are base64
  const images = await _processMedia(roomData.images || [], 'rooms');
  const videos = await _processMedia(roomData.videos || [], 'videos');

  const dbData = _toDB({ ...roomData, images, videos });

  const { data, error } = await supabase
    .from('rooms')
    .update(dbData)
    .eq('id', Number(id))
    .select()
    .single();

  if (error) {
    console.error('updateRoom error:', error);
    throw new Error('Không thể cập nhật phòng: ' + error.message);
  }
  return _toJS(data);
}

export async function deleteRoom(id) {
  // Get room first to delete its media from storage
  const room = await getRoomById(id);
  if (room) {
    const allMedia = [...(room.images || []), ...(room.videos || [])];
    for (const url of allMedia) {
      if (url.includes('room-media')) {
        const path = url.split('/room-media/')[1];
        if (path) {
          await supabase.storage.from('room-media').remove([path]);
        }
      }
    }
  }

  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', Number(id));

  if (error) {
    console.error('deleteRoom error:', error);
    throw new Error('Không thể xóa phòng: ' + error.message);
  }
}

// ---------------------------------------------------------------------------
// Media Processing: upload base64/blob → Supabase Storage → public URL
// ---------------------------------------------------------------------------
async function _processMedia(items, folder) {
  const result = [];
  for (const item of items) {
    if (typeof item === 'string' && item.startsWith('data:')) {
      // Base64 data — upload to Supabase Storage
      const url = await _uploadBase64(item, folder);
      if (url) result.push(url);
    } else if (typeof item === 'string') {
      // Already a URL
      result.push(item);
    }
  }
  return result;
}

async function _uploadBase64(base64Str, folder = 'rooms') {
  try {
    // Extract mime type and data
    const match = base64Str.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return base64Str;

    const mime = match[1];
    const ext = mime.split('/')[1]?.replace('quicktime', 'mov') || 'bin';
    const byteChars = atob(match[2]);
    const byteNumbers = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteNumbers], { type: mime });

    // Generate unique filename
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('room-media')
      .upload(filename, blob, { contentType: mime, upsert: false });

    if (error) {
      console.error('Upload error:', error);
      return base64Str; // Fallback: keep base64
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('room-media')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Upload failed:', err);
    return base64Str;
  }
}

// ---------------------------------------------------------------------------
// Contact Info
// ---------------------------------------------------------------------------
export async function getContactInfo() {
  const { data, error } = await supabase
    .from('contact')
    .select('*')
    .eq('id', 1)
    .single();

  if (error || !data) {
    return { name: 'Chủ nhà', phone: '0123456789', zalo: '0123456789' };
  }
  return { name: data.name, phone: data.phone, zalo: data.zalo };
}

export async function saveContactInfo(info) {
  const { error } = await supabase
    .from('contact')
    .upsert({ id: 1, name: info.name, phone: info.phone, zalo: info.zalo });

  if (error) {
    console.error('saveContactInfo error:', error);
    throw new Error('Không thể lưu thông tin liên hệ');
  }
}

// ---------------------------------------------------------------------------
// Admin Authentication (SHA-256 hashed + rate limiting)
// ---------------------------------------------------------------------------
const _loginState = { attempts: 0, lockedUntil: 0 };
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60000;

async function _sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyAdmin(username, password) {
  if (Date.now() < _loginState.lockedUntil) {
    const secs = Math.ceil((_loginState.lockedUntil - Date.now()) / 1000);
    throw new Error(`Quá nhiều lần thử. Vui lòng đợi ${secs}s`);
  }
  const hash = await _sha256(password);
  const valid = username === 'admin' && hash === ADMIN_HASH;
  if (!valid) {
    _loginState.attempts++;
    if (_loginState.attempts >= MAX_ATTEMPTS) {
      _loginState.lockedUntil = Date.now() + LOCKOUT_MS;
      _loginState.attempts = 0;
      throw new Error('Quá nhiều lần thử. Tài khoản bị khóa 60s');
    }
  } else {
    _loginState.attempts = 0;
  }
  return valid;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
export async function trackPageView(page, roomId = null) {
  await supabase.from('analytics').insert({
    type: 'pageView',
    page,
    room_id: roomId ? Number(roomId) : null,
  });
}

export async function trackClick(type) {
  await supabase.from('analytics').insert({
    type: 'click',
    action: type,
  });
}

export async function getAnalyticsSummary(days = null) {
  let query = supabase.from('analytics').select('*');

  // Filter by time period
  if (days !== null) {
    const now = new Date();
    let cutoff;
    if (days === 0) {
      // Today only
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else {
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - days);
      cutoff.setHours(0, 0, 0, 0);
    }
    query = query.gte('created_at', cutoff.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('getAnalyticsSummary error:', error);
    return { totalViews: 0, roomViews: 0, zaloClicks: 0, phoneClicks: 0, topRooms: [], clickStats: {} };
  }

  const rows = data || [];
  const views = rows.filter(r => r.type === 'pageView');
  const clicks = rows.filter(r => r.type === 'click');

  const totalViews = views.length;
  const roomViews = views.filter(v => v.room_id != null).length;

  const clickCounts = {};
  for (const c of clicks) {
    const a = c.action || 'unknown';
    clickCounts[a] = (clickCounts[a] || 0) + 1;
  }

  const roomViewCounts = {};
  for (const v of views) {
    if (v.room_id != null) {
      roomViewCounts[v.room_id] = (roomViewCounts[v.room_id] || 0) + 1;
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

// ---------------------------------------------------------------------------
// Sample Data Seed
// ---------------------------------------------------------------------------
async function _seedSampleRooms() {
  const now = new Date().toISOString();
  const samples = [
    {
      title: 'Studio 1PN ban công Đông Nam - S1.02',
      price: 6500000,
      address: 'Tòa S1.02, Vinhomes Ocean Park 1, Gia Lâm, Hà Nội',
      area: 'S1.02',
      room_type: 'studio',
      room_category: 'phongthu',
      description: '<ul><li>Diện tích: 30m² — ban công hướng Đông Nam thoáng mát</li><li>Nội thất đầy đủ: giường, tủ, bàn làm việc, điều hòa, nóng lạnh</li><li>View hồ, tầng 12</li></ul>',
      admin_note: 'Khách ưu tiên ở lâu dài.',
      images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
      videos: [],
    },
    {
      title: 'Căn hộ 2PN full nội thất cao cấp - S2.05',
      price: 9500000,
      address: 'Tòa S2.05, Vinhomes Ocean Park 2, Văn Giang, Hưng Yên',
      area: 'S2.05',
      room_type: 'nhanguyencan',
      room_category: 'duan',
      description: '<ul><li>Diện tích: 65m² — 2 phòng ngủ, 2 WC</li><li>Full nội thất cao cấp</li><li>View quảng trường, tầng 18</li></ul>',
      admin_note: 'Căn góc, view đẹp nhất tòa.',
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'],
      videos: [],
    },
    {
      title: 'Nhà nguyên căn 3PN khu biệt thự - BE2',
      price: 12000000,
      address: 'Tòa BE2, The Beverly, Vinhomes Ocean Park, Gia Lâm, Hà Nội',
      area: 'BE2',
      room_type: 'nhanguyencan',
      room_category: 'duan',
      description: '<ul><li>Diện tích: 90m² — 3 phòng ngủ, 2 WC</li><li>Nội thất đầy đủ</li><li>Khu biệt thự yên tĩnh</li></ul>',
      admin_note: 'Ưu tiên gia đình.',
      images: ['https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800', 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800'],
      videos: [],
    },
  ];

  const { error } = await supabase.from('rooms').insert(samples);
  if (error) console.error('Seed error:', error);
}
