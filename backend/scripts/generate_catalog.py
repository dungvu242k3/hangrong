import re
import os

# 100 diverse Vietnamese and global street foods from everywhere
foods_raw = [
    # Vietnamese street foods
    ("Nem chua nướng", "Nem chua nướng chín vàng thơm phức vỉa hè."),
    ("Nem lụi Huế", "Nem lụi nướng sả thơm phức chấm tương gan bùi béo."),
    ("Bánh xèo miền Tây", "Bánh xèo giòn rụm nhân tôm thịt giá đỗ thơm ngon."),
    ("Bánh khọt Vũng Tàu", "Bánh khọt nước cốt dừa béo ngậy phủ tôm tươi chấy."),
    ("Cao lầu Hội An", "Món mì cao lầu phố cổ với thịt xá xíu đậm đà."),
    ("Mì Quảng gà", "Mì Quảng sợi vàng dai ngon chan nước lèo đậm đà."),
    ("Hủ tiếu gõ", "Bát hủ tiếu gõ bình dân vỉa hè nghi ngút khói."),
    ("Phở cuốn Hà Nội", "Phở cuốn thịt bò rau thơm thanh mát chấm mắm tỏi."),
    ("Bún đậu mắm tôm", "Mẹt bún đậu mắm tôm thơm nồng chuẩn vị cố đô."),
    ("Bún chả Hà Nội", "Bún chả nướng than hoa thơm ngon đượm mùi phố cổ."),
    ("Bún riêu cua đồng", "Bún riêu cua nước dùng chua thanh vị giấm bỗng."),
    ("Bún ốc nguội", "Món bún ốc cổ truyền thanh mát thanh nhã Hà Nội."),
    ("Bánh mì sốt vang", "Bánh mì giòn nóng chấm nước bò sốt vang đậm đà."),
    ("Bánh tráng sốt me", "Bánh tráng cuốn chua ngọt kích thích vị giác."),
    ("Chả rươi Hà Nội", "Chả rươi béo ngậy thơm mùi vỏ quýt mùa thu."),
    ("Bánh giò nóng", "Bánh giò nhân thịt mộc nhĩ nóng hổi ăn kèm giò lụa."),
    ("Xôi lòng phố cổ", "Món xôi nếp ăn kèm lòng non, dồi nướng thơm phức."),
    ("Cháo sườn sụn", "Cháo sườn xay nhuyễn mịn, sườn sụn giòn sần sật."),
    ("Trứng lộn ngải cứu", "Trứng vịt lộn hầm lá ngải cứu ấm nóng bổ dưỡng."),
    ("Ốc luộc lá chanh", "Ốc vặn luộc xả lá chanh giòn sần sật chấm mắm gừng."),
    ("Ốc xào me dừa", "Ốc len xào me chua ngọt béo ngậy vị cốt dừa."),
    ("Sò lông mỡ hành", "Sò lông nướng mỡ hành lạc rang giòn bùi thơm phức."),
    ("Cút lộn xào me", "Trứng cút lộn sốt me chua ngọt đậm đà vỉa hè."),
    ("Bánh tôm Hồ Tây", "Bánh tôm giòn rụm với tôm nguyên vỏ ngọt thịt."),
    ("Nem nướng Nha Trang", "Nem nướng cuốn bánh tráng ram giòn chấm nước sốt sệt."),
    ("Cơm cháy kho quẹt", "Cơm cháy giòn rụm chấm kho quẹt tôm thịt ba chỉ."),
    ("Bánh đập hến xào", "Bánh đập giòn rụm ăn cùng hến xào sả ớt đậm đà."),
    ("Gỏi cuốn tôm thịt", "Gỏi cuốn thanh mát với nước chấm tương đen đậu phộng."),
    ("Gỏi ba khía miền Tây", "Gỏi ba khía trộn chua cay đượm vị sông nước."),
    ("Chè trôi nước", "Chè trôi nước gừng ngọt ngào ấm áp ngày đông."),
    ("Chè khúc bạch", "Chè khúc bạch thanh mát, khúc bạch bùi béo hạnh nhân."),
    ("Sữa chua dẻo", "Sữa chua dẻo cắt miếng mịn màng mát lạnh."),
    ("Hoa quả dầm phố cổ", "Mẹt hoa quả dầm sữa đặc mát lạnh giải nhiệt ngày hè."),
    ("Tào phớ caramen", "Tào phớ mềm mịn quyện cùng caramen ngọt ngào."),
    ("Thạch đen Tràng Định", "Thạch đen sương sáo dai giòn thanh mát giải nhiệt."),
    ("Bánh chín tầng mây", "Bánh chín tầng mây dai dẻo nhiều màu sắc tuổi thơ."),
    ("Kem dừa Côn Đảo", "Kem dừa béo ngậy đựng trong gáo dừa xiêm mát lạnh."),
    ("Cà phê trứng Hà Nội", "Ly cà phê kem trứng béo ngậy thơm lừng phố cổ."),
    ("Trà tắc khổng lồ", "Ly trà tắc khổng lồ mát lạnh giải nhiệt mùa hè."),
    ("Trà sen Tây Hồ", "Trà sen Tây Hồ thơm thanh tao đượm vị truyền thống."),
    ("Nước sâm dứa", "Nước sâm dứa mát lành giải khát vỉa hè thanh mát."),
    ("Sinh tố mãng cầu", "Sinh tố mãng cầu chua ngọt mát lạnh bổ dưỡng."),
    ("Chè thái sầu riêng", "Chè thái sầu riêng thơm nồng nàn béo ngậy cốt dừa."),
    ("Rau má đậu xanh", "Nước rau má mát lành quyện đậu xanh bùi béo."),
    ("Bột lọc bọc heo quay", "Chè bột lọc bọc heo quay độc đáo mặn ngọt kết hợp."),
    ("Bánh ít lá gai", "Bánh ít lá gai dẻo thơm ngọt ngào đậm vị quê hương."),
    ("Bánh căn Đà Lạt", "Bánh căn nướng giòn rụm kèm xíu mại nước dùng hành."),
    ("Bánh tráng nướng", "Bánh tráng nướng trứng hành khô giòn rụm vỉa hè."),
    ("Bò bía ngọt tuổi thơ", "Thanh bò bía ngọt giòn giòn ngọt ngào của tuổi thơ."),
    ("Kẹo mạch nha dừa", "Mạch nha kéo dẻo kẹp bánh tráng giòn ngậy vị dừa."),
    ("Kem ống vỉa hè", "Que kem ống mát lạnh đủ vị sắc màu tuổi thơ."),
    # Global street foods from everywhere
    ("Takoyaki bạch tuộc", "Bánh bạch tuộc Takoyaki Osaka phủ cá bào thơm ngon."),
    ("Sushi cuộn Cali", "Sushi cuộn bơ tôm trứng cua chấm nước tương wasabi."),
    ("Tempura giòn rụm", "Tôm và rau củ chiên xù kiểu Nhật giòn tan ngọt thịt."),
    ("Gà rán sốt cay Hàn", "Gà chiên giòn rụm quyện nước sốt cay ngọt Hàn Quốc."),
    ("Bánh gạo Tokbokki", "Bánh gạo Tokbokki cay nồng sốt ớt đỏ chói Hàn Quốc."),
    ("Kimbap chiên giòn", "Kimbap cuộn rong biển chiên xù giòn bùi thơm phức."),
    ("Cơm trộn Bibimbap", "Cơm trộn Bibimbap đầy ắp rau củ thịt bò sốt ớt."),
    ("Gà Teriyaki xiên", "Thịt gà xiên nướng sốt tương ngọt kiểu Nhật Bản."),
    ("Hotdog phô mai kéo", "Hotdog phô mai kéo sợi giòn rụm vỉa hè Hàn Quốc."),
    ("Dimsum tôm hấp", "Bánh xếp tôm há cảo dimsum vỏ mỏng dai ngọt thịt."),
    ("Há cảo hấp nóng", "Há cảo nhân thịt mộc nhĩ nóng hổi xửng hấp nghi ngút khói."),
    ("Bánh bao xá xíu", "Bánh bao nhân thịt xá xíu ngọt mặn mềm xốp."),
    ("Vịt quay Bắc Kinh", "Vịt quay Bắc Kinh da giòn bóng bẩy cuốn bánh tráng."),
    ("Mì ramen bò cay", "Mì Ramen nước súp xương hầm đậm đà cay nồng vị Nhật."),
    ("Mì Udon xá xíu", "Mì Udon sợi to tròn dai ngon ăn kèm thịt xá xíu."),
    ("Pad Thái tôm tươi", "Mì xào Pad Thái tôm trứng chua ngọt kiểu Thái Lan."),
    ("Súp Tom Yum hải sản", "Súp Tom Yum chua cay đậm đà cốt dừa sả chanh."),
    ("Som Tum đu đủ", "Nộm đu đủ ba khía chua cay nồng nàn Thái Lan."),
    ("Xôi xoài Thái Lan", "Xôi nếp dẻo thơm quyện xoài chín ngọt lịm cốt dừa."),
    ("Kebab bò Thổ Nhĩ Kỳ", "Bánh mì Doner Kebab bò nướng kẹp salad thơm ngon."),
    ("Pizza mini Ý", "Bánh pizza cỡ nhỏ đế giòn phủ phô mai kéo sợi."),
    ("Pasta sốt bò băm", "Mì Ý sốt bò băm cà chua thơm ngon đậm đà thảo mộc."),
    ("Taco bò băm Mexico", "Bánh Taco vỏ giòn kẹp thịt bò băm và sốt salsa."),
    ("Nachos phô mai", "Bánh ngô Nachos giòn tan rưới sốt phô mai ấm nóng."),
    ("Quesadilla phô mai", "Bánh kếp Mexico kẹp thịt gà phô mai áp chảo."),
    ("Hamburger bò Mỹ", "Hamburger bò nướng mọng nước phô mai cheddar cổ điển."),
    ("Khoai tây chiên lắc", "Khoai tây chiên giòn tan lắc bột phô mai mặn ngọt."),
    ("Churros phủ đường", "Bánh quẩy Tây Ban Nha Churros chiên giòn phủ bột quế."),
    ("Croissant bơ tỏi", "Bánh sừng bò ngàn lớp thơm phức xốt bơ tỏi."),
    ("Crepe dâu tây Pháp", "Bánh kếp Crepe Pháp mềm mịn gói dâu tây tươi và kem."),
    ("Egg Tart trứng nướng", "Bánh tart trứng nướng Macao vỏ ngàn lớp béo ngậy."),
    ("Mochi trà xanh", "Bánh mochi dẻo mềm nhân kem trà xanh mát lạnh."),
    ("Cheesecake nướng", "Bánh phô mai nướng Nhật Bản mềm xốp như bông tuyết."),
    ("Chong chóng tuổi thơ", "Chong chóng nhựa xoay tít đùa nghịch ngày lộng gió."),
    ("Bóng bay sắc màu", "Bóng bay khí heli lơ lửng sặc sỡ màu sắc trẻ thơ."),
    ("Diều sáo tre cổ truyền", "Diều sáo tre thả gió mang âm thanh vi vu đồng nội."),
    ("Con quay gỗ cổ truyền", "Con quay gỗ tiện tròn quay tít cùng sợi dây dù."),
    ("Kẹo kéo tuổi thơ", "Kẹo kéo kéo dẻo trắng ngần giòn rụm hạt lạc rang."),
    ("Nước sâm mía lau", "Nước sâm mía lau cỏ ngọt thanh mát bổ dưỡng cơ thể."),
    ("Tào phớ thạch găng", "Tào phớ thạch găng thanh mát giòn dẻo xanh rêu."),
    ("Kem Tràng Tiền", "Que kem Tràng Tiền đậu xanh cốm dừa đặc sản thủ đô."),
    ("Bánh mì que Hải Phòng", "Bánh mì que nhỏ xinh giòn rụm quét pate béo cay."),
    ("Nem chua chua ngọt", "Nem chua rán chua ngọt tỏi ớt đặc sản xứ thanh."),
    ("Chân gà sả tắc", "Chân gà ngâm sả ớt tắc giòn sần sật mồi nhậu cực đã."),
    ("Bánh chuối chiên giòn", "Bánh chuối chiên giòn rụm ngập dầu béo ngậy ngọt lịm."),
    ("Bánh khoai nướng", "Bánh khoai nướng mật dẻo ngọt thơm lừng buổi chiều."),
    ("Ngô cay vỉa hè", "Hạt ngô cay giòn tan mặn ngọt nhâm nhi chém gió."),
    ("Nước râu ngô mát", "Nước râu ngô luộc thanh nhiệt giải độc ngày nóng."),
    ("Kem xôi dừa Thái", "Kem xôi nếp dẻo thơm ngậy kem dừa rắc dừa khô.")
]

