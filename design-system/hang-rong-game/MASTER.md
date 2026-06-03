# Design System Master - Hang Rong Game (UI-UX Pro Max Standard)

> **LOGIC:** When building a specific page, first check `design-system/hang-rong-game/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Hang Rong Game
**Style Fusion:** Retro-Futuristic Vietnamese Street Chibi
**Global Mood:** Casual, warm, nostalgic, friendly, highly interactive, premium gaming vibe

---

## 🎨 Global Design Tokens

### Color Palette

| Role | Hex | CSS Variable | Usage / Real-world Application |
| :--- | :--- | :--- | :--- |
| **Primary** | `#3B82F6` | `--color-primary` | Main branding, active borders, info badges |
| **Secondary** | `#60A5FA` | `--color-secondary` | Subtle active states, tab borders, auxiliary text |
| **CTA / Warm Accent** | `#F97316` | `--color-cta` | Primary actions (Bày bán, Nâng cấp), warm wood sạp sấy |
| **Background** | `#F8FAFC` | `--color-background` | Creamy warm white/beige, avoiding cold clinical grays |
| **Text Main** | `#1E293B` | `--color-text` | Deep brown/charcoal, high readability on small mobile screens |
| **Coin Gold** | `#EAB308` | `--color-coin` | Glowing yellow/gold for harvestable coin states |
| **Gem Emerald** | `#10B981` | `--color-gem` | Emerald green for premium currency, level-up milestones |

### Typography

- **Heading Font:** `Caveat` (Font chữ viết tay phong cách hoài cổ, dùng cho tiêu đề lớn, sạp hàng, bảng hiệu, level banner).
- **Body Font:** `Quicksand` (Font sans-serif bo tròn góc cực kỳ dễ chịu, dùng cho chỉ số, mô tả món ăn, nút bấm, hội thoại).
- **Google Fonts Connection:**
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Quicksand:wght@300;400;500;600;700&display=swap');
  ```
- **Global CSS Utility:**
  ```css
  h1, h2, h3, .heading-retro {
    font-family: 'Caveat', cursive;
  }
  body, button, input, .body-rounded {
    font-family: 'Quicksand', sans-serif;
  }
  ```

### Spacing Variables

| Token | Value | Tailwind equivalent | Usage |
| :--- | :--- | :--- | :--- |
| `--space-xs` | `4px` / `0.25rem` | `gap-1` | Tight spaces, item numbers inside badges |
| `--space-sm` | `8px` / `0.5rem` | `gap-2` | Icon-to-text spacing, small button padding |
| `--space-md` | `16px` / `1rem` | `p-4`, `gap-4` | Standard page padding, grid item gaps |
| `--space-lg` | `24px` / `1.5rem` | `p-6` | Inside modals, sections spacing |
| `--space-xl` | `32px` / `2rem` | `p-8` | Outer margins of desktop containers |

### Shadow Depths & Retro Glow

| Level | Value | CSS glow | Usage |
| :--- | :--- | :--- | :--- |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | None | Base cards |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.08)` | `0 0 10px rgba(249, 115, 22, 0.1)` | Hoverable cards, active buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | `0 0 15px rgba(59, 130, 246, 0.2)` | Modals, bottom sheets |
| `--glow-coin` | `0 0 20px rgba(234, 179, 8, 0.6)` | Soft yellow radial aura | Harvestable coin containers |

---

## 💎 Component Specifications (CSS & Tailwind Classes)

### Buttons (Touch Target >= 44px)

```css
/* Primary Button (Nút hành động chính - màu cam sạp gỗ) */
.btn-primary {
  @apply bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2;
  min-height: 44px;
}

/* Secondary Button (Nút phụ - màu xanh neon dịu) */
.btn-secondary {
  @apply border-2 border-[#3B82F6] hover:bg-[#3B82F6]/10 text-[#3B82F6] font-semibold py-3 px-6 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-2;
  min-height: 44px;
}
```

### Cards & Grid Items

```css
/* Card hiển thị sản phẩm hoặc thông tin sạp */
.card-retro {
  @apply bg-white border-2 border-[#1E293B]/10 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5;
}

.card-retro-active {
  @apply border-[#F97316] bg-[#F97316]/5 shadow-md;
}
```

### Modals & Bottom Sheets (Glassmorphic look)

```css
/* Modal bọc ngoài với lớp blur */
.modal-overlay {
  @apply fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4;
}

/* Modal box - White ngà tinh tế */
.modal-box {
  @apply bg-[#F8FAFC] border-2 border-[#1E293B]/15 rounded-3xl p-6 shadow-xl max-w-md w-full relative;
}

/* Bottom Sheet chuyên dụng cho mobile */
.bottom-sheet {
  @apply fixed bottom-0 left-0 right-0 bg-[#F8FAFC] border-t-4 border-[#F97316] rounded-t-3xl p-6 shadow-2xl z-50 transition-transform duration-300 transform-gpu;
}
```

### Retro Effects (Hiệu ứng Game đặc trưng)

```css
/* Lớp phủ CRT Scanline cho khung Canvas PixiJS */
.crt-overlay {
  position: relative;
  overflow: hidden;
}
.crt-overlay::before {
  content: " ";
  display: block;
  position: absolute;
  top: 0; left: 0; bottom: 0; right: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.12) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
  z-index: 10;
  background-size: 100% 4px, 6px 100%;
  pointer-events: none;
}
```

---

## 🚫 Anti-Patterns (Do NOT Use)

Tuyệt đối tránh các lỗi thiết kế sau để giao diện luôn đạt tiêu chuẩn chuyên nghiệp:
- ❌ ** emojis làm icon**: Sử dụng SVG từ Lucide React để tạo sự nhất quán, chỉ dùng icon pixel/vẽ tay đặc thù khi có file ảnh WebP chuyên dụng.
- ❌ **Hovers làm xê dịch layout**: Nghiêm cấm dùng hover thay đổi kích thước border hoặc padding. Hãy dùng `transition-all duration-200` và đổi shadow/border color nhẹ nhàng.
- ❌ **Chữ mờ trên nền sáng**: Đảm bảo tất cả text có độ tương phản tối thiểu **4.5:1** so với nền. Không dùng text màu xám nhạt (`gray-400` trở xuống) làm body text chính.
- ❌ **Trạng thái đổi màu thô bạo**: Tránh thay đổi màu background/border mà không có hiệu ứng chuyển đổi mượt (`transition-colors duration-200`).
- ❌ **Nút di động quá bé**: Vùng nhấn di động nhỏ hơn `44px` sẽ gây ức chế cho người chơi.

---

## 🏁 Pre-Delivery Checklist

Trước khi bàn giao hoặc đưa mã nguồn UI vào production, kiểm tra kỹ:
- [ ] 100% icon sử dụng SVG đồng nhất của **Lucide React**.
- [ ] Tất cả các component tương tác được đều sở hữu thuộc tính `cursor-pointer`.
- [ ] Không có hiệu ứng transform scale gây xê dịch cấu trúc layout.
- [ ] Độ tương phản màu chữ đạt chuẩn tối thiểu 4.5:1.
- [ ] Giao diện responsive không lỗi giật ở kích thước di động 375px, 768px và desktop 1440px.
- [ ] Không có nội dung bị đè dưới thanh Bottom Navigation cố định hoặc Top Bar.
