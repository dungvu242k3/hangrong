# Kế Hoạch Nâng Cấp Tiến Trình Sạp Hàng & Mô Hình Kinh Doanh (Lv 1 - 50+)

Tài liệu này chi tiết hóa thiết kế hệ thống nâng cấp sạp hàng (stalls), chuyển đổi mô hình kinh doanh từ sạp vỉa hè lên xe tải đồ ăn và cửa hàng cố định, đồng thời tích hợp tính năng thuê nhân viên tự động bán hộ.

---

## 🗺️ Hệ Thống Mốc Tiến Trình Nâng Cấp (Lv 1 - 50+)

Cấp độ nâng cấp sạp sẽ được liên kết chặt chẽ với **Cấp độ người chơi (Player Level)** để tạo mục tiêu ngắn hạn liên tục. Mỗi mốc cấp độ sẽ mang lại sự lột xác về cả mặt hình ảnh lẫn cơ chế chơi:

### 🏙️ Giai Đoạn 1: Sạp Hàng Vỉa Hè Phố Cổ (Lv 1 - 15)
*Mô hình kinh doanh vỉa hè truyền thống, mộc mạc và gần gũi.*

| Cấp Yêu Cầu | Tên Sạp Hàng | Số Ô | Buff Doanh Thu | Buff Tốc Độ Bán | Tính Năng Đặc Biệt Mở Khóa |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **Lv 1** | Gánh hàng nhỏ sơ sài | 3 ô | +0% | -0% | Giao diện gánh hàng rong gỗ cơ bản, bạt sọc đỏ-trắng. |
| **Lv 3** | Sạp khung nhôm đèn Led | 4 ô | +5% | -5% | Bảng đèn LED mini phát sáng nhẹ khi trời tối. |
| **Lv 6** | Sạp gỗ trợ lý nhỏ | 4 ô | +10% | -5% | **Thuê Trợ Lý 1**: Thuê *Bé Đánh Giày* đứng thu hoạch tiền xu tự động. |
| **Lv 9** | Sạp gỗ hương cổ kính | 5 ô | +15% | -10% | Bàn gỗ gụ sẫm viền đồng xịn hơn, bạt sọc xanh lá - trắng. |
| **Lv 12** | Chuỗi gánh hàng rong | 5 ô | +15% | -10% | **Mở sạp thứ 2**: Cho phép vận hành 2 gánh hàng rong song song. |

---

### 🚚 Giai Đoạn 2: Xe Đẩy & Xe Tải Đồ Ăn Di Động (Lv 16 - 30)
*Nâng cấp mô hình lên phương tiện di động để tiếp cận nhiều khách hàng hơn.*

| Cấp Yêu Cầu | Tên Mô Hình | Số Ô | Buff Doanh Thu | Buff Tốc Độ Bán | Tính Năng Đặc Biệt Mở Khóa |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **Lv 16** | Xe đẩy bánh mì vỉa hè | 6 ô | +25% | -15% | **Biến hình sạp**: Sạp gỗ biến thành xe đẩy có bánh xe lớn và dù che.<br>**Thuê Trợ Lý 2**: Thuê *Cô Bán Nước* tự động bày hàng từ kho lên sạp. |
| **Lv 20** | Xe tải đồ ăn (Food Truck) | 7 ô | +40% | -20% | Đồ họa chuyển sang **Xe tải đồ ăn màu vàng cát** cực chill có đèn trang trí lung linh. |
| **Lv 23** | Xe tải lưu động liên quận | 7 ô | +45% | -20% | **Chọn Địa Điểm (Travel)**: Di chuyển xe tải qua 3 địa điểm (Cổng Trường, Hồ Tây, Phố Tạ Hiện) để tăng doanh thu cho nhóm hàng tương ứng. |
| **Lv 25** | Hạm đội xe tải đồ ăn | 7 ô | +45% | -20% | **Mở sạp thứ 3**: Vận hành sạp/xe tải thứ 3 cùng một lúc. |

---

### 🏪 Giai Đoạn 3: Cửa Hiệu Phố Cổ & Nhà Hàng (Lv 31 - 50+)
*Trở thành doanh nhân thực thụ sở hữu cửa tiệm cố định sang xịn.*

| Cấp Yêu Cầu | Tên Mô Hình | Số Ô | Buff Doanh Thu | Buff Tốc Độ Bán | Tính Năng Đặc Biệt Mở Khóa |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **Lv 31** | Cửa tiệm phố cổ (Café) | 8 ô | +65% | -25% | **Chuyển cảnh trong nhà**: Quầy bar gỗ mun cao cấp, tủ kính trưng bày đồ ăn.<br>**Thuê Trợ Lý 3**: Thuê *Thu Ngân & Đầu Bếp* tự động bán cả online/offline (2 tiếng). |
| **Lv 40** | Nhà hàng ẩm thực (Fine Dining) | 10 ô | +100% | -40% | Không gian nhà hàng sang trọng, trang hoàng tranh ảnh cổ điển và hoa tươi.<br>**Khách VIP**: Xuất hiện khách đại gia đội mũ vương miện tip thêm tiền xu/ngọc. |
| **Lv 50+** | Chuỗi nhượng quyền thương hiệu | 10 ô | +120% | -45% | Đạt cấp sạp tối đa. Cho phép tự do đổi giao diện (Skin sạp) quay lại các mô hình cũ đã mở khóa. |

---

## 🎨 Chi Tiết Tính Năng Mở Khóa

