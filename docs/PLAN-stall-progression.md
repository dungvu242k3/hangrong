# Kế Hoạch Triển Khai Tiến Trình Sạp Hàng & Cơ Chế Thuê Trợ Lý (Lv 1 - 20+)

Kế hoạch này chi tiết hóa việc thực hiện toàn diện (End-to-End) Giai đoạn 1 của Tiến trình sạp hàng: phân tách Cấp độ sạp, tính năng thuê Trợ lý tự động bằng Xu (có giới hạn giờ), mở khóa sạp thứ 2 từ cấp độ 20 (chuyển đổi qua tab bản đồ), và giới hạn tối đa 8 ô sạp.

---

## 🗺️ Quy Mô Triển Khai (Scope of Work)

*   **Loại dự án**: WEB (Next.js/React + PixiJS + Go API + PostgreSQL)
*   **Trọng tâm**: Phát triển Giai đoạn 1 (Lv 1 - 15) và mở rộng mốc Lv 20 (Mở sạp 2).
*   **Các điểm thay đổi lớn theo phản hồi người chơi**:
    1.  **Thuê Trợ lý**: Trả bằng Xu (Coins), hoạt động có thời hạn (ví dụ: thuê 1 tiếng/2 tiếng).
    2.  **Mở khóa Sạp thứ 2**: Đạt cấp độ người chơi 20. Quản lý ở 2 tab địa điểm khác nhau (Địa điểm 1: Phố Tạ Hiện, Địa điểm 2: Hồ Tây).
    3.  **Số ô tối đa**: Giới hạn tối đa 8 ô sạp (không lên 10 ô như kế hoạch cũ).

---

## 🏛️ Thay Đổi Cấu Trúc File & Database

