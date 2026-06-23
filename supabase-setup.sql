-- ============================================================
-- Supabase Setup SQL cho web Căn Hộ Vinhomes
-- Chạy trong SQL Editor của Supabase
-- ============================================================

-- 1. Bảng rooms (lưu thông tin phòng)
CREATE TABLE IF NOT EXISTS rooms (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  price BIGINT NOT NULL DEFAULT 0,
  address TEXT DEFAULT '',
  area TEXT DEFAULT '',
  room_type TEXT DEFAULT '',
  room_category TEXT DEFAULT '',
  description TEXT DEFAULT '',
  admin_note TEXT DEFAULT '',
  move_in_date TEXT DEFAULT '',
  images JSONB DEFAULT '[]'::jsonb,
  videos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Bảng contact (lưu thông tin liên hệ)
CREATE TABLE IF NOT EXISTS contact (
  id INT PRIMARY KEY DEFAULT 1,
  name TEXT DEFAULT 'Chủ nhà',
  phone TEXT DEFAULT '0123456789',
  zalo TEXT DEFAULT '0123456789'
);

-- Insert default contact row
INSERT INTO contact (id, name, phone, zalo)
VALUES (1, 'Chủ nhà', '0123456789', '0123456789')
ON CONFLICT (id) DO NOTHING;

-- 3. Bảng analytics (lưu lượt xem và clicks)
CREATE TABLE IF NOT EXISTS analytics (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL, -- 'pageView' or 'click'
  page TEXT,
  room_id BIGINT,
  action TEXT, -- 'zalo', 'phone' for clicks
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tạo Storage bucket cho ảnh/video
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-media', 'room-media', true)
ON CONFLICT (id) DO NOTHING;

-- 5. RLS Policies (cho phép đọc public, ghi với anon key)

-- Rooms: ai cũng đọc được, anon có thể thêm/sửa/xóa
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "rooms_update" ON rooms FOR UPDATE USING (true);
CREATE POLICY "rooms_delete" ON rooms FOR DELETE USING (true);

-- Contact: ai cũng đọc được, anon có thể sửa
ALTER TABLE contact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_select" ON contact FOR SELECT USING (true);
CREATE POLICY "contact_insert" ON contact FOR INSERT WITH CHECK (true);
CREATE POLICY "contact_update" ON contact FOR UPDATE USING (true);

-- Analytics: ai cũng ghi được, admin đọc
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_select" ON analytics FOR SELECT USING (true);
CREATE POLICY "analytics_insert" ON analytics FOR INSERT WITH CHECK (true);

-- Storage: cho phép upload/đọc public
CREATE POLICY "room_media_select" ON storage.objects FOR SELECT USING (bucket_id = 'room-media');
CREATE POLICY "room_media_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'room-media');
CREATE POLICY "room_media_update" ON storage.objects FOR UPDATE USING (bucket_id = 'room-media');
CREATE POLICY "room_media_delete" ON storage.objects FOR DELETE USING (bucket_id = 'room-media');

-- 6. Index để tăng tốc query
CREATE INDEX IF NOT EXISTS idx_rooms_category ON rooms(room_category);
CREATE INDEX IF NOT EXISTS idx_rooms_area ON rooms(area);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics(type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics(created_at);