### 1. Thuê Trợ Lý Tự Động (Stall Assistants)
Giúp người chơi rảnh tay khi làm việc khác hoặc khi thoát game:
*   **Bé Đánh Giày (Tự động thu hoạch - Auto Collect)**: Đứng bên trái sạp. Khi món ăn đếm ngược xong và có xu rơi ra, cậu bé sẽ tự động nhặt xu (người chơi không cần click).
*   **Cô Bán Nước (Tự động bày hàng - Auto Refill)**: Đứng bên phải sạp. Khi phát hiện ô sạp trống, cô sẽ tự động lấy sản phẩm cùng loại từ trong kho bày lên sạp để bán tiếp.
*   **Thu Ngân & Đầu Bếp (Tự động hóa hoàn toàn - Full Automation)**: Đứng trong quầy. Thực hiện cả hai chức năng bày hàng và thu tiền, hoạt động ngay cả khi người chơi offline (tối đa 2 tiếng).

### 2. Di Chuyển Địa Điểm Bán (Location Travel)
Xe tải đồ ăn có thể di chuyển qua các địa điểm đặc trưng để nhận buff doanh thu theo danh mục:
*   **Cổng Trường**: Tăng **+30% giá bán** cho các món thuộc nhóm *Đồ ăn vặt* (Bánh mì, hướng dương, kẹo kéo).
*   **Bờ Hồ Tây**: Tăng **+30% giá bán** cho các món thuộc nhóm *Nước giải khát* (Trà đá, sấu đá, sữa chua).
*   **Phố Tạ Hiện**: Tăng **+30% giá bán** cho các món thuộc nhóm *Đồ nhậu/Đồ đêm* (Nem chua rán, bắp nướng, phở gánh).

### 3. Tiến Trình Đồ Họa Động (Procedural Visual Progression) & Phong Cách Cổ Điển ZingMe
Để tái hiện chính xác không khí trò chơi **Hàng Rong** huyền thoại trên ZingMe ngày xưa (như trong ảnh tham chiếu), chúng ta sẽ chuyển đổi đồ họa vỉa hè phẳng hiện tại thành một bức tranh đường phố Hà Nội 2D vẽ tay bằng các lệnh hình khối trong PixiJS:

#### A. Cải Tiến Hoạt Cảnh Nền Phố Cổ (ZingMe Street Background):
*   **Bầu trời (Sky - y: 0 -> 140)**: Vẽ bầu trời xanh dịu (`0xBAE6FD`) với một vài đám mây trắng mềm mại bay lơ lửng.
*   **Đường chân trời đô thị (y: 100 -> 140)**: Vẽ bóng mờ các tòa nhà cao tầng phía xa (`0xCBD5E1`) xen lẫn những sợi dây điện giăng ngang.
*   **Ngôi nhà Hà Nội cổ kính (y: 120 -> 300)**:
    - Vẽ ngôi nhà sơn màu vàng chanh cổ đặc trưng (`0xFEF08A`) hoặc màu xanh ngọc bích nhạt (`0xCCFBF1`).
    - Mái ngói đỏ gạch xếp nghiêng kiểu nhà cổ (`0xEF4444` hoặc `0xEA580C`).
    - Cửa sổ gỗ chớp màu xanh lá cây đậm (`0x065F46`).
    - Lan can ban công sắt uốn lượn phong cách Pháp cổ.
*   **Cột điện & Loa phát thanh (Utility Pole - Góc phải màn hình)**:
    - Một cột điện cao màu xám chạy dọc từ trên xuống.
    - Đầu cột treo cụm loa phát thanh phường chĩa về hai phía (`0x475569`) và một chiếc camera giám sát nhỏ.
*   **Vỉa hè & Lòng đường (y: 300 -> 600)**:
    - *Sidewalk (y: 300 -> 460)*: Lát gạch xám nhạt với những đường kẻ brick tinh tế. Vẽ thêm mảng cỏ leo/bụi cây xanh bám trên chân tường ngôi nhà.
    - *Curb (vỉa hè - y: 460 -> 485)*: Gờ đá màu xám đậm có sơn sọc vàng-đen xen kẽ đặc trưng.
    - *Road (lòng đường - y: 485 -> 600)*: Lòng đường nhựa màu đen sẫm (`0x1E293B`) với các vạch kẻ đường đứt nét màu trắng.

#### B. Tạo Hình Nhân Vật Chibi Cổ Điển (Retro Chibi Characters):
Thay thế các hình tròn đơn điệu bằng nhân vật chibi có hồn:
*   **Khuôn mặt**: Đầu hình tròn màu da (`0xFFEDD5`), mắt to tròn lấp lánh (tròng mắt đen có chấm trắng phản sáng), miệng cười hình bán nguyệt đáng yêu.
*   **Tóc & Mũ**: Vẽ tóc đen/nâu bóng mượt ôm sát đầu, đội mũ lưỡi trai hoặc nón lá Việt Nam truyền thống.
*   **Trang phục**: Thân người mặc áo thun nhiều màu sắc sặc sỡ và quần short xanh/đen cá tính.
*   **Động tác**: Chân bước bobbing nhẹ nhàng khi di chuyển và đầu lắc lư khi đứng mua hàng.

---

## 🛠️ Hướng Triển Khai Kỹ Thuật (Tham Khảo)

1.  **Backend**:
    - Mở rộng bảng `stalls` để hỗ trợ lưu trữ: `assistant_type`, `location_code`, `stall_index` (cho phép một user sở hữu nhiều sạp).
    - Cập nhật API `/player/profile` trả về thông tin chi tiết của sạp đang kích hoạt và chi phí nâng cấp động từ `upgrade_configs`.
2.  **Frontend (PixiJS)**:
    - Tích hợp vẽ trợ lý dạng nhân vật chibi tĩnh/động đứng cạnh sạp.
    - Cập nhật thuật toán tính tọa độ các ô hàng để tự động căn chỉnh ma trận khi số ô tăng lên 7, 8, 10 ô (xếp 2 hàng ngang).
