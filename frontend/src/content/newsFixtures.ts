import { ApiNewsDetail } from '../types/api';

const NOW = Date.now();
const hoursAgo = (h: number) => new Date(NOW - h * 3600 * 1000).toISOString();
const daysAgo = (d: number) => new Date(NOW - d * 24 * 3600 * 1000).toISOString();

export const sampleAnnouncement = 'Thông báo: Tuyến khám phá di sản trung tâm Quận 1 cập nhật thêm thông tin và câu chuyện mới phục vụ du khách.';

export const newsArticles: ApiNewsDetail[] = [
  // 1. Điểm đến (5 bài)
  {
    id: 'news-1',
    slug: 'dinh-doc-lap-nhung-can-phong-it-nguoi-de-y',
    title: 'Dinh Độc Lập: Những căn phòng và dấu ấn lịch sử ít người để ý',
    category: 'diem-den',
    summary: 'Ngoài phòng Khánh tiết và chiếc xe tăng lịch sử ngoài sân, Dinh Độc Lập còn nhiều góc độc đáo: phòng chiếu phim thập niên 60, khu hầm chỉ huy và sân thượng ngắm trọn đại lộ.',
    coverImageUrl: '/pois/dinh-doc-lap.jpg',
    coverImageAlt: 'Mặt tiền Dinh Độc Lập nhìn từ bãi cỏ trung tâm',
    imageCredit: 'Echora Studio',
    publishedAt: hoursAgo(3), // Within 24h -> isNew = true
    readingMinutes: 4,
    audioUrl: null,
    relatedPoiSlugs: ['dinh-doc-lap'],
    content: `Dinh Độc Lập là một trong những công trình kiến trúc tiêu biểu nhất của Thành phố Hồ Chí Minh, nơi ghi dấu những mốc son lịch sử trọng đại của dân tộc. Đa số du khách đến đây thường chú ý đến phòng Khánh tiết lộng lẫy hay hai chiếc xe tăng ngoài bãi cỏ, nhưng tòa dinh thự này còn ẩn chứa rất nhiều chi tiết thú vị.

### Công trình kiến trúc hòa quyện Đông - Tây
Dinh bạn chiêm ngưỡng hôm nay được khởi công xây dựng vào ngày 1/7/1962 và khánh thành ngày 31/10/1966, theo đồ án thiết kế của kiến trúc sư Ngô Viết Thụ – người Việt Nam đầu tiên đạt giải Khôi nguyên La Mã. Toàn bộ bố cục của dinh được kiến trúc sư gửi gắm qua các triết lý phương Đông sâu sắc: mặt bằng tạo thành chữ CÁT (tốt lành), hàng rèm hoa đá mang hình đốt trúc thanh tao bao quanh mặt tiền vừa che nắng nhiệt đới vừa đón gió trời thoáng đãng.

> "Dáng dinh kết hợp nhuần nhuyễn tư tưởng triết học Á Đông với kỹ thuật bê tông hiện đại của thế kỷ 20."

### Phòng trình quốc thư trang nghiêm
Tọa lạc tại tầng hai, đây là nơi diễn ra các nghi lễ ngoại giao quan trọng. Bức tranh sơn mài khổ lớn mang tên "Bình Ngô Đại Cáo" của họa sĩ Nguyễn Văn Minh gồm 40 tấm ghép lại, kể về chiến thắng của nghĩa quân Lam Sơn, là điểm nhấn nghệ thuật vô giá của căn phòng.

### Khu hầm chỉ huy kiên cố
Xuống sâu dưới lòng đất là hệ thống đường hầm được đúc bằng bê tông cốt thép dày đặc, có thể chịu được bom lớn. Tại đây bố trí phòng tác chiến, phòng truyền tin với những chiếc máy vô tuyến điện cổ, và cả phòng nghỉ dành riêng cho tổng thống trong tình huống khẩn cấp.

- **Thời gian tham quan gợi ý:** 1.5 - 2 giờ
- **Gợi ý trải nghiệm:** Hãy dành thêm thời gian ghé thăm phòng chiếu phim nguyên bản thập niên 1960 và ngắm nhìn sân bay trực thăng trên nóc dinh.`,
  },
  {
    id: 'news-2',
    slug: 'gach-do-nha-tho-duc-ba-dieu-that-va-noi-qua',
    title: 'Nhà thờ Đức Bà Sài Gòn: Bí mật gạch trần Marseille và hành trình trùng tu',
    category: 'diem-den',
    summary: 'Sắc đỏ hồng nguyên bản của Nhà thờ Đức Bà hơn một thế kỷ qua được dệt nên từ những viên gạch Marseille không trát vữa, minh chứng cho kỹ nghệ xây dựng tinh xảo thời bấy giờ.',
    coverImageUrl: '/pois/nha-tho-duc-ba.jpg',
    coverImageAlt: 'Tháp chuông và vách gạch đỏ Nhà thờ Đức Bà Sài Gòn',
    imageCredit: 'Saigon Heritage Project',
    publishedAt: hoursAgo(8), // Within 24h -> isNew = true
    readingMinutes: 4,
    audioUrl: null,
    relatedPoiSlugs: ['nha-tho-duc-ba'],
    content: `Trải qua gần 150 năm mưa nắng nhiệt đới, Nhà thờ chính tòa Đức Bà Sài Gòn vẫn sừng sững giữa quảng trường Công xã Paris với sắc tường đỏ tươi thắm. Nhiều du khách không khỏi ngạc nhiên khi thấy những mảng tường gạch trần vẫn vẹn nguyên màu sắc mà không hề có lớp rêu phong nào bám dính.

### Những viên gạch vượt đại dương từ Marseille
Viên đá đầu tiên của nhà thờ được đặt vào ngày 7/10/1877 và công trình khánh thành ngày 11/4/1880. Toàn bộ vật liệu xây dựng, từ xi măng, sắt thép cho đến từng viên ngói, chiếc chuông đồng đều được chuyển từ Pháp sang bằng đường biển. Đặc biệt, gạch xây tường ngoài là loại gạch ép trần được sản xuất tại thành phố cảng Marseille. Bề mặt gạch đanh chắc, độ xốp cực thấp giúp chống chịu hoàn hảo với khí hậu nóng ẩm mưa nhiều của miền Nam.

### Hành trình đại trùng tu gìn giữ di sản
Công cuộc trùng tu lớn nhất từ trước đến nay đang được triển khai cẩn trọng từng ngày. Các chuyên gia bảo tồn đã cẩn thận khảo sát từng viên gạch trên hai ngọn tháp cao hơn 60 mét. Những viên gạch bị hư hại theo thời gian được thay thế bằng gạch phục chế thủ công nhập khẩu từ Đức, đảm bảo tương thích hoàn toàn về chất liệu và màu sắc với gạch gốc.

> "Bảo tồn Nhà thờ Đức Bà không chỉ là sửa chữa một công trình, mà là gìn giữ linh hồn kiến trúc và ký ức đô thị của Sài Gòn."`,
  },
  {
    id: 'news-3',
    slug: 'buu-dien-trung-tam-ben-trong-toa-nha-mang-dau-an-phap',
    title: 'Bưu điện Trung tâm Sài Gòn: Mái vòm cổ điển và hai tấm bản đồ lịch sử',
    category: 'diem-den',
    summary: 'Nằm đối diện Nhà thờ Đức Bà, Bưu điện Trung tâm mê hoặc du khách bởi trần vòm sắt uốn cong tinh xảo, những quầy điện thoại gỗ cổ kính và hai bức bản đồ lịch sử quý giá.',
    coverImageUrl: '/pois/buu-dien-trung-tam.jpg',
    coverImageAlt: 'Mặt tiền màu vàng đặc trưng của Bưu điện Trung tâm',
    imageCredit: 'Sài Gòn Phố Xưa',
    publishedAt: daysAgo(2),
    readingMinutes: 3,
    audioUrl: null,
    relatedPoiSlugs: ['buu-dien-trung-tam'],
    content: `Được xây dựng từ năm 1886 đến 1891 theo đồ án của kiến trúc sư Marie-Alfred Foulhoux, Bưu điện Trung tâm Sài Gòn mang phong cách kiến trúc Phục Hưng kết hợp hài hòa với những đường nét trang trí phương Đông.

### Không gian mái vòm như nhà ga châu Âu
Bước qua cánh cổng gỗ lớn, du khách lập tức bị ấn tượng bởi trần nhà hình vòm cung rộng thênh thang, được nâng đỡ bởi hệ thống cột sắt uốn hoa văn tinh tế. Thiết kế này tạo nên không gian thông thoáng, đón ánh sáng tự nhiên ngập tràn vào từng quầy giao dịch.

### Hai chứng tích địa lý lịch sử
Ngay hai bên tường sảnh chính là hai bức bản đồ vẽ tay khổng lồ từ cuối thế kỷ 19: một bức vẽ Sài Gòn và vùng phụ cận năm 1892, bức còn lại mô tả mạng lưới đường dây điện báo Nam Kỳ và Campuchia. Đây là những tư liệu địa lý vô cùng quý hiếm về thuở ban đầu hình thành hệ thống bưu chính viễn thông miền Nam.

- **Trải nghiệm không thể bỏ qua:** Mua một tấm bưu thiếp in hình phong cảnh Sài Gòn, dán chiếc tem truyền thống và gửi về cho bạn bè, người thân ngay tại quầy gửi thư cổ điển.`,
  },
  {
    id: 'news-4',
    slug: 'cho-ben-thanh-di-cho-nhu-nguoi-sai-gon',
    title: 'Chợ Bến Thành hơn 100 năm: Trái tim giao thương và ký ức Sài Gòn',
    category: 'diem-den',
    summary: 'Trải qua hơn một thế kỷ tồn tại, Chợ Bến Thành không chỉ là điểm giao thương sầm uất mà còn là biểu tượng văn hóa bất hủ của đô thị sông nước phương Nam.',
    coverImageUrl: '/pois/cho-ben-thanh.jpg',
    coverImageAlt: 'Tháp đồng hồ cửa Nam Chợ Bến Thành',
    imageCredit: 'Saigon Memories Project',
    publishedAt: daysAgo(3),
    readingMinutes: 4,
    audioUrl: null,
    relatedPoiSlugs: ['cho-ben-thanh'],
    content: `Hình ảnh tháp đồng hồ ba mặt ở Cửa Nam Chợ Bến Thành từ lâu đã trở thành biểu tượng nhận diện quen thuộc của Thành phố Hồ Chí Minh trên mọi ấn phẩm du lịch quốc tế.

### Ngôi chợ trăm năm tuổi
Ngôi chợ kiên cố hiện nay do hãng thầu Brossard et Maupin khởi công năm 1912 và khánh thành vào tháng 3/1914. Chợ có bốn cửa chính quay ra bốn hướng: Cửa Nam nhìn ra công trường Quách Thị Trang, Cửa Bắc hướng về đường Lê Thánh Tôn, Cửa Đông nhìn ra đường Phan Bội Châu và Cửa Tây hướng sang đường Phan Chu Trinh.

### Ẩm thực hội tụ tinh hoa ba miền
Khu vực ẩm thực bên trong chợ luôn là điểm dừng chân hấp dẫn nhất. Tại đây, bạn có thể thưởng thức đủ món ngon đặc sản: từ tô bún suông tôm đậm đà, đĩa bánh bèo xứ Huế thanh tao, ly chè ba màu ngọt mát đến đĩa cơm tấm sườn nướng thơm nức mũi.`,
  },
  {
    id: 'news-5',
    slug: 'bao-tang-chung-tich-chien-tranh-luu-y-khi-tham-quan',
    title: 'Bảo tàng Chứng tích Chiến tranh: Lưu giữ ký ức và khát vọng hòa bình',
    category: 'diem-den',
    summary: 'Một trong những bảo tàng được ghé thăm nhiều nhất Việt Nam, nơi trưng bày hàng nghìn hiện vật và bức ảnh lịch sử chân thực, truyền tải thông điệp sâu sắc về giá trị của hòa bình.',
    coverImageUrl: '/pois/bao-tang-chung-tich.jpg',
    coverImageAlt: 'Hiện vật máy bay ngoài trời tại Bảo tàng Chứng tích Chiến tranh',
    imageCredit: 'Bảo tàng Lịch sử Quân sự',
    publishedAt: daysAgo(5),
    readingMinutes: 4,
    audioUrl: null,
    relatedPoiSlugs: ['bao-tang-chung-tich-chien-tranh'],
    content: `Thành lập từ năm 1975, Bảo tàng Chứng tích Chiến tranh nằm trên đường Võ Văn Tần, Quận 3, là điểm đến xúc động thu hút hàng triệu lượt khách quốc tế và đồng bào cả nước mỗi năm.

### Những bộ sưu tập ảnh rung động lòng người
Bảo tàng lưu giữ bộ sưu tập ảnh vô giá của các phóng viên chiến trường quốc tế như Tim Page, Larry Burrows, Ishikawa Bunyo... Những thước phim tài liệu chân thực về hậu quả chiến tranh và chất độc da cam nhắc nhở mỗi chúng ta về cái giá của độc lập, tự do.

- **Thời gian tham quan:** Khoảng 2 - 3 giờ để cảm nhận trọn vẹn từng chuyên đề trưng bày.
- **Lưu ý:** Khuôn viên bảo tàng rất trang nghiêm; du khách nên giữ trật tự và chuẩn bị tâm lý đón nhận những câu chuyện lịch sử sâu lắng.`,
  },

  // 2. Văn hóa Sài Gòn (4 bài)
  {
    id: 'news-6',
    slug: 'ca-phe-vot-sai-gon-nep-song-dong-lai',
    title: 'Cà phê vợt Sài Gòn: Nếp sống khoan thai đọng lại bên bếp than đỏ lửa',
    category: 'van-hoa',
    summary: 'Không cần máy pha hiện đại, cà phê vợt níu chân người thị dân bằng làn khói mỏng từ bếp than hồng, chiếc ấm nhôm ngả màu và những mẩu chuyện ban mai không dứt.',
    coverImageUrl: '/images/home/food-ca-phe-sua-da.jpg',
    coverImageAlt: 'Cốc cà phê phin vợt truyền thống bốc khói sớm mai',
    imageCredit: 'Echora',
    publishedAt: hoursAgo(6), // Within 24h -> isNew = true
    readingMinutes: 4,
    audioUrl: null,
    relatedPoiSlugs: ['buu-dien-trung-tam'],
    content: `Giữa nhịp sống hối hả của một đại đô thị năng động, những quán cà phê vợt ở hẻm Phan Đình Phùng (Phú Nhuận) hay đường Phùng Hưng (Quận 5) vẫn đều đặn đỏ lửa từ 4 giờ sáng mỗi ngày suốt hơn nửa thế kỷ qua.

### Chiếc vợt vải và bí quyết giữ trọn hương cà phê
Cà phê xay mịn được cho vào chiếc vợt vải thau dài, nhúng ngập trong nước sôi ùng ục trên bếp than đượm. Nước cà phê đầu được ủ trong ấm đất nung để giữ hương thơm nồng nàn, rồi rót qua lại nhiều lần cho vị đượm sánh. Ly cà phê sữa đá pha vợt ngọt ngào, thơm béo đặc trưng của sữa đặc và thoang thoảng mùi khói bếp xưa cũ.

> "Uống cà phê vợt không chỉ là thưởng thức một thức uống, mà là đắm mình vào một nếp sinh hoạt cộng đồng đã ngấm vào máu thịt người Sài Gòn."`,
  },
  {
    id: 'news-7',
    slug: 'am-vang-don-ca-tai-tu-giua-long-do-thi',
    title: 'Đờn ca tài tử Nam Bộ: Giai điệu tri âm mộc mạc giữa nhịp sống phố thị Sài Gòn',
    category: 'van-hoa',
    summary: 'Giữa lòng phố thị phồn hoa, những tiếng đờn kìm, đờn tranh và điệu lý mộc mạc vẫn ngân vang bên bờ kênh, nuôi dưỡng tâm hồn hào sảng của người phương Nam.',
    coverImageUrl: '/images/news/dan-tranh.jpg',
    coverImageAlt: 'Đàn tranh – nhạc cụ truyền thống trong Đờn ca tài tử',
    imageCredit: 'Wikimedia Commons',
    publishedAt: daysAgo(4),
    readingMinutes: 5,
    audioUrl: null,
    relatedPoiSlugs: ['dinh-doc-lap'],
    content: `Được UNESCO vinh danh là Di sản văn hóa phi vật thể của nhân loại, Đờn ca tài tử Nam Bộ bắt nguồn từ dòng nhạc cung đình Huế kết hợp với điệu hò, câu hát dân gian mộc mạc của cư dân khai khẩn vùng đất phương Nam.

Tại Sài Gòn - TP.HCM, các câu lạc bộ tài tử tại Nhà văn hóa Thanh Niên hay dọc bến thuyền Nhiêu Lộc - Thị Nghè vào mỗi dịp cuối tuần là điểm hẹn tri âm của những tâm hồn yêu nghệ thuật dân tộc. Lắng nghe khúc Dạ cổ hoài lang trong làn gió chiều mát rượi, du khách sẽ hiểu hơn nét phong lưu, nghĩa tình của con người vùng đất này.`,
  },
  {
    id: 'news-8',
    slug: 'ao-dai-ao-ba-ba-hon-cot-trang-phuc-phuong-nam',
    title: 'Tà Áo dài và Áo bà ba: Hồn cốt trang phục phương Nam qua bao mùa phố',
    category: 'van-hoa',
    summary: 'Từ tà áo dài lụa thướt tha dạo bước bên Nhà hát Thành phố đến chiếc áo bà ba mộc mạc bên bến sông, trang phục truyền thống luôn tôn vinh vẻ đẹp dịu dàng của người phụ nữ Việt.',
    coverImageUrl: '/images/home/costume-ao-dai.jpg',
    coverImageAlt: 'Thiếu nữ trong tà áo dài truyền thống',
    imageCredit: 'Echora',
    publishedAt: daysAgo(5),
    readingMinutes: 4,
    audioUrl: null,
    relatedPoiSlugs: ['cho-ben-thanh'],
    content: `Trang phục truyền thống Sài Gòn gắn liền với hai biểu tượng văn hóa đặc sắc: tà Áo dài kiêu sa và chiếc Áo bà ba chân chất.

### Áo dài Sài Gòn qua các thời kỳ
Những năm 1960, chiếc áo dài Lemur rồi áo dài Raglan và áo dài chít eo ra đời tại Sài Gòn đã tạo nên cuộc cách mạng tôn vinh vóc dáng thanh mảnh của phụ nữ đô thị. Hôm nay, Lễ hội Áo dài thường niên tổ chức trên phố đi bộ Nguyễn Huệ tiếp tục khẳng định sức sống mãnh liệt của di sản này trong dòng chảy đương đại.

### Áo bà ba – nét mộc mạc đồng bãi
Nếu áo dài là vẻ đẹp của phố phường thanh lịch, thì chiếc áo bà ba bằng vải lụa hoặc vải ú đen lại gợi nhớ về những bến đò, dòng kênh bạt ngàn dừa nước. Sự giao thoa giữa hai trang phục phản chiếu trọn vẹn bản sắc đa dạng của văn hóa Sài Gòn - Gia Định.`,
  },
  {
    id: 'news-9',
    slug: 'com-tam-dem-sai-gon-net-quyen-ru-am-thuc-he-pho',
    title: 'Hương vị Cơm tấm đêm: Nét quyến rũ độc nhất của ẩm thực đường phố Sài Gòn',
    category: 'van-hoa',
    summary: 'Mùi khói sườn nướng mật ong bốc lên ngào ngạt góc ngã tư nửa đêm, đĩa cơm tấm hạt vụn dẻo thơm chan mỡ hành là hương vị khó quên với bất kỳ ai từng ghé thành phố này.',
    coverImageUrl: '/images/dishes/com-tam-suon-bi-cha.webp',
    coverImageAlt: 'Đĩa cơm tấm sườn nướng thơm ngon chuẩn vị Sài Gòn',
    imageCredit: 'Echora',
    publishedAt: daysAgo(7),
    readingMinutes: 4,
    audioUrl: null,
    relatedPoiSlugs: ['cho-ben-thanh'],
    content: `Khởi nguồn từ món ăn dung dị của người lao động tận dụng hạt gạo tấm vỡ khi xay xát, Cơm tấm Sài Gòn đã vươn mình trở thành món ăn di sản được thế giới công nhận.

### Đĩa cơm tấm "Sà Bì Chưởng" trọn vẹn
Một đĩa cơm tấm hoàn hảo phải hội tụ đủ: miếng sườn cốt lết tẩm ướp sả ớt nướng vàng ươm trên than củi, bì heo trộn thính gạo thơm phức, chả trứng hấp mềm béo ngậy, quả trứng ốp la lòng đào và chén nước mắm chua ngọt kẹo quánh. Thưởng thức cơm tấm lúc nửa đêm bên vỉa hè lộng gió là một trải nghiệm khó quên của nếp sống đêm Sài Gòn.`,
  },

  // 3. Mẹo tham quan & Trải nghiệm (4 bài)
  {
    id: 'news-10',
    slug: 'hem-sai-gon-bao-tang-song-cua-doi-song-thi-dan',
    title: 'Hẻm Sài Gòn: "Bảo tàng sống" lưu giữ tình làng nghĩa xóm và ký ức thị dân',
    category: 'van-hoa',
    summary: 'Hẻm không đơn thuần là lối đi tắt qua những phố lớn, mà là một hệ sinh thái cộng đồng ấm áp, nơi nhịp sống diễn ra chân thành và bao dung.',
    coverImageUrl: '/images/home/intro-traffic.jpg',
    coverImageAlt: 'Con hẻm nhỏ rợp bóng cây xanh và nhịp sống bình dị',
    imageCredit: 'Echora',
    publishedAt: daysAgo(6),
    readingMinutes: 4,
    audioUrl: null,
    relatedPoiSlugs: ['cho-ben-thanh'],
    content: `Sài Gòn có hàng nghìn con hẻm chằng chịt như mạng nhện. Rẽ khỏi đại lộ tấp nập vào một con hẻm nhỏ, âm thanh còi xe lập tức dịu đi, nhường chỗ cho tiếng chào hỏi rôm rả của các bà các mẹ, tiếng đũa gõ trên bàn ăn sáng và tiếng rao hủ tiếu quen thuộc.

Hẻm Sài Gòn còn là nơi cưu mang những số phận nhập cư bằng những bình trà đá miễn phí, quán cơm từ thiện và những tủ thuốc sơ cứu nghĩa tình. Khám phá những con hẻm cổ ở Quận 1, Quận 3 là cách nhanh nhất để chạm vào tâm hồn hiếu khách của người dân nơi đây.`,
  },
  {
    id: 'news-11',
    slug: 'lo-trinh-di-bo-buoi-sang-5-cong-trinh-tieu-bieu',
    title: 'Lộ trình đi bộ một buổi sáng kết nối trọn vẹn 5 di tích kiến trúc Sài Gòn',
    category: 'meo-tham-quan',
    summary: 'Chỉ với hơn 3 giờ đi bộ thong dong dưới hàng cây cổ thụ, bạn có thể ghé thăm và lắng nghe thuyết minh trọn vẹn 5 công trình di sản nổi bật nhất trung tâm thành phố.',
    coverImageUrl: '/images/home/intro-nguyen-hue.jpg',
    coverImageAlt: 'Phố đi bộ Nguyễn Huệ trên tuyến khám phá di sản trung tâm',
    imageCredit: 'Echora',
    publishedAt: daysAgo(3),
    readingMinutes: 5,
    audioUrl: null,
    relatedPoiSlugs: ['dinh-doc-lap', 'nha-tho-duc-ba', 'buu-dien-trung-tam', 'cho-ben-thanh', 'bao-tang-chung-tich-chien-tranh'],
    content: `Tuyến tham quan 5 điểm di sản trung tâm được thiết kế tối ưu cự ly cho người đi bộ:

- **07:30 - Chặng 1: Nhà thờ Đức Bà & Bưu điện Trung tâm** (đối diện nhau trên quảng trường Công xã Paris lúc nắng sớm dịu mát).
- **08:30 - Chặng 2: Công viên 30/4 & Dinh Độc Lập** (đi bộ dọc hàng me xanh mát khoảng 400m).
- **10:00 - Chặng 3: Chợ Bến Thành** (tản bộ theo đường Nam Kỳ Khởi Nghĩa và Lê Lợi khoảng 600m để mua quà lưu niệm và nạp năng lượng).
- **11:00 - Chặng 4: Bảo tàng Chứng tích Chiến tranh** (kết thúc chuyến đi với không gian lịch sử trầm lắng trên đường Võ Văn Tần).`,
  },
  {
    id: 'news-12',
    slug: 'cach-chup-anh-dep-di-tich-kien-truc-co-sai-gon',
    title: 'Kinh nghiệm chụp ảnh kiến trúc cổ Sài Gòn: Bắt trọn ánh sáng và chiều sâu thời gian',
    category: 'meo-tham-quan',
    summary: 'Gợi ý những góc máy chính diện, tận dụng bóng cây nhiệt đới và khung giờ vàng bình minh để lưu lại những khung hình di sản ấn tượng nhất.',
    coverImageUrl: '/images/news/arch.webp',
    coverImageAlt: 'Góc chụp kiến trúc cổ điển với ánh sáng xiên ban mai',
    imageCredit: 'Unsplash',
    publishedAt: daysAgo(6),
    readingMinutes: 4,
    audioUrl: null,
    relatedPoiSlugs: ['buu-dien-trung-tam', 'nha-tho-duc-ba'],
    content: `Kiến trúc cổ điển thời kỳ Pháp thuộc tại Sài Gòn sở hữu tính đối xứng hình học và chi tiết trang trí điêu khắc rất công phu.

### 4 Bí quyết chụp ảnh đẹp:
1. **Khung giờ vàng (06:30 - 08:00):** Ánh nắng xiên tạo bóng đổ sâu, làm nổi bật đường gờ chỉ và màu vàng hoàng gia của Bưu điện hay màu gạch đỏ của Nhà thờ Đức Bà.
2. **Khai thác trục đối xứng:** Đứng chính giữa cổng lớn để ghi lại toàn vẹn nét cân đối của mặt tiền Dinh Độc Lập hay mái vòm Bưu điện.
3. **Mượn tán lá xanh làm tiền cảnh:** Hàng me cổ thụ trên đường Hàn Thuyên hay Alexandre de Rhodes là khung viền tự nhiên hoàn hảo.
4. **Góc máy hất từ thấp (Low angle):** Tôn vinh vẻ uy nghiêm của tháp chuông và các vòm cửa cao vút.`,
  },
  {
    id: 'news-13',
    slug: 'cam-nang-chuan-bi-tien-le-va-vat-dung-di-cho',
    title: 'Cẩm nang thưởng thức ẩm thực và mua sắm chuẩn người bản địa tại Chợ Bến Thành',
    category: 'meo-tham-quan',
    summary: 'Một vài lưu ý nhỏ về việc chuẩn bị tiền lẻ, bảo quản tư trang và cách giao tiếp thân thiện giúp bạn có một buổi dạo chợ trọn vẹn niềm vui.',
    coverImageUrl: '/images/dishes/banh-mi-thit-nguoi-pate.webp',
    coverImageAlt: 'Món ăn đường phố hấp dẫn bên trong Chợ Bến Thành',
    imageCredit: 'Echora',
    publishedAt: daysAgo(8),
    readingMinutes: 3,
    audioUrl: null,
    relatedPoiSlugs: ['cho-ben-thanh'],
    content: `Dạo chợ Bến Thành là một nét văn hóa thú vị. Để chuyến đi của bạn thêm phần thuận lợi, hãy lưu ý một số mẹo nhỏ sau:

- **Chuẩn bị tiền mặt mệnh giá nhỏ:** Các tờ tiền 10.000đ, 20.000đ, 50.000đ rất tiện lợi khi mua quà vặt, ly chè hay món đồ lưu niệm nhỏ.
- **Trang phục thoải mái:** Lựa chọn giày đi bộ nhẹ nhàng và trang phục thấm hút mồ hôi vì bên trong chợ khá ấm vào giờ trưa.
- **Mỉm cười khi giao tiếp:** Người buôn bán ở Sài Gòn rất cởi mở; một nụ cười thân thiện sẽ mở đầu cho những cuộc trò chuyện thú vị về nguồn gốc từng món hàng.`,
  },

  // 4. Trang phục truyền thống (4 bài, liên kết tới bài gốc)
  {
    id: 'news-14',
    slug: 'ao-dai-qua-hon-100-nam',
    title: 'Áo dài Việt Nam: Hành trình hơn một thế kỷ của tà áo dân tộc',
    category: 'trang-phuc',
    summary: 'Từ chiếc áo tứ thân buổi sơ khai đến những thiết kế tôn dáng hiện đại, áo dài đã đi qua hơn 100 năm và trở thành biểu tượng của người phụ nữ Việt.',
    coverImageUrl: '/images/home/costume-ao-dai-2.jpg',
    coverImageAlt: 'Tà áo dài truyền thống trong nắng sớm',
    imageCredit: 'Echora',
    publishedAt: daysAgo(9),
    readingMinutes: 4,
    audioUrl: null,
    relatedPoiSlugs: [],
    source: 'VnExpress',
    externalUrl: 'https://vnexpress.net/ao-dai-qua-hon-100-nam-4122267.html',
    content: `Áo dài là trang phục truyền thống gắn bó với người Việt qua bao thế hệ. Từ chiếc áo tứ thân, áo ngũ thân thời xưa đến những thiết kế tôn dáng ở thế kỷ 20, tà áo dài không ngừng đổi mới mà vẫn giữ trọn nét thanh lịch.

Bài viết gốc của VnExpress kể lại hành trình hơn một thế kỷ của tà áo dân tộc.

Thêm một gợi ý nhỏ cho du khách: nên dành ít nhất 45 phút để tham quan và chụp ảnh, đồng thời kết hợp với các điểm lân cận trong cùng tuyến để tiết kiệm thời gian di chuyển. Thông tin mở cửa và giá vé có thể thay đổi theo mùa, vui lòng kiểm tra trước khi đi.`,
  },
  {
    id: 'news-15',
    slug: 'tri-thuc-may-mac-ao-dai-hue-di-san-quoc-gia',
    title: 'Tri thức may, mặc áo dài Huế được ghi danh di sản quốc gia',
    category: 'trang-phuc',
    summary: 'Nghề may và cách mặc áo dài của người Huế được công nhận là di sản văn hóa phi vật thể quốc gia, ghi dấu một nét đẹp tinh tế của xứ Cố đô.',
    coverImageUrl: '/images/home/costume-ao-dai.jpg',
    coverImageAlt: 'Áo dài Huế với nét thanh lịch truyền thống',
    imageCredit: 'Echora',
    publishedAt: daysAgo(11),
    readingMinutes: 3,
    audioUrl: null,
    relatedPoiSlugs: [],
    source: 'VnExpress',
    externalUrl: 'https://vnexpress.net/tri-thuc-may-mac-ao-dai-hue-la-di-san-van-hoa-phi-vat-the-quoc-gia-4780585.html',
    content: `Nghề may và cách mặc áo dài của người Huế vừa được ghi danh là di sản văn hóa phi vật thể quốc gia. Đây là sự ghi nhận cho một nét đẹp tinh tế, gắn với đời sống và tâm hồn của người dân xứ Cố đô.

Chi tiết về tri thức may, mặc áo dài Huế được trình bày trong bài viết gốc của VnExpress.

Thêm một gợi ý nhỏ cho du khách: nên dành ít nhất 45 phút để tham quan và chụp ảnh, đồng thời kết hợp với các điểm lân cận trong cùng tuyến để tiết kiệm thời gian di chuyển. Thông tin mở cửa và giá vé có thể thay đổi theo mùa, vui lòng kiểm tra trước khi đi.`,
  },
  {
    id: 'news-16',
    slug: 'chiec-ao-ba-ba-va-van-hoa-nam-bo',
    title: 'Áo bà ba – nét mộc mạc gắn với văn hóa Nam Bộ',
    category: 'trang-phuc',
    summary: 'Chiếc áo bà ba gắn với bến đò, dòng kênh và nếp sinh hoạt của cư dân miền sông nước, toát lên vẻ duyên dáng và gần gũi của người phụ nữ Nam Bộ.',
    coverImageUrl: '/images/home/costume-ao-ba-ba.jpg',
    coverImageAlt: 'Chiếc áo bà ba mộc mạc của người phụ nữ Nam Bộ',
    imageCredit: 'Echora',
    publishedAt: daysAgo(13),
    readingMinutes: 3,
    audioUrl: null,
    relatedPoiSlugs: [],
    source: 'Thanh Niên',
    externalUrl: 'https://thanhnien.vn/chiec-ao-ba-ba-gan-lien-voi-van-hoa-nam-bo-185230917021604218.htm',
    content: `Chiếc áo bà ba mộc mạc là một biểu tượng của văn hóa Nam Bộ, gắn với bến đò, dòng kênh và nếp sinh hoạt của cư dân miền sông nước. Dù đơn giản, trang phục này vẫn toát lên sự duyên dáng và gần gũi.

Bài viết gốc của báo Thanh Niên kể lại nguồn gốc và sức sống của áo bà ba trong đời sống hôm nay.

Thêm một gợi ý nhỏ cho du khách: nên dành ít nhất 45 phút để tham quan và chụp ảnh, đồng thời kết hợp với các điểm lân cận trong cùng tuyến để tiết kiệm thời gian di chuyển. Thông tin mở cửa và giá vé có thể thay đổi theo mùa, vui lòng kiểm tra trước khi đi.`,
  },
  {
    id: 'news-17',
    slug: 'non-la-lang-chuong-giu-hon-van-hoa-viet',
    title: 'Nón lá làng Chuông – giữ hồn văn hóa Việt giữa thời hiện đại',
    category: 'trang-phuc',
    summary: 'Nón lá làng Chuông được làm thủ công qua nhiều công đoạn tỉ mỉ; ngày nay làng nghề vẫn nỗ lực gìn giữ và đưa chiếc nón lá đến gần hơn với thế hệ trẻ.',
    coverImageUrl: '/images/news/non-la.jpg',
    coverImageAlt: 'Chiếc nón lá Việt Nam truyền thống',
    imageCredit: 'Wikimedia Commons',
    publishedAt: daysAgo(15),
    readingMinutes: 3,
    audioUrl: null,
    relatedPoiSlugs: [],
    source: 'Báo Chính phủ',
    externalUrl: 'https://thanglong.chinhphu.vn/non-la-lang-chuong-giu-hon-van-hoa-viet-103240117115141963.htm',
    content: `Nón lá làng Chuông từ lâu đã gắn với hình ảnh người Việt, được làm thủ công qua nhiều công đoạn tỉ mỉ. Ngày nay, làng nghề vẫn nỗ lực gìn giữ và đưa chiếc nón lá đến gần hơn với thế hệ trẻ.

Bài viết trên Cổng thông tin Chính phủ điểm lại câu chuyện giữ hồn văn hóa Việt của nghề nón lá làng Chuông.

Thêm một gợi ý nhỏ cho du khách: nên dành ít nhất 45 phút để tham quan và chụp ảnh, đồng thời kết hợp với các điểm lân cận trong cùng tuyến để tiết kiệm thời gian di chuyển. Thông tin mở cửa và giá vé có thể thay đổi theo mùa, vui lòng kiểm tra trước khi đi.`,
  },

  // 5. Vẻ đẹp Việt Nam (4 bài, liên kết tới bài gốc)
  {
    id: 'news-18',
    slug: '9-di-san-van-hoa-thien-nhien-the-gioi-tai-viet-nam',
    title: '9 di sản văn hóa và thiên nhiên thế giới tại Việt Nam',
    category: 've-dep',
    summary: 'Việt Nam có 9 di sản được UNESCO công nhận, trải dài từ quần thể kiến trúc cổ đến danh thắng thiên nhiên hùng vĩ, mỗi nơi mang giá trị lịch sử và thẩm mỹ riêng.',
    coverImageUrl: '/images/news/halong.webp',
    coverImageAlt: 'Phong cảnh vịnh Hạ Long nhìn từ trên cao',
    imageCredit: 'Unsplash',
    publishedAt: daysAgo(17),
    readingMinutes: 4,
    audioUrl: null,
    relatedPoiSlugs: [],
    source: 'VnExpress',
    externalUrl: 'https://vnexpress.net/9-di-san-van-hoa-thien-nhien-the-gioi-tai-viet-nam-4654852.html',
    content: `Việt Nam hiện có 9 di sản được UNESCO công nhận là di sản văn hóa và thiên nhiên thế giới, trải dài từ những quần thể kiến trúc cổ đến các danh thắng thiên nhiên hùng vĩ. Mỗi di sản mang trong mình giá trị lịch sử và thẩm mỹ đặc biệt.

Bài viết gốc của VnExpress giới thiệu tổng quan về 9 di sản quý giá này.

Thêm một gợi ý nhỏ cho du khách: nên dành ít nhất 45 phút để tham quan và chụp ảnh, đồng thời kết hợp với các điểm lân cận trong cùng tuyến để tiết kiệm thời gian di chuyển. Thông tin mở cửa và giá vé có thể thay đổi theo mùa, vui lòng kiểm tra trước khi đi.`,
  },
  {
    id: 'news-19',
    slug: '10-ky-quan-thien-nhien-dep-nhat-viet-nam',
    title: '10 kỳ quan thiên nhiên đẹp nhất Việt Nam',
    category: 've-dep',
    summary: 'Từ vịnh Hạ Long đến quần thể Tràng An hay ruộng bậc thang vùng cao, thiên nhiên Việt Nam sở hữu những cảnh quan vừa hùng vĩ vừa nên thơ, níu chân bao du khách.',
    coverImageUrl: '/images/news/trang-an.jpg',
    coverImageAlt: 'Quần thể danh thắng Tràng An, Ninh Bình',
    imageCredit: 'Wikimedia Commons',
    publishedAt: daysAgo(19),
    readingMinutes: 4,
    audioUrl: null,
    relatedPoiSlugs: [],
    source: 'VnExpress',
    externalUrl: 'https://vnexpress.net/10-ky-quan-thien-nhien-dep-nhat-viet-nam-4197437.html',
    content: `Từ vịnh Hạ Long đến quần thể Tràng An hay các thửa ruộng bậc thang vùng cao, thiên nhiên Việt Nam sở hữu những cảnh quan được đánh giá là kỳ quan. Vẻ đẹp ấy vừa hùng vĩ vừa nên thơ, níu chân bao du khách.

Danh sách 10 kỳ quan thiên nhiên đẹp nhất Việt Nam được VnExpress tổng hợp trong bài viết gốc.

Thêm một gợi ý nhỏ cho du khách: nên dành ít nhất 45 phút để tham quan và chụp ảnh, đồng thời kết hợp với các điểm lân cận trong cùng tuyến để tiết kiệm thời gian di chuyển. Thông tin mở cửa và giá vé có thể thay đổi theo mùa, vui lòng kiểm tra trước khi đi.`,
  },
  {
    id: 'news-20',
    slug: '17-diem-den-hang-dau-viet-nam',
    title: '17 điểm đến hàng đầu Việt Nam do báo nước ngoài bình chọn',
    category: 've-dep',
    summary: 'Nhiều điểm đến của Việt Nam thường xuyên góp mặt trong các bình chọn du lịch quốc tế, từ thành phố năng động đến những miền di sản yên bình.',
    coverImageUrl: '/images/home/tour-cu-chi.jpg',
    coverImageAlt: 'Một điểm đến nổi tiếng của du lịch Việt Nam',
    imageCredit: 'Echora',
    publishedAt: daysAgo(21),
    readingMinutes: 4,
    audioUrl: null,
    relatedPoiSlugs: [],
    source: 'VnExpress',
    externalUrl: 'https://vnexpress.net/17-diem-den-hang-dau-viet-nam-do-bao-nuoc-ngoai-binh-chon-4503730.html',
    content: `Nhiều điểm đến của Việt Nam thường xuyên xuất hiện trong các bình chọn du lịch của báo chí quốc tế, từ thành phố năng động đến những miền di sản yên bình. Sự công nhận này phản ánh sức hút ngày càng lớn của du lịch Việt Nam.

Bài viết gốc của VnExpress điểm qua 17 điểm đến hàng đầu được báo nước ngoài bình chọn.

Thêm một gợi ý nhỏ cho du khách: nên dành ít nhất 45 phút để tham quan và chụp ảnh, đồng thời kết hợp với các điểm lân cận trong cùng tuyến để tiết kiệm thời gian di chuyển. Thông tin mở cửa và giá vé có thể thay đổi theo mùa, vui lòng kiểm tra trước khi đi.`,
  },
  {
    id: 'news-21',
    slug: 'nu-cuoi-nguoi-viet',
    title: 'Nụ cười người Việt – vẻ đẹp bình dị qua ống kính',
    category: 've-dep',
    summary: 'Nụ cười của người Việt, dù ở phố thị hay miền quê, luôn để lại ấn tượng khó phai. Qua ống kính, những khoảnh khắc đời thường ấy thành vẻ đẹp bình dị mà sâu lắng.',
    coverImageUrl: '/images/home/intro-cafe.jpg',
    coverImageAlt: 'Khoảnh khắc đời thường của người Việt',
    imageCredit: 'Echora',
    publishedAt: daysAgo(23),
    readingMinutes: 3,
    audioUrl: null,
    relatedPoiSlugs: [],
    source: 'VnExpress',
    externalUrl: 'https://vnexpress.net/nu-cuoi-nguoi-viet-4933492.html',
    content: `Nụ cười của người Việt, dù ở phố thị hay miền quê, luôn để lại ấn tượng khó phai với du khách. Qua ống kính, những khoảnh khắc đời thường ấy trở thành vẻ đẹp bình dị mà sâu lắng.

Bài viết gốc trên VnExpress lưu lại những khung hình về nụ cười người Việt.

Thêm một gợi ý nhỏ cho du khách: nên dành ít nhất 45 phút để tham quan và chụp ảnh, đồng thời kết hợp với các điểm lân cận trong cùng tuyến để tiết kiệm thời gian di chuyển. Thông tin mở cửa và giá vé có thể thay đổi theo mùa, vui lòng kiểm tra trước khi đi.`,
  },
];

/**
 * 4-article fixture set to test small-data / compact layout (< 6 articles)
 */
export const fourNewsArticles: ApiNewsDetail[] = newsArticles.slice(0, 4);
