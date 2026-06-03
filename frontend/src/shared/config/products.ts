// =============================================================================
// products.ts — Configuration file containing static metadata for Hàng Rong products
// Maps backend iconNames/IDs to emojis, Tailwind CSS color classes, and descriptions.
// =============================================================================

export interface ProductVisual {
  emoji: string;
  colorClass: string;
  description: string;
}

export const PRODUCTS_CONFIG: Record<string, ProductVisual> = {
  // Bánh Mì
  "sandwich": {
    emoji: "🥖",
    colorClass: "bg-amber-100 border-amber-300 text-amber-800",
    description: "Bánh mì đặc sản pate gan siêu thơm bơ, món đắt khách nhất vỉa hè.",
  },
  // Trà Đá
  "cup-soda": {
    emoji: "🍵",
    colorClass: "bg-teal-100 border-teal-300 text-teal-800",
    description: "Cốc trà đá giải nhiệt ngày hè nóng bức, xoá tan cơn khát tức thì.",
  },
  // Hướng Dương
  "flower": {
    emoji: "🌻",
    colorClass: "bg-yellow-100 border-yellow-300 text-yellow-800",
    description: "Hạt hướng dương rang chín thơm giòn, món ăn vặt không thể thiếu khi chém gió trà đá.",
  },
  // Bánh Cuốn
  "scroll": {
    emoji: "🌯",
    colorClass: "bg-indigo-100 border-indigo-300 text-indigo-800",
    description: "Bánh cuốn tráng mỏng, nhân mộc nhĩ thịt băm nóng hổi chấm nước mắm chua ngọt đặc trưng.",
  },
  // Tàu Hũ / Tào Phớ
  "soup": {
    emoji: "🥣",
    colorClass: "bg-rose-100 border-rose-300 text-rose-800",
    description: "Tào phớ thanh mát ngọt dịu, hòa quyện cùng nước đường gừng ấm nồng và thạch đen dai giòn.",
  },
  // Tò He
  "toy-brick": {
    emoji: "🧸",
    colorClass: "bg-emerald-100 border-emerald-300 text-emerald-800",
    description: "Tò he đất nặn dân gian tạo hình các con vật và nhân vật cổ tích ngộ nghĩnh, sặc sỡ sắc màu.",
  },
  // Nem Chua Rán
  "bento": {
    emoji: "🍡",
    colorClass: "bg-rose-100 border-rose-300 text-rose-800",
    description: "Nem chua rán giòn rụm nóng hổi, món ăn vặt quốc dân của giới trẻ Phố Cổ.",
  },
  // Sữa chua nếp cẩm
  "wine": {
    emoji: "🥛",
    colorClass: "bg-indigo-100 border-indigo-300 text-indigo-800",
    description: "Sữa chua nếp cẩm dẻo ngọt bùi béo, sự kết hợp tuyệt vời của gạo nếp điện biên.",
  },
  // Xôi xéo
  "bowl": {
    emoji: "🍚",
    colorClass: "bg-amber-100 border-amber-300 text-amber-800",
    description: "Xôi xéo vàng rượm, thơm nức hành phi, phủ lớp đậu xanh giã nhuyễn ấm lòng buổi sáng.",
  },
  // Sấu đá
  "glass": {
    emoji: "🥤",
    colorClass: "bg-green-100 border-green-300 text-green-800",
    description: "Nước sấu đá chua ngọt thanh mát, quả sấu giòn sần sật đặc sản mùa hè Hà Nội.",
  },
  // Bắp nướng
  "lollipop": {
    emoji: "🌽",
    colorClass: "bg-yellow-100 border-yellow-300 text-yellow-800",
    description: "Bắp nướng rưới mỡ hành thơm phức, hạt bắp dẻo ngọt cháy cạnh thơm lừng.",
  },
  // Phở Gánh
  "ramen": {
    emoji: "🍜",
    colorClass: "bg-red-100 border-red-300 text-red-800",
    description: "Bát phở gánh Hà Nội nóng hổi nghi ngút khói, nước dùng thanh ngọt đậm đà xưa cũ.",
  },
};

export const FALLBACK_PRODUCT_VISUAL: ProductVisual = {
  emoji: "📦",
  colorClass: "bg-slate-100 border-slate-300 text-slate-800",
  description: "Nguyên liệu buôn bán đường phố thơm ngon, chất lượng.",
};
