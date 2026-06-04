# Kế Hoạch Triển Khai Hệ Thống Shipper Giao Hàng & Nhập Hàng Theo Khu Vực (Lv 30+)

Kế hoạch này chi tiết hóa việc phát triển tính năng Đơn Hàng Giao Tận Nơi, mở khóa đội ngũ Shipper (giao hàng) từ Lv 30, cơ chế nâng cấp shipper (tốc độ & thùng hàng), và phân chia tab nhập hàng theo khu vực để dễ quản lý.

---

## 🗺️ Quy Mô Triển Khai (Scope of Work)

*   **Loại dự án**: WEB (Next.js/React + Go API + PostgreSQL)
*   **Trọng tâm**: Phát triển tính năng giao hàng và phân tách nhập hàng.
*   **Các điểm chính**:
    1.  **Tab Nhập Hàng Theo Khu Vực**: Trang "Nhập hàng" chia làm các Tab (Ví dụ: Tạ Hiện, Hồ Tây, Cổng Trường) để phân loại món ăn nhập sỉ riêng biệt.
    2.  **Đơn Hàng Giao Tận Nơi (Bản Đồ 3x4)**: Hệ thống tự động tạo tối đa **12 đơn hàng**.
        *   **Hiển thị (Responsive)**: Hiển thị lưới **3 dòng x 4 cột** trên PC/Desktop. Tự động co giãn (flex wrap) sang **2 cột (2x6)** hoặc **1 cột (1x12)** trên Mobile để đảm bảo trải nghiệm vuốt chạm và kích thước ô dễ đọc.
        *   **Cơ chế làm mới**: Tự động reset/làm mới danh sách sau mỗi 1 phút đối với các đơn hàng chưa nhận giao.
        *   **Độ khó đơn hàng**: Sinh đơn có độ khó tăng dần theo cấp độ người chơi/sạp.
    3.  **Hệ Thống Shipper**:
        *   Mở khóa Shipper 1 ở Lv 30 (Mặc định).
        *   Mở khóa Shipper 2 ở Lv 40 (+10 cấp mở thêm 1 shipper).
        *   Mở khóa Shipper 3 ở Lv 50.
    4.  **Nâng Cấp Shipper & Vận Chuyển Nhiều Đơn (Max Cấp 5)**:
        *   Giảm thời gian giao hàng (tăng tốc độ).
        *   Nâng cấp dung lượng thùng hàng (để chở các đơn hàng lớn hơn).
        *   **Giao nhiều đơn cùng lúc**: Tăng cấp shipper mở khóa thêm số lượng đơn hàng có thể giao đồng thời trong một chuyến đi (lên tới 3 đơn cùng lúc).
        *   **Hoàn thành ngay bằng Ngọc**: Cho phép người chơi tiêu hao **Ngọc (Gems)** để hoàn thành chuyến giao hàng ngay lập tức.
        *   Chi phí nâng cấp trả bằng Xu (Coins).

---

## 🏛️ Thay Đổi Cấu Trúc File & Database

