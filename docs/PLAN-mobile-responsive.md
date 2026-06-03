# Kế hoạch Thiết kế Responsive Mobile & Nâng cấp Sạp Hàng

Tài liệu này vạch ra kế hoạch chi tiết để tối ưu hóa giao diện đa thiết bị (Responsive) cho game Hàng Rong từ màn hình đăng nhập đến tất cả các tính năng khác trên Mobile, đồng thời đề xuất logic nâng cấp sạp hàng sau khi đạt 6 ô bán hàng.

## 1. Tìm hiểu & Đề xuất Nâng cấp Sạp Hàng (Stall Upgrading)

### Giai đoạn 6 ô bán hàng (3 ô trên, 3 ô dưới)
*   **Vị trí tọa độ (Tạm tính):**
    *   Hàng trên (Row 1): 3 ô ở tọa độ `y = 350` (x lần lượt là `220, 400, 580`).
    *   Hàng dưới (Row 2): 3 ô ở tọa độ `y = 395` (x lần lượt là `220, 400, 580`).
*   **Cách hiển thị:** Sạp hàng gỗ sẽ tự động vẽ thêm các đợt/kệ chia ngăn nhỏ (hoặc giá đỡ) để sắp xếp đồ ăn gọn gàng theo dạng 3x2 mà không làm tràn mép bàn gỗ.

### Đề xuất Logic mới khi nâng cấp sạp vượt quá 6 ô
Khi người chơi tiếp tục nâng cấp sạp lên Cấp 7+, thay vì tiếp tục tăng số lượng ô bán hàng (gây rối mắt và quá tải không gian màn hình), sạp hàng sẽ mở rộng các logic sau:
1.  **Nâng cấp Ngoại trang Sạp (Visual Themes):** Mở khóa các mẫu sạp đẹp mắt hơn (ví dụ: Sạp hiện đại có tủ kính bóng loáng, Sạp trang trí đèn neon lấp lánh phong cách phố đi bộ Tạ Hiện, Sạp gỗ cổ kính phong cách Hà Nội xưa).
2.  **Buff Doanh thu & Thời gian (Stat Modifiers):**
    *   Mỗi cấp nâng cấp sau cấp 6 sẽ cộng thêm **+5% giá bán** (Revenue multiplier) cho tất cả mặt hàng bày trên sạp.
    *   Giảm **-3% thời gian đếm ngược** (Sell duration reducer) giúp bán hàng nhanh hơn.
3.  **Hỗ trợ Tự động hóa (Auto-Harvest Helper):**
    *   Ở cấp sạp cao, người chơi có thể mở khóa tính năng thuê "Cậu bé phụ việc" hoặc "Hộp nhạc tự động" giúp tự động thu hoạch tiền xu khi đếm ngược kết thúc (tối đa 30 phút khi offline).
4.  **Tủ giữ nhiệt & Tủ đá (Specialized Shelves):**
    *   Mở khóa các ô chức năng đặc biệt: Ô giữ nóng bánh mì giúp tăng 20% doanh thu; Ô giữ mát nước mía giúp bán nhanh gấp đôi.

---

## 2. Kế hoạch Responsive trên Thiết bị Di động (Mobile Layout Plan)

Mục tiêu chính: Giao diện trên Laptop giữ nguyên độ hoàn mỹ, trong khi trên các thiết bị di động (từ 320px đến 768px) các nút bấm, lưới ô và chữ viết sẽ tự động co giãn, dễ thao tác bằng ngón tay (Touch targets >= 44px).

### Các điểm cần tối ưu hóa:
1.  **GameShell (HUD & Điều hướng):**
    *   **Thanh HUD trên (Top Bar):** Thu nhỏ kích thước font chữ của cấp độ, XP và dồn gọn các Badge tiền xu/kim cương thành hàng ngang co giãn tự động để tránh tràn viền trên màn hình hẹp (320px).
    *   **Thanh điều hướng dưới (Bottom Nav):** Tối ưu hóa padding đáy của nội dung chính (`pb-[76px] md:pb-0`) để nội dung không bị che khuất bởi thanh điều hướng di động.
2.  **Màn hình Đăng nhập (Login/Register Page):**
    *   Căn chỉnh lại khoảng cách đệm (padding) của card truyện và form nhập liệu (`p-5 sm:p-8`) để tránh bị tràn màn hình theo chiều dọc trên các điện thoại có chiều cao hạn chế.
    *   Tăng cỡ chữ của tiêu đề và các nhãn input để người dùng dễ đọc và click chính xác.
