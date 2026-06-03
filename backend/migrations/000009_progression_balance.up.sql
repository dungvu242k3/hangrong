INSERT INTO products
  (code, name, category, unlock_level, import_price, sell_price, import_duration_seconds, base_sell_duration_seconds, icon_name, color)
VALUES
  ('NEM_CHUA_RAN', 'Nem chua rán', 'food', 4, 180, 350, 80, 80, 'bento', '#F43F5E'),
  ('SUA_CHUA_NEP_CAM', 'Yogurt nếp cẩm', 'drink', 5, 130, 270, 70, 70, 'wine', '#8B5CF6'),
  ('XOI_XEO', 'Xôi xéo thơm dẻo', 'food', 6, 250, 520, 150, 150, 'bowl', '#F59E0B'),
  ('SAU_DA', 'Sấu đá phố cổ', 'drink', 7, 100, 220, 60, 60, 'glass', '#10B981'),
  ('BAP_NUONG', 'Bắp nướng mỡ hành', 'food', 8, 300, 650, 180, 180, 'lollipop', '#EAB308'),
  ('PHO_GANH', 'Phở gánh Hà Nội', 'food', 10, 500, 1100, 240, 240, 'soup', '#EF4444')
ON CONFLICT (code) DO NOTHING;