### 1. Database Schema (`backend/migrations/`)
*   **[NEW]** [000012_shipper_delivery_system.up.sql](file:///c:/Users/dungv/hangrong/backend/migrations/000012_shipper_delivery_system.up.sql):
    *   Tạo bảng `shippers`:
        *   `id` UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        *   `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        *   `shipper_index` INT NOT NULL, (1, 2, 3)
        *   `level` INT NOT NULL DEFAULT 1, (1 đến 5)
        *   `status` VARCHAR(16) NOT NULL DEFAULT 'idle', ('idle', 'delivering')
        *   `busy_until` TIMESTAMPTZ DEFAULT NULL,
        *   `capacity` INT NOT NULL DEFAULT 10,
        *   `slots` INT NOT NULL DEFAULT 1, (Số lượng đơn hàng có thể giao đồng thời: Lvl 1-2: 1, Lvl 3-4: 2, Lvl 5: 3)
        *   `speed_multiplier` NUMERIC(4,2) NOT NULL DEFAULT 1.0,
        *   `created_at` TIMESTAMPTZ NOT NULL DEFAULT now(),
        *   UNIQUE(user_id, shipper_index)
    *   Tạo bảng `delivery_orders`:
        *   `id` UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        *   `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        *   `shipper_id` UUID REFERENCES shippers(id) ON DELETE SET NULL, (NULL nếu chưa giao, trỏ tới shipper nếu đang giao)
        *   `items` JSONB NOT NULL, (Định dạng: `{"product_code": quantity}`)
        *   `reward_coins` BIGINT NOT NULL,
        *   `reward_xp` BIGINT NOT NULL,
        *   `delivery_time_seconds` INT NOT NULL DEFAULT 120,
        *   `difficulty` VARCHAR(16) NOT NULL DEFAULT 'easy', ('easy', 'medium', 'hard')
        *   `status` VARCHAR(16) NOT NULL DEFAULT 'pending', ('pending', 'delivering')
        *   `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### 2. Backend Files
*   [models.go](file:///c:/Users/dungv/hangrong/backend/internal/game/models.go): Struct `Shipper` và `DeliveryOrder`.
*   **[NEW]** [delivery_service.go](file:///c:/Users/dungv/hangrong/backend/internal/game/delivery_service.go): Quản lý logic shipper, tính toán thuộc tính theo cấp độ, nâng cấp và giao nhận đơn.

### 3. Frontend Files
*   [api.types.ts](file:///c:/Users/dungv/hangrong/frontend/src/shared/types/api.types.ts): Khai báo kiểu dữ liệu cho `Shipper` và `DeliveryOrder`.
*   [import-goods/page.tsx](file:///c:/Users/dungv/hangrong/frontend/src/app/import-goods/page.tsx): Cải tiến phân chia tab nhập hàng.
*   **[NEW]** [DeliveryDialog.tsx](file:///c:/Users/dungv/hangrong/frontend/src/features/stall/components/DeliveryDialog.tsx): Bảng điều khiển giao hàng và quản lý shipper.

---

## 🛠️ Danh Sách Nhiệm Vụ Chi Tiết (Task Breakdown)

### 📌 Giai Đoạn 1: Cơ Sở Dữ Liệu & API Đơn Hàng (P0)

#### [Task SD-1.1] Tạo Migration SQL cho Shipper & Orders
*   **Đầu vào**: Thiết kế cấu trúc các bảng `shippers` và `delivery_orders`.
*   **Đầu ra**: File migration `000012_shipper_delivery_system.up.sql` và down tương ứng.
*   **Xác minh**: Chạy migration thành công, kiểm tra các cột và ràng buộc trong PostgreSQL.

#### [Task SD-1.2] API lấy danh sách Đơn Hàng (`GET /api/delivery/orders`)
*   **Đầu vào**: API gọi từ client.
*   **Đầu ra**: 
    *   Tự động xóa và sinh mới **tối đa 12 đơn hàng** ngẫu nhiên nếu đơn hàng cũ đã quá 1 phút (reset sau 1p) và chưa ở trạng thái `delivering`.
    *   **Sinh đơn theo độ khó (difficulty)**: Đơn hàng chia làm 3 cấp độ khó ngẫu nhiên tỉ lệ với cấp độ sạp (`stallLevel`) hiện tại của người chơi:
        *   **Easy** (Cấp sạp 1-50): Yêu cầu 1 loại vật phẩm, số lượng từ 1 - 5.
        *   **Medium** (Mở khóa từ Cấp sạp 10+): Yêu cầu 1 - 2 loại vật phẩm, số lượng từ 5 - 15.
        *   **Hard** (Mở khóa từ Cấp sạp 30+): Yêu cầu 2 - 3 loại vật phẩm, số lượng từ 15 - 30.
    *   Vật phẩm yêu cầu chỉ lấy trong các món ăn người chơi đã mở khóa. Phần thưởng Xu & XP tỉ lệ thuận với độ khó và tổng giá trị đơn hàng.
*   **Xác minh**: Gọi API liên tiếp sau 1 phút kiểm tra xem 12 đơn hàng chưa giao có tự động cập nhật đổi mới không, và kiểm tra đúng phân loại độ khó.

---

### 📌 Giai Đoạn 2: Logic Giao Hàng & Nâng Cấp Shipper (P1)

#### [Task SD-2.1] API Giao Hàng (`POST /api/delivery/shippers/{id}/deliver`)
*   **Đầu vào**: JSON payload `{ orderIds: ["UUID", "UUID"] }` (cho phép gửi danh sách ID đơn hàng cần giao).
*   **Đầu ra**:
    *   Kiểm tra shipper có ở trạng thái `idle`.
    *   Kiểm tra số lượng đơn hàng gửi lên không vượt quá số lượng ô giao hàng (`slots`) tối đa của shipper.
    *   Kiểm tra số lượng sản phẩm yêu cầu trong kho/hành lý người chơi cho tất cả các đơn hàng được chọn.
    *   Kiểm tra tổng số sản phẩm của các đơn hàng có vượt quá sức chứa `capacity` của shipper không.
    *   Trừ sản phẩm trong kho của người chơi.
    *   Cập nhật trạng thái các đơn hàng sang `delivering` và gán `shipper_id = shipper.id`.
    *   Đổi trạng thái shipper sang `delivering` và tính `busy_until = now() + (max_delivery_time_seconds / speed_multiplier)`. (Trong đó `max_delivery_time_seconds` là thời gian giao lâu nhất của các đơn hàng được chọn).
*   **Xác minh**: Kiểm tra sản phẩm bị trừ, các đơn hàng đổi trạng thái, và shipper rơi vào trạng thái bận.

#### [Task SD-2.2] API Nhận Thưởng (`POST /api/delivery/shippers/{id}/claim`)
*   **Đầu vào**: ID của shipper đã giao hàng xong (`busy_until < now()`).
*   **Đầu ra**: Cộng tiền Xu & XP cho người chơi từ tất cả các đơn hàng đi kèm chuyến đi của shipper đó. Reset shipper về trạng thái `idle`, `busy_until = NULL`. Xóa các đơn hàng đã hoàn thành khỏi database.
*   **Xác minh**: Nhận đúng phần thưởng, kiểm tra cộng tiền xu và XP thành công, đơn hàng bị xóa khỏi DB.

#### [Task SD-2.3] API Nâng Cấp Shipper (`POST /api/delivery/shippers/{id}/upgrade`)
*   **Đầu vào**: ID shipper cần nâng cấp.
*   **Đầu ra**:
    *   Kiểm tra tiền xu và cấp độ hiện tại (tối đa cấp 5).
    *   Trừ xu, tăng cấp độ shipper lên 1 cấp, cập nhật `capacity`, `slots` và `speed_multiplier` theo bảng thuộc tính:
        *   **Cấp 1**: Sức chứa: 10 | Số đơn tối đa: 1 | Tốc độ: 1.0x | Phí nâng cấp: Mặc định
        *   **Cấp 2**: Sức chứa: 15 | Số đơn tối đa: 1 | Tốc độ: 1.15x (Giảm 13% thời gian) | Phí: 50,000 Xu
        *   **Cấp 3**: Sức chứa: 20 | Số đơn tối đa: 2 | Tốc độ: 1.30x (Giảm 23% thời gian) | Phí: 150,000 Xu
        *   **Cấp 4**: Sức chứa: 30 | Số đơn tối đa: 2 | Tốc độ: 1.50x (Giảm 33% thời gian) | Phí: 400,000 Xu
        *   **Cấp 5**: Sức chứa: 50 | Số đơn tối đa: 3 | Tốc độ: 1.80x (Giảm 44% thời gian) | Phí: 1,000,000 Xu
*   **Xác minh**: Nâng cấp nâng đúng chỉ số, số slot đơn và trừ đúng xu. Max cấp 5 không cho nâng thêm.

#### [Task SD-2.4] API Hoàn Thành Giao Hàng Ngay Lập Tức (`POST /api/delivery/shippers/{id}/instant-complete`)
*   **Đầu vào**: ID shipper đang đi giao hàng.
*   **Đầu ra**:
    *   Kiểm tra shipper đang ở trạng thái `delivering` và `busy_until > now()`.
    *   Tính toán số Ngọc (Gems) cần tiêu tốn: Cứ mỗi 1 phút còn lại yêu cầu **1 Ngọc**, tối thiểu là **1 Ngọc**.
    *   Kiểm tra số Ngọc hiện có của người chơi. Trừ Ngọc của người chơi.
    *   Cập nhật `busy_until = now()` để người chơi có thể gọi API `claim` nhận thưởng ngay lập tức.
*   **Xác minh**: Trừ đúng số Ngọc, shipper chuyển sang sẵn sàng nhận thưởng lập tức.

---

### 📌 Giai Đoạn 3: Cải Tiến Giao Diện Nhập Hàng Phân Tab (P2)

#### [Task SD-3.1] Chia tab trang Nhập Hàng (`import-goods/page.tsx`)
*   **Đầu vào**: Trang `import-goods/page.tsx`.
*   **Đầu ra**:
    *   Thiết kế giao diện 3 Tab: **[Phố Tạ Hiện]** (mở mặc định), **[Hồ Tây]** (mở từ Lv 20), **[Cổng Trường]** (mở từ Lv 30).
    *   Lọc hiển thị danh mục món ăn sỉ tương ứng theo Tab đang chọn để tránh rối mắt.
*   **Xác minh**: Nhấp chuyển tab hiển thị đúng các mặt hàng của khu vực đó.

---

### 📌 Giai Đoạn 4: Giao Diện Quản Lý Giao Hàng & Shipper (P2)

#### [Task SD-4.1] Icon Giao Hàng & Badge thông báo trên HUD chính
*   **Đầu vào**: Trang sạp hàng [stall/page.tsx](file:///c:/Users/dungv/hangrong/frontend/src/app/stall/page.tsx).
*   **Đầu ra**:
    *   Một nút hình xe tải/shipper giao hàng bay nổi ở góc phải màn hình.
    *   Có chấm đỏ thông báo số lượng đơn hàng sẵn sàng giao hoặc shipper giao xong đang chờ nhận thưởng.
*   **Xác minh**: Click nút mở ra Dialog Quản Lý Giao Hàng.

#### [Task SD-4.2] Hộp thoại Điều Hành Giao Hàng (`DeliveryDialog.tsx`)
*   **Đầu vào**: Dialog/Bottom Sheet mở từ icon giao hàng.
*   **Đầu ra**:
    *   **Tab Đơn Hàng (Bố cục Linh Hoạt - Responsive)**:
        *   **PC/Desktop**: Bố cục lưới **3 hàng x 4 cột (3x4)** cố định hiển thị đầy đủ 12 đơn hàng cùng lúc.
        *   **Mobile**: Bố cục lưới tự động co giãn bằng Tailwind (`grid grid-cols-2 lg:grid-cols-4 gap-3`), hiển thị dạng 2 cột (2x6) hoặc 1 cột (1x12) để các nút bấm và hình ảnh vật phẩm to rõ ràng, dễ thao tác chạm.
        *   Mỗi ô đơn hàng hiển thị các món ăn yêu cầu (hình ảnh nhỏ + số lượng cần/đang có), phần thưởng (Xu & XP), nhãn độ khó khác nhau (Easy: màu lục, Medium: màu vàng, Hard: màu đỏ), trạng thái đơn (chưa giao, đang giao).
        *   Cho phép tích chọn nhiều đơn hàng để gán cho 1 shipper đi giao cùng lúc (số lượng đơn được chọn bị giới hạn bởi số ô `slots` của shipper đó, và tổng số lượng vật phẩm phải nhỏ hơn hoặc bằng `capacity` của shipper).
    *   **Tab Đội Shipper**:
        *   Hiển thị danh sách 3 shipper (Shipper 1 mở ở Lv 30, Shipper 2 mở ở Lv 40, Shipper 3 mở ở Lv 50).
        *   Hiển thị cấp độ, trạng thái (sẵn sàng, đang giao hàng - hiển thị thanh tiến trình và thời gian đếm ngược).
        *   Nút **"Hoàn thành ngay"** kèm icon Ngọc (Gems) và chi phí tương ứng để nhận hàng lập tức.
        *   Nút **"Nâng cấp"** hiển thị chi phí Xu và chỉ số sau khi nâng cấp (Sức chứa, Tốc độ, Số ô đơn tối đa).
*   **Xác minh**: Thực hiện giao hàng, tích chọn nhiều đơn hàng, nâng cấp shipper mượt mà, và dùng ngọc hoàn thành ngay, cập nhật trạng thái thời gian thực.

---

## 🏁 Phase X: Xác Minh Cuối Cùng (Final Verification)

*   [ ] Chạy `npm run lint && npx tsc --noEmit` kiểm tra lỗi Frontend.
*   [ ] Chạy `go build ./... && go test ./...` kiểm tra toàn bộ Backend.
*   [ ] Kiểm tra thủ công:
    *   Đạt cấp 30 mở khóa Shipper 1 thành công.
    *   Giao đơn hàng trừ đúng sản phẩm, thời gian shipper đi giao giảm đi khi nâng cấp shipper.
    *   Sức chứa thùng hàng của shipper hoạt động chuẩn (không cho giao đơn to hơn sức chứa).
    *   Nâng cấp shipper tối đa đạt cấp 5.