3.  **Công cụ vẽ Game (PixiJS Canvas Responsive):**
    *   Hiện tại, canvas sử dụng tọa độ cứng `800x600`. Trên mobile, ta cần bổ sung logic tự động tính toán hệ số tỷ lệ (scale factor) dựa trên kích thước thật của container và co dãn toàn bộ scene của `StallScene` để hiển thị đầy đủ sạp hàng, NPC khách hàng và các hiệu ứng bay xu mà không bị cắt góc.
4.  **Lưới sản phẩm (Import Goods & Inventory):**
    *   Tối ưu hóa Touch targets: Tất cả các nút "NHẬP HÀNG", "BÀY BÁN" hay chọn số lượng sản phẩm (`+` / `-`) phải có chiều cao tối thiểu 44px.
    *   Lưới sản phẩm sử dụng Tailwind grid thông minh (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) đảm bảo hiển thị 1 cột gọn gàng trên mobile, 2-3 cột trên laptop.
5.  **Trang Nhiệm vụ & Bạn bè:**
    *   Trang nhiệm vụ: Thanh tiến trình (Progress bar) tự động co dãn 100% chiều rộng. Khoảng cách giữa các ô nhiệm vụ rộng rãi để dễ bấm "NHẬN THƯỞNG".
    *   Trang bạn bè: Canvas xem sạp hàng xóm cũng được áp dụng cơ chế tự động co giãn tương tự sạp của mình.

---

## 3. Danh sách các file cần điều chỉnh

| Component | File Path | Loại thay đổi | Mô tả |
|-----------|-----------|---------------|-------|
| **Stall Scene** | [StallScene.ts](file:///c:/Users/dungv/hangrong/frontend/src/game/scenes/StallScene.ts) | `MODIFY` | Thêm logic chia 6 ô bán hàng thành 2 hàng (3 trên, 3 dưới) khi sạp đạt cấp độ mở khóa 6 ô. Bổ sung tính toán tỷ lệ scale để scene tự co dãn theo kích thước canvas thực tế. |
| **HUD & Layout** | [GameShell.tsx](file:///c:/Users/dungv/hangrong/frontend/src/shared/components/GameShell.tsx) | `MODIFY` | Điều chỉnh CSS của Top Bar (HUD) và Bottom Nav để gọn gàng hơn trên mobile (co dãn linh hoạt, tránh tràn màn hình ở 320px). |
| **Login UI** | [page.tsx](file:///c:/Users/dungv/hangrong/frontend/src/app/login/page.tsx) | `MODIFY` | Tinh chỉnh padding và cỡ chữ tiêu đề, các nút bấm trên màn hình nhỏ. |
| **Stall Page** | [page.tsx](file:///c:/Users/dungv/hangrong/frontend/src/app/stall/page.tsx) | `MODIFY` | Điều chỉnh kích thước text, các nút nâng cấp sạp hàng trên điện thoại di động. |
| **Import Goods UI**| [page.tsx](file:///c:/Users/dungv/hangrong/frontend/src/app/import-goods/page.tsx) | `MODIFY` | Tối ưu hóa Touch target cho các nút bấm nhập hàng và bộ tăng giảm số lượng sản phẩm. |

---

## 4. Kế hoạch Verification (Phê duyệt)

### Kiểm thử tự động (Automated check)
- Chạy biên dịch TypeScript: `npx tsc --noEmit`
- Chạy audit UX bằng tool của hệ thống: `python .agent/skills/frontend-design/scripts/ux_audit.py .`

### Kiểm thử thủ công (Manual Verification)
- Thay đổi kích thước trình duyệt (Chrome DevTools) sang các kích thước màn hình phổ biến:
  - iPhone SE (320px)
  - iPhone 12/13/14 Pro (390px)
  - iPad Mini/Air (768px)
  - Màn hình Laptop tiêu chuẩn (1366px, 1920px)
- Xác nhận các hành động: Đăng nhập -> Vào sạp hàng -> Chọn ô bày bán -> Nhập hàng -> Nhận nhiệm vụ -> Xem sạp bạn bè hoạt động mượt mà và dễ click bằng tay.

---

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass
- Security: ✅ No critical issues
- Build: ✅ Success
- Date: 2026-06-03

