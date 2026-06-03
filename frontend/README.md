# Hàng Rong Game - Frontend (Next.js + Tailwind CSS v4)

Chào mừng bạn đến với kho lưu trữ mã nguồn Frontend của game mô phỏng **Hàng Rong**. Dự án được xây dựng trên nền tảng **Next.js App Router (React)** kết hợp với động cơ đồ họa **PixiJS** để tái hiện lại không khí vỉa hè phố cổ Hà Nội thời kỳ những năm 2000 dưới dạng game 2D sống động.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu Cầu Hệ Thống
- **Node.js**: Phiên bản `v18.x` hoặc cao hơn (khuyên dùng `v20.x` LTS).
- **Trình quản lý gói**: `npm` (mặc định đi kèm Node.js), `yarn`, hoặc `pnpm`.

### Quy Trình Cài Đặt & Khởi Chạy
1. **Di chuyển vào thư mục Frontend:**
   ```bash
   cd frontend
   ```
2. **Cài đặt các gói phụ thuộc (Dependencies):**
   ```bash
   npm install
   # hoặc
   yarn install
   # hoặc
   pnpm install
   ```
3. **Cấu hình biến môi trường:**
   - Tạo file `.env` hoặc `.env.local` trong thư mục `frontend/`.
   - Cấu hình các biến môi trường sau:
     ```env
     # Bật chế độ giả lập dữ liệu cục bộ khi không có Backend API
     # Giá trị: true (Bật mock) | false (Tắt mock, kết nối BE thật)
     NEXT_PUBLIC_ENABLE_MOCK_FALLBACK=true
     
     # Endpoint kết nối API của Backend Go
     NEXT_PUBLIC_API_URL=http://localhost:8080/api
     ```
4. **Chạy server phát triển (Development Mode):**
   ```bash
   npm run dev
   # hoặc
   yarn dev
   # hoặc
   pnpm dev
   ```
   - Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)

5. **Biên dịch dự án cho Production (Production Build):**
   ```bash
   npm run build
   npm run start
   ```

---

## 🌟 Các Tính Năng Có Trong Frontend

Hệ thống Frontend tích hợp đầy đủ các tính năng của game bao gồm:

1. **Hệ Thống Đăng Nhập & Kể Chuyện (Auth & Storytelling):**
   - Thiết kế theo phong cách Retro Máy Arcade (Game thùng) độc đáo.
   - Hiệu ứng CRT Scanlines giả lập màn hình CRT của những năm 2000.
   - Dẫn dắt cốt truyện bằng hiệu ứng chữ chạy tự động (Typewriter Effect) đầy cảm xúc.
2. **Sạp Hàng Immersive Canvas (Stall Scene):**
   - Tích hợp động cơ đồ họa **PixiJS (WebGL)** cho các hiệu ứng chuyển động mượt mà ở mức 55-60 FPS.
   - Hệ thống NPC khách hàng chibi tự động tìm đến mua đồ, tương tác và hiển thị cảm xúc.
   - Hiệu ứng đồng xu bay vút từ sạp hàng lên thanh số dư khi thu hoạch.
3. **Quản Lý Nhập Hàng (Import Goods):**
   - Grid danh sách sản phẩm ăn vặt thuần Việt (Bánh mì, trà đá, hướng dương, bánh cuốn...).
   - Tính toán lãi dự kiến, hiển thị đếm ngược thời gian hàng về thời gian thực.
4. **Quản Lý Kho Đồ (Inventory):**
   - Phân chia danh mục sản phẩm (Đồ ăn, Thức uống, Đồ chơi).
   - Cho phép chọn vị trí trống trên sạp để bày bán hàng nhanh chóng thông qua `BottomSheet` tương thích di động.
5. **Hành Trình Xã Hội (Social - Hàng Xóm):**
   - Xem danh sách bạn bè cùng cấp độ và số xu.
   - Ghé thăm sạp hàng xóm (Canvas chuyển sang chế độ tham quan).
   - Thực hiện tương tác xã hội: **Giúp đỡ** sạp bạn (tăng exp) hoặc **Chọc phá** (ngưng trệ buôn bán).
   - Tích hợp giới hạn tương tác (3 lượt/ngày), thời gian hồi chiêu (cooldown ticker) có âm thanh báo, loading skeletons và confirm dialog an toàn.