### 1. Database Schema (`backend/migrations/`)
*   **[NEW]** [000011_stall_progression_upgrades.up.sql](file:///c:/Users/dungv/hangrong/backend/migrations/000011_stall_progression_upgrades.up.sql):
    *   Xóa bỏ ràng buộc `UNIQUE(user_id)` trên bảng `stalls` để một user có thể sở hữu nhiều sạp.
    *   Thêm cột `stall_index` (INT) để định danh sạp (Sạp 1, Sạp 2). Tạo khóa unique kết hợp: `UNIQUE(user_id, stall_index)`.
    *   Thêm các cột quản lý trợ lý vào bảng `stalls`:
        *   `hired_assistant` VARCHAR(32) DEFAULT NULL (Giá trị: `SHOE_SHINE` - Bé Đánh Giày).
        *   `assistant_expires_at` TIMESTAMPTZ DEFAULT NULL (Thời gian hết hạn thuê).
    *   Thêm cột `location_code` VARCHAR(64) DEFAULT 'TA_HIEN' vào bảng `stalls`.

### 2. Backend Files
*   [models.go](file:///c:/Users/dungv/hangrong/backend/internal/game/models.go): Cập nhật struct `UserProfile` và `User` để phản ánh các thay đổi trên.
*   [stall_service.go](file:///c:/Users/dungv/hangrong/backend/internal/game/stall_service.go): Cập nhật hàm `Upgrade` và thêm hàm `HireAssistant`.

### 3. Frontend Files
*   [api.types.ts](file:///c:/Users/dungv/hangrong/frontend/src/shared/types/api.types.ts): Cập nhật interface `UserProfile` và `StallSlot`.
*   [useStall.ts](file:///c:/Users/dungv/hangrong/frontend/src/shared/hooks/useStall.ts): Bổ dung mutation `hireAssistant` và cập nhật query `stallSlots` theo `stallIndex`.

---

## 🛠️ Danh Sách Nhiệm Vụ Chi Tiết (Task Breakdown)

### 📌 Giai Đoạn 1: Cơ Sở Dữ Liệu & Cấu Trúc Backend (P0)

#### [Task SP-1.1] Tạo file Migration nâng cấp DB
*   **Đầu vào**: Cấu trúc bảng `stalls` và `stall_slots` hiện tại.
*   **Đầu ra**: File migration [000011_stall_progression_upgrades.up.sql](file:///c:/Users/dungv/hangrong/backend/migrations/000011_stall_progression_upgrades.up.sql) và tệp hạ cấp tương ứng.
*   **Xác minh**: Chạy migration thành công lên database cục bộ. Ràng buộc `UNIQUE` cũ bị xóa và các cột trợ lý được thêm thành công.

#### [Task SP-1.2] Cập nhật models và Go structs
*   **Đầu vào**: File [models.go](file:///c:/Users/dungv/hangrong/backend/internal/game/models.go).
*   **Đầu ra**: Struct `Stall` chứa `HiredAssistant`, `AssistantExpiresAt`, `StallIndex`, `LocationCode`.
*   **Xác minh**: `go build ./...` chạy không lỗi.

---

### 📌 Giai Đoạn 2: Xây Dựng API Trợ Lý & Đa Sạp (P1)

#### [Task SP-2.1] API Thuê Trợ Lý (`POST /api/stalls/hire`)
*   **Đầu vào**: Payload `{ assistantType: "SHOE_SHINE" }`
*   **Đầu ra**: Trừ 500 Xu của người chơi, cập nhật `hired_assistant = 'SHOE_SHINE'` và `assistant_expires_at = now() + interval '2 hours'` trong DB.
*   **Xác minh**: Dùng Postman/cURL test kiểm tra ví xu bị trừ và DB cập nhật đúng hạn dùng.

#### [Task SP-2.2] Cập nhật API Slots & Auto-Collect
*   **Đầu vào**: API `/api/selling/slots` và `/api/selling/slots/{id}/collect`.
*   **Đầu ra**:
    *   Hỗ trợ tham số `?stall_index=X` để trả về đúng danh sách ô sạp của sạp tương ứng.
    *   Nếu Bé Đánh Giày đang hoạt động (`assistant_expires_at > now()`), khi slot chuyển sang trạng thái `ready_to_collect`, backend tự động xử lý thu hoạch cộng tiền xu cho người chơi và reset slot về trống mà không cần người chơi gọi API collect thủ công (hoặc xử lý tự động khi gọi API đồng bộ sync/get slots).
*   **Xác minh**: Viết unit test giả lập có Trợ lý hoạt động, kiểm tra xem tiền xu có tự động tăng và ô hàng tự động trống không.

#### [Task SP-2.3] Cập nhật API Upgrade cho Sạp thứ 2
*   **Đầu vào**: API `/api/stalls/upgrade`
*   **Đầu ra**:
    *   Giới hạn nâng cấp sạp tối đa 8 ô.
    *   Khi người chơi đạt cấp độ 20, API cho phép kích hoạt mở sạp thứ 2 (stall_index = 2). Trả phí 10,000 Xu để khởi tạo sạp mới với 3 ô hàng ban đầu.
*   **Xác minh**: Test gọi nâng cấp sạp ở cấp 20 kiểm tra sạp thứ 2 được tạo thành công trong bảng `stalls`.

---

### 📌 Giai Đoạn 3: Giao Diện Thuê & Điều Khiển Trợ Lý Chibi (P2)

#### [Task SP-3.1] Bảng điều khiển Thuê Trợ Lý (React Sidebar/Modal)
*   **Đầu vào**: UI HUD trong [stall/page.tsx](file:///c:/Users/dungv/hangrong/frontend/src/app/stall/page.tsx).
*   **Đầu ra**: Thêm nút "Thuê trợ lý". Khi nhấn, mở Bottom Sheet hiển thị:
    *   **Bé Đánh Giày**: Tự động nhặt xu trong 2 giờ. Chi phí: 500 Xu.
    *   Hiển thị thời gian đếm ngược còn lại nếu trợ lý đang làm việc.
*   **Xác minh**: Giao diện hiển thị đúng trạng thái thời gian đếm ngược thực tế của trợ lý.

#### [Task SP-3.2] Tích hợp Bé Đánh Giày chibi vào PixiJS Canvas
*   **Đầu vào**: Tệp [StallScene.ts](file:///c:/Users/dungv/hangrong/frontend/src/game/scenes/StallScene.ts).
*   **Đầu ra**:
    *   Nhận thông tin trợ lý từ sự kiện `react:sync_slots`.
    *   Nếu Bé Đánh Giày đang hoạt động, vẽ nhân vật chibi Bé Đánh Giày đứng bên trái sạp hàng (mặc áo thun xanh, đội mũ lưỡi trai).
    *   Khi có xu bay ra từ việc thu hoạch, nhân vật chibi di chuyển nhẹ sang nhặt xu.
*   **Xác minh**: Bật/tắt trợ lý trên UI React làm nhân vật chibi xuất hiện/biến mất tương ứng trên đường phố PixiJS.

---

### 📌 Giai Đoạn 4: Giao Diện Tab Địa Điểm Đa Sạp (P2)

#### [Task SP-4.1] Bộ chuyển đổi Sạp & Bản đồ (Stall Tab Switcher)
*   **Đầu vào**: Thanh điều hướng trang sạp [stall/page.tsx](file:///c:/Users/dungv/hangrong/frontend/src/app/stall/page.tsx).
*   **Đầu ra**:
    *   Hiển thị bộ Tab chuyển đổi: **[Phố Tạ Hiện (Sạp 1)]** và **[Hồ Tây (Sạp 2)]**.
    *   Tab Sạp 2 bị khóa và mờ đi kèm thông báo: "Yêu cầu Cấp độ 20 và 10,000 Xu để mở khóa".
    *   Khi chuyển Tab, phát sự kiện sync lại slots của sạp tương ứng sang PixiJS canvas.
*   **Xác minh**: Nhấn chuyển Tab làm tải lại các ô hàng và giao diện của sạp tương ứng trên canvas mà không bị lỗi.

#### [Task SP-4.2] Thay đổi giao diện nền theo Địa điểm (PixiJS)
*   **Đầu vào**: Hàm `drawStreetBackground` của [StallScene.ts](file:///c:/Users/dungv/hangrong/frontend/src/game/scenes/StallScene.ts).
*   **Đầu ra**:
    *   If sạp ở địa điểm `HO_TAY`, vẽ nền hồ nước xanh mát Hồ Tây ở phía sau thay cho ngôi nhà cổ kính, vẽ thêm lan can ven hồ và hàng liễu rủ.
*   **Xác minh**: Chuyển đổi tab địa điểm đổi nền đồ họa tương ứng thành công.

---

## 🏁 Phase X: Xác Minh Cuối Cùng (Final Verification)

*   [ ] Chạy `npm run lint && npx tsc --noEmit` kiểm tra lỗi Frontend.
*   [ ] Chạy `go test ./...` kiểm tra toàn bộ logic Backend.
*   [ ] Chạy `python .agent/scripts/verify_all.py .` thực hiện quét bảo mật và UX.
*   [ ] Kiểm tra thủ công:
    *   Nâng cấp sạp tối đa đạt 8 ô, không thể nâng thêm.
    *   Thuê Bé Đánh Giày trừ đúng 500 Xu, đếm ngược chạy trên UI, xuất hiện chibi Bé Đánh Giày trên Canvas tự động gom tiền khi chín.
    *   Đạt Lv 20 bấm mở khóa Sạp 2 ở tab Hồ Tây hiển thị đúng nền nước Hồ Tây và hoạt động độc lập với Sạp 1.