# Ensure we have exactly 100 foods
while len(foods_raw) < 100:
    foods_raw.append((f"Món ngon số {len(foods_raw)+1}", f"Khám phá ẩm thực đường phố độc đáo mới lạ số {len(foods_raw)+1}."))
foods_raw = foods_raw[:100]

# Pre-defined mapping lists
food_emojis = ["🍲", "🍜", "🍛", "🍚", "🥟", "🍢", "🍣", "🍱", "🥪", "🌭", "🍔", "🍟", "🍕", "🌮", "🌯", "🍳", "🥩", "bento", "lollipop", "ramen", "bowl"]
drink_emojis = ["🥛", "🥤", "🍵", "☕", "🍺", "🍹", "wine", "glass"]
toy_emojis = ["🧸", "toy-brick"]

def remove_accents(input_str):
    s1 = u'ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠạẢảẤấẦầẨẩẪẫẬậẮắẰằẲẳẴẵẬcheckẬỆệỈỉỊịỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợỤụỦủỨứỪừỬửỮữỰựỲỳỶỷỸỹỴỵ'
    s0 = u'AAAAEEEIIOOOOUUYaaaaeeeiioooouuyAaDdIiUuOoUuAaAaAaAaAaAaAaAaAaAaAaAacheckAeIeIiIiOoOoOoOoOoOoOoOoOoOoOoOoUuUuUuUuUuUuUuYyYyYyYy'
    s = ""
    for c in input_str:
        if c in s1:
            s += s0[s1.index(c)]
        else:
            s += c
    return s

