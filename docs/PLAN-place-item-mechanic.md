# Project Plan - Item Placement Mechanism Explanation

This document details the end-to-end mechanism of how an item is placed onto an empty slot in the Hàng Rong application, covering the database, API, React state, and PixiJS canvas.

## End-to-End Placement Flow

```mermaid
sequenceDiagram
    participant User as Người dùng
    participant Canvas as PixiJS Canvas
    participant React as React (StallPage)
    participant API as Go Backend API
    participant DB as PostgreSQL Database

    User->>Canvas: Click vào ô sạp trống
    Canvas->>React: Phát sự kiện "game:slot_clicked" (slotId, isEmpty=true)
    React->>User: Mở Bottom Sheet danh sách Kho đồ
    User->>React: Chọn Bánh Mì hoặc Trà Đá
    React->>API: Gọi POST /selling/slots/:slotId/place (productId)
    Note over API,DB: Kiểm tra quyền sở hữu & Kho đồ
    API->>DB: Trừ 1 số lượng vật phẩm trong Kho
    API->>DB: Cập nhật ô sạp (productId, thời gian đếm ngược)
    API-->>React: Trả về dữ liệu ô sạp đã cập nhật
    React->>Canvas: Phát sự kiện "react:place_product"
    Canvas->>User: Vẽ hình đồ ăn (emoji) & chạy đếm ngược vòng tròn xanh
```

---

## Technical Details

### 1. Database Schema
*   **Inventory (Kho đồ)**: Tracks `quantity` of each item. Decrements by 1 when placed.
*   **Stall Slots (Ô sạp)**: Stores `productId`, `productName`, `productIcon`, `totalTime`, and `timeRemaining`.

### 2. Frontend React Mutation
*   Located in `useStall.ts` -> `placeProductMutation`.
*   Triggers API call and invalidates React Query cache (`"stallSlots"` & `"inventory"`) to refresh inventory quantities.

### 3. PixiJS Canvas Rendering
*   Located in `StallScene.ts` -> `placeProduct` method.
*   Clears the empty `"TRỐNG"` label and draws the product emoji with a soft orange outline.
*   Starts the tick loop to animate the green progress border arc as `timeRemaining` decrements.