6. **Hệ Thống Nhiệm Vụ & Nâng Cấp:**
   - Theo dõi tiến độ nhiệm vụ ngày và nhiệm vụ chính tuyến.
   - Giao diện nâng cấp sạp gỗ mở thêm slot bày hàng mới.
7. **Tắt/Bật Âm Thanh Toàn Cục:**
   - Nhạc nền (BGM) và hiệu ứng âm thanh (SFX) được thiết kế qua Web Audio API, có nút HUD cho phép tắt/bật thầm lặng và lưu cấu hình vào LocalStorage.

---

## 📁 Cấu Trúc Thư Mục Frontend

Mã nguồn được tổ chức theo chuẩn Next.js App Router kết hợp kiến trúc Modular Feature-based:

```text
frontend/
├── src/
│   ├── app/                      # Next.js App Router (Pages & Layouts)
│   │   ├── friends/              # Màn hình danh sách bạn bè & Ghé thăm sạp bạn
│   │   ├── import-goods/         # Màn hình nhập hàng hoá
│   │   ├── inventory/            # Màn hình kho đồ người chơi
│   │   ├── login/                # Màn hình đăng nhập máy game cổ
│   │   ├── quests/               # Màn hình danh sách nhiệm vụ
│   │   ├── stall/                # Màn hình sạp hàng chính
│   │   ├── globals.css           # Cấu hình CSS toàn cục & biến Tailwind v4
│   │   ├── layout.tsx            # Bọc root layout, cung cấp providers
│   │   └── page.tsx              # Trang điều hướng ban đầu
│   │
│   ├── features/                 # Đóng gói logic theo tính năng độc lập
│   │   └── stall/
│   │       └── components/
│   │           └── StallSceneCanvas.tsx  # Cầu nối nhúng PixiJS Canvas vào React
│   │
│   ├── game/                     # Mã nguồn logic Game (PixiJS)
│   │   ├── engine/               # Quản lý vòng đời Pixi App, load tài nguyên
│   │   ├── events/               # gameEmitter.ts (Cầu nối Event Emitter React <-> PixiJS)
│   │   └── scenes/               # Quản lý bối cảnh sạp nhà, sạp hàng xóm
│   │
│   └── shared/                   # Thành phần dùng chung toàn cục
│       ├── components/           # UI Atoms: Button, BottomSheet, Badges...
│       ├── hooks/                # Custom React Hooks (useAuth, useFriends...)
│       ├── lib/                  # Cấu hình API Client, Query Client
│       ├── stores/               # Store quản lý trạng thái UI (Zustand)
│       └── types/                # Định nghĩa kiểu dữ liệu TypeScript (API Types)
│
├── public/                       # Assets tĩnh (Ảnh WebP, hiệu ứng âm thanh mp3)
├── package.json                  # Cấu hình dependencies & scripts chạy dự án
├── tailwind.config.js            # Tuỳ chỉnh cấu hình giao diện
└── tsconfig.json                 # Cấu hình trình biên dịch TypeScript
```

---

## 🛠️ Quy Trình Đảm Bảo Chất Lượng (Quality Gates)

Trước khi deploy hoặc commit code mới, dự án bắt buộc phải vượt qua các bài kiểm tra tự động sau để đảm bảo chất lượng:

```bash
# 1. Kiểm tra cú pháp (Linter)
npm run lint

# 2. Kiểm tra kiểu dữ liệu (TypeScript compiler)
npx tsc --noEmit

# 3. Chạy Master Quality Gate (Security, Lint, Schema, UX, SEO)
python -Xutf8 .agent/scripts/checklist.py .
```

Mọi đóng góp và mã nguồn đều tuân thủ nghiêm ngặt chuẩn tối ưu hóa di động, khả năng tương phản cao và tính nhất quán của hệ thống thiết kế retro game!