def make_code(name):
    clean = remove_accents(name).upper()
    clean = re.sub(r'[^A-Z0-9\s_]', '', clean)
    clean = re.sub(r'\s+', '_', clean)
    return clean

# Generate products list
generated_products = []
for i, (name, desc) in enumerate(foods_raw):
    code = make_code(name)
    
    # Classify product category
    lower_name = name.lower()
    if any(k in lower_name for k in ["nước", "trà", "sâm", "sinh tố", "sữa", "đá", "chè", "sấu", "café", "cà phê", "bia"]):
        category = "drink"
    elif any(k in lower_name for k in ["đồ chơi", "tò he", "chong chóng", "bóng", "diều", "con quay"]):
        category = "toy"
    else:
        category = "food"
        
    # Spaced unlocks up to level 300
    level_required = 10 + int(i * 2.9)
    
    # Economics: progressive pricing
    import_price = 500 + 150 * i
    sell_price = import_price + 120 + 80 * i
    
    # Short waiting durations (max 330s = 5.5 min)
    duration = 30 + 3 * i
    
    # Assign icons
    if "bún" in lower_name or "phở" in lower_name or "mì" in lower_name or "hủ tiếu" in lower_name or "súp" in lower_name or "cháo" in lower_name:
        icon = "ramen"
        emoji = "🍜"
        color = "bg-red-100 border-red-300 text-red-800"
    elif "bánh" in lower_name or "xôi" in lower_name or "cơm" in lower_name:
        icon = "bowl"
        emoji = "🍚"
        color = "bg-amber-100 border-amber-300 text-amber-800"
    elif "nem" in lower_name or "chả" in lower_name or "xúc xích" in lower_name or "thịt" in lower_name or "ốc" in lower_name or "sò" in lower_name or "gà" in lower_name or "bò" in lower_name:
        icon = "bento"
        emoji = "🍡"
        color = "bg-rose-100 border-rose-300 text-rose-800"
    elif "kem" in lower_name or "sữa chua" in lower_name or "chè" in lower_name or "dẻo" in lower_name or "thạch" in lower_name or "yogurt" in lower_name:
        icon = "wine" # mapped as indigo/yogurt-like
        emoji = "🥛"
        color = "bg-indigo-100 border-indigo-300 text-indigo-800"
    elif category == "drink":
        icon = "glass"
        emoji = "🥤"
        color = "bg-green-100 border-green-300 text-green-800"
    elif category == "toy":
        icon = "toy-brick"
        emoji = "🧸"
        color = "bg-emerald-100 border-emerald-300 text-emerald-800"
    else:
        icon = "bento"
        emoji = "🍡"
        color = "bg-rose-100 border-rose-300 text-rose-800"
        
    generated_products.append({
        "code": code,
        "name": name,
        "category": category,
        "unlock_level": level_required,
        "import_price": import_price,
        "sell_price": sell_price,
        "import_duration_seconds": duration,
        "base_sell_duration_seconds": duration,
        "icon_name": icon,
        "color": color,
        "emoji": emoji,
        "description": desc
    })

# Write SQL up migration
sql_up_path = "backend/migrations/000010_hundred_products.up.sql"
with open(sql_up_path, "w", encoding="utf-8") as f:
    f.write("ALTER TABLE products ALTER COLUMN color TYPE VARCHAR(64);\n\n")
    f.write("INSERT INTO products\n")
    f.write("  (code, name, category, unlock_level, import_price, sell_price, import_duration_seconds, base_sell_duration_seconds, icon_name, color)\n")
    f.write("VALUES\n")
    values_list = []
    for p in generated_products:
        val = f"  ('{p['code']}', '{p['name']}', '{p['category']}', {p['unlock_level']}, {p['import_price']}, {p['sell_price']}, {p['import_duration_seconds']}, {p['base_sell_duration_seconds']}, '{p['icon_name']}', '{p['color']}')"
        values_list.append(val)
    f.write(",\n".join(values_list))
    f.write("\nON CONFLICT (code) DO NOTHING;\n")

# Write SQL down migration
sql_down_path = "backend/migrations/000010_hundred_products.down.sql"
with open(sql_down_path, "w", encoding="utf-8") as f:
    codes = ", ".join(f"'{p['code']}'" for p in generated_products)
    f.write(f"DELETE FROM products WHERE code IN ({codes});\n")

print(f"Generated migrations: {sql_up_path} and {sql_down_path}")
