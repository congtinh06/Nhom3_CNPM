-- V19: Cập nhật ảnh chính xác và bổ sung mô tả chi tiết cho 40 món quà lưu niệm Sài Gòn.
-- Idempotent: Cập nhật theo slug của từng sản phẩm.

UPDATE dbo.products SET
    image_path = '/images/souvenirs/tranh-dinh-doc-lap.jpg',
    short_description = N'Tranh mạ vàng ánh kim in hình Dinh Độc Lập, món quà lưu niệm trang trọng của Sài Gòn.',
    description = N'Bức tranh được chế tác công phu bằng công nghệ mạ vàng ánh kim cao cấp trên nền hợp kim chống oxy hóa, tái hiện toàn cảnh mặt tiền kiến trúc biểu tượng của Dinh Độc Lập với hàng cột bê tông đúc cách điệu đốt trúc thanh thoát. Tranh lồng khung gỗ tự nhiên phủ sơn bóng sang trọng cùng lớp kính mica chống lóa, mặt sau bọc nhung trang nhã kèm chân đế và móc treo. Tác phẩm phù hợp làm quà tặng ngoại giao, lưu niệm đối tác hoặc trưng bày nơi phòng khách, bàn làm việc như một dấu ấn lịch sử hào hùng của Sài Gòn.'
WHERE slug = 'tranh-ma-vang-dinh-doc-lap';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/mo-hinh.jpg',
    short_description = N'Mô hình thu nhỏ Dinh Độc Lập chế tác tỉ mỉ, thích hợp trưng bày và sưu tầm.',
    description = N'Mô hình kiến trúc 3D thu nhỏ chuẩn tỷ lệ của Dinh Độc Lập, khắc họa sống động từng khối nhà chính, hàng hiên đón gió, tiền sảnh và cột cờ trên nóc dinh. Được gia công từ chất liệu composite cao cấp kết hợp kỹ thuật cắt laser độ chính xác cao, phủ sơn bảo vệ chống ẩm mốc và phai màu. Đế gỗ khắc thông tin công trình và năm khánh thành 1966. Thích hợp cho người đam mê kiến trúc, nhà sưu tầm hoặc làm quà tặng lưu niệm giáo dục lịch sử.'
WHERE slug = 'mo-hinh-dinh-doc-lap';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/nam-cham.jpg',
    short_description = N'Nam châm tủ lạnh in hình Dinh Độc Lập, món quà nhỏ gọn và dễ thương.',
    description = N'Nam châm trang trí tủ lạnh đúc nổi 3D hình Dinh Độc Lập và bãi cỏ đài phun nước trung tâm. Chất liệu nhựa dẻo phủ bóng cao cấp không mùi, bền màu theo thời gian, mặt sau gắn dải nam châm vĩnh cửu có độ bám dính cực chắc trên cửa tủ lạnh, bảng từ hoặc bàn làm việc kim loại. Kích thước bỏ túi gọn gàng, tiện lợi mang theo trong vali hành lý làm quà tặng tập thể cho đồng nghiệp, bạn bè sau chuyến du lịch.'
WHERE slug = 'nam-cham-dinh-doc-lap';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/buu-thiep.jpg',
    short_description = N'Bộ bưu thiếp in các góc chụp đẹp của Dinh Độc Lập.',
    description = N'Tập hợp 8 tấm bưu thiếp tuyển chọn những góc ảnh nghệ thuật đẹp nhất của Dinh Độc Lập: từ bình minh trên bãi cỏ, phòng khánh tiết lộng lẫy, ban công đón gió tứ phương cho đến hầm chỉ huy kiên cố thời chiến. In trên giấy mỹ thuật ivory 350gsm dày dặn, bề mặt mờ mịn chống bám vân tay, độ lưu màu trên 10 năm. Mặt sau kẻ dòng chuẩn quốc tế để viết lời chúc và dán tem bưu chính gửi đến khắp nơi trên thế giới.'
WHERE slug = 'buu-thiep-dinh-doc-lap';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/ca-phe-phin.jpg',
    short_description = N'Cà phê rang xay đậm vị Sài Gòn, đóng gói làm quà tặng.',
    description = N'Tuyển chọn từ 100% hạt Robusta Đắk Lắk và Arabica Cầu Đất chín mọng, rang mộc theo bí quyết truyền thống của các tiệm cà phê Sài Gòn xưa. Hạt được ủ và xay ở độ mịn tiêu chuẩn cho pha phin, mang lại tách cà phê sánh đậm màu cánh gián, hương thơm nồng nàn thảo mộc cùng hậu vị đắng thanh ngọt dịu kéo dài. Đóng gói túi màng nhôm van một chiều bảo quản tối ưu hương vị nguyên bản.'
WHERE slug = 'ca-phe-rang-xay-sai-gon';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/ao-dai.jpg',
    short_description = N'Áo dài cách tân nhẹ nhàng, tôn dáng và hợp nhiều dịp.',
    description = N'Mẫu áo dài cách tân hiện đại lấy cảm hứng từ trang phục thiếu nữ Sài Gòn thập niên 60 với phom dáng suông nhẹ nhàng, tay lỡ thoáng mát và cổ tròn thanh thoát. May từ chất liệu lụa tơ tằm pha đũi mềm mại, thoáng khí, thấm hút mồ hôi tối đa, điểm xuyết hoa văn thêu tay tinh tế dọc tà áo. Rất tiện dụng để mặc dạo phố chụp ảnh di tích, dự tiệc nhẹ hoặc làm quà tặng người thân ở xa.'
WHERE slug = 'ao-dai-cach-tan-sai-gon';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/tranh-theu.jpg',
    short_description = N'Tranh thêu tay hình Nhà thờ Đức Bà với từng đường kim mũi chỉ tinh xảo.',
    description = N'Tác phẩm thủ công truyền thống được các nghệ nhân thêu tay hàng chục giờ đồng hồ từ sợi chỉ tơ bóng trên nền vải lụa tơ tằm. Bức tranh tái hiện sắc nét hai tháp chuông vươn cao, tường gạch Marseille đỏ hồng cổ kính và tượng Đức Mẹ Hòa Bình uy nghiêm giữa vườn hoa. Đường nét thêu chuyển màu mượt mà tạo chiều sâu thị giác chân thực. Đóng khung gỗ thông kèm kính bảo vệ cao cấp.'
WHERE slug = 'tranh-theu-nha-tho-duc-ba';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/tranh-nha-tho-duc-ba.jpg',
    short_description = N'Tranh mạ vàng ánh kim hình Nhà thờ Đức Bà, quà tặng trang trọng.',
    description = N'Bức tranh kỷ niệm danh thắng Nhà thờ Đức Bà Sài Gòn được chế tác bằng lá kim loại mạ vàng 24K công nghệ điện phân tinh xảo. Các chi tiết hoa văn vòm cửa Roman, tháp chuông Gothic và đồng hồ cổ đều được khắc họa sắc nét với độ sáng bóng lấp lánh. Khung gỗ cao cấp chống mối mọt, phủ sơn nâu trầm cổ điển, là tặng phẩm sang trọng cho du khách trong và ngoài nước.'
WHERE slug = 'tranh-ma-vang-nha-tho-duc-ba';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/nam-cham.jpg',
    short_description = N'Nam châm Nhà thờ Đức Bà, nhỏ gọn và dễ thương.',
    description = N'Nam châm tủ lạnh lưu niệm tạo hình khối kiến trúc Nhà thờ Đức Bà với tông màu gạch nung đỏ rực rỡ đặc trưng. Chế tác từ kim loại đúc nguyên khối phủ men epoxy bóng bảo vệ, chống trầy xước và bay màu. Nam châm sau lưng hút mạnh mẽ, giữ chắc giấy ghi chú trên tủ lạnh hoặc bảng thông tin gia đình.'
WHERE slug = 'nam-cham-nha-tho-duc-ba';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/buu-thiep-duc-ba.jpg',
    short_description = N'Bưu thiếp in hình Nhà thờ Đức Bà với góc chụp đẹp.',
    description = N'Bưu thiếp nghệ thuật tái hiện góc nhìn kinh điển của Nhà thờ Chính tòa Đức Bà Sài Gòn từ quảng trường Công xã Paris. Sử dụng công nghệ in offset sắc nét trên giấy mỹ thuật nhập khẩu có vân nhẹ, màu sắc trầm ấm hoài niệm. Thích hợp làm quà tặng lưu niệm bưu chính, viết thư tay gửi người thân yêu hoặc ép khung nhỏ trang trí góc bàn học tập.'
WHERE slug = 'buu-thiep-nha-tho-duc-ba';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/chuoi-hat-go.jpg',
    short_description = N'Chuỗi hạt gỗ mỹ nghệ chạm khắc tinh tế, hợp làm quà tặng.',
    description = N'Chuỗi tràng hạt 108 hạt được tiện tròn và đánh bóng thủ công từ gỗ bách xanh tự nhiên, mang hương thơm mộc dịu nhẹ giúp tinh thần thư thái, an yên. Từng hạt gỗ đều đặn, vân gỗ tự nhiên nổi bật, xâu bằng dây dù siêu bền có khả năng co giãn linh hoạt. Phù hợp để lần hạt tĩnh tâm, đeo tay như vòng phong thủy may mắn hoặc treo xe hơi cầu bình an trong mọi chuyến đi.'
WHERE slug = 'chuoi-hat-go-my-nghe';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/tem-suu-tam.jpg',
    short_description = N'Bộ tem in hình các danh thắng Sài Gòn dành cho người sưu tầm.',
    description = N'Bộ sưu tập tem bưu chính phát hành đặc biệt giới thiệu các công trình kiến trúc di sản tiêu biểu của TP. Hồ Chí Minh: Bưu điện Trung tâm, Nhà hát Thành phố, Bến Nhà Rồng và Chợ Bến Thành. Tem nguyên bản có răng cưa sắc nét, bảo quản trong bìa mica trong suốt chống ẩm và bụi bẩn. Món quà văn hóa vô giá cho những người say mê nghệ thuật thư tín và sưu tầm tem bưu hoa.'
WHERE slug = 'tem-suu-tam-sai-gon';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/buu-thiep-retro.jpg',
    short_description = N'Bưu thiếp phong cách retro in hình Sài Gòn xưa.',
    description = N'Bộ bưu thiếp phục dựng từ những tấm ảnh tư liệu quý chụp Sài Gòn đầu thế kỷ XX: bến Bạch Đằng, đường Catinat (Đồng Khởi), xe thổ mộ và các tiệm quán xưa cũ. Tông màu ngả vàng sepia hoài cổ in trên giấy kraft định lượng cao tạo cảm giác chân thật và xúc cảm lắng đọng về ký ức Hòn ngọc Viễn Đông một thời.'
WHERE slug = 'buu-thiep-retro-sai-gon';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/moc-khoa.jpg',
    short_description = N'Móc khóa hình Bưu điện Trung tâm Sài Gòn, món quà nhỏ gọn.',
    description = N'Móc khóa kim loại đúc nổi hình mái vòm và mặt tiền màu vàng đất đặc trưng của Bưu điện Trung tâm Sài Gòn do kiến trúc sư Gustave Eiffel tham gia thiết kế. Móc khóa trang bị khoen xoay 360 độ bằng thép không gỉ sáng bóng, cầm đầm tay, bền bỉ khi treo chìa khóa xe máy, khóa nhà hoặc trang trí balo túi xách.'
WHERE slug = 'moc-khoa-buu-dien';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/tranh-buu-dien.jpg',
    short_description = N'Tranh mạ vàng ánh kim hình Bưu điện Trung tâm Sài Gòn.',
    description = N'Bức tranh mạ vàng lấp lánh tái hiện đường nét kiến trúc Phục Hưng kết hợp phong cách Gothic tinh tế của Bưu điện Trung tâm Sài Gòn. Các ô cửa vòm cuốn cong, đồng hồ lớn chính giữa và các hoa văn sắt rèn nghệ thuật được khắc họa tỉ mỉ từng chi tiết nhỏ. Khung tranh gỗ tự nhiên chắc chắn, đem lại nét sang trọng và cổ kính cho không gian trưng bày.'
WHERE slug = 'tranh-ma-vang-buu-dien';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/ca-phe-sua-da.jpg',
    short_description = N'Bộ cà phê sữa đá kèm phin nhôm, quà tặng đậm vị Sài Gòn.',
    description = N'Bộ quà tặng trọn gói trải nghiệm văn hóa "Cà phê sữa đá" trứ danh của người Sài Gòn. Bao gồm 1 gói cà phê bột Robusta nguyên chất 250g, 1 phin nhôm dập lỗ tiêu chuẩn kiểm soát tốc độ nhỏ giọt lý tưởng, và 1 lon sữa đặc béo ngậy. Hướng dẫn pha chế chi tiết in sẵn trên bao bì hộp quà cao cấp, giúp người nhận tự tay thưởng thức ly cà phê đúng điệu ngay tại nhà.'
WHERE slug = 'ca-phe-sua-da-phin';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/lua-viet-nam.jpg',
    short_description = N'Khăn lụa tơ tằm Sài Gòn mềm mại, óng ả, hợp làm quà tặng thanh lịch.',
    description = N'Khăn choàng dệt từ 100% sợi tơ tằm Bảo Lộc tự nhiên, nổi tiếng với độ mềm rủ nhẹ như mây, mát vào mùa hè và ấm áp vào mùa đông. Bề mặt lụa có độ óng ả tự nhiên quý phái, in họa tiết danh lam thắng cảnh Sài Gòn bằng màu nhuộm sinh học thân thiện với làn da. Phụ kiện thời trang đẳng cấp và món quà tri ân tinh tế cho phái đẹp.'
WHERE slug = 'lua-tam-sai-gon';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/non-la.jpg',
    short_description = N'Nón lá thủ công truyền thống, biểu tượng gần gũi của Việt Nam.',
    description = N'Chiếc nón lá truyền thống được chằm tỉ mỉ từ lá cọ sấy khô và vành tre vót nhẵn bóng bởi các nghệ nhân làng nghề lâu đời. Từng đường cước trong suốt đan đều đặn 16 vành nón kiên cố, chóp nón vuốt nhọn duyên dáng kèm quai lụa mềm mại. Nón nhẹ, chống nắng mưa hiệu quả và là vật phẩm chụp ảnh kỷ niệm không thể thiếu của du khách khi đến Việt Nam.'
WHERE slug = 'non-la-thu-cong';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/may-tre.jpg',
    short_description = N'Túi và đồ dùng mây tre đan thủ công, thân thiện với môi trường.',
    description = N'Chiếc túi xách thời trang được đan thủ công 100% từ mây tre tự nhiên chọn lọc, đã qua xử lý luộc sấy chống mối mọt và nấm mốc. Quai xách chắc chắn, lót vải mộc bên trong kèm dây rút bảo vệ đồ đạc. Thiết kế thanh thoát mang đậm phong cách sống xanh vintage, rất được ưa chuộng khi đi biển, dạo phố hoặc làm phụ kiện phối đồ thanh lịch.'
WHERE slug = 'do-may-tre-dan';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/gom-bat-trang.jpg',
    short_description = N'Bộ ấm tách gốm Bát Tràng men trắng, nét thanh nhã truyền thống.',
    description = N'Bộ ấm trà gồm 1 ấm và 6 chén uống trà chế tác từ đất sét tinh luyện nung ở nhiệt độ cao trên 1.200 độ C loại bỏ hoàn toàn chì và tạp chất. Nước men ngọc bóng bẩy, vẽ tay họa tiết hoa sen thanh thoát mang đậm hồn dân tộc. Gốm giữ nhiệt nước trà rất tốt, mang lại trải nghiệm thưởng trà tao nhã và ấm cúng cho cả gia đình.'
WHERE slug = 'gom-su-bat-trang';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/quat-giay.jpg',
    short_description = N'Quạt giấy in họa tiết Việt Nam, vừa dùng vừa chụp hình đẹp.',
    description = N'Quạt cầm tay gấp gọn làm từ nan tre dẻo dai và giấy điệp truyền thống vẽ phong cảnh sông nước Sài Gòn. Khi mở xòe rộng tạo luồng gió mát tự nhiên dịu nhẹ, gấp lại thon dài bỏ túi xách vô cùng tiện lợi. Là đạo cụ phối đồ áo dài chụp ảnh tuyệt đẹp và món quà lưu niệm mộc mạc đậm chất văn hóa dân gian.'
WHERE slug = 'quat-giay-sai-gon';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/banh-pia.jpg',
    short_description = N'Bánh pía vỏ mềm nhân đậu xanh trứng muối, đặc sản miền Tây.',
    description = N'Đặc sản nổi tiếng Nam Bộ với lớp vỏ ngàn lớp mỏng tang mềm xốp, ôm trọn phần nhân đậu xanh xay nhuyễn béo bùi, sầu riêng tươi thơm nức mũi và lòng đỏ trứng muối đậm vị. Vị ngọt thanh vừa phải, không gắt cổ, thưởng thức cùng tách trà sen nóng là sự kết hợp hoàn hảo. Đóng gói từng chiếc hút chân không bảo quản vệ sinh và tiện lợi mang theo.'
WHERE slug = 'banh-pia-tan-huong';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/keo-dua.jpg',
    short_description = N'Kẹo dừa Bến Tre dẻo thơm, vị ngọt thanh từ dừa tươi.',
    description = N'Kẹo dừa dẻo thơm nấu thủ công từ nước cốt dừa tươi béo ngậy xứ dừa Bến Tre và mạch nha nếp thơm lừng. Từng viên kẹo bọc trong lớp bánh tráng mỏng tan trong miệng, ngọt bùi đậm đà không dính răng. Món quà tuổi thơ thân thương mà bất kỳ du khách nào ghé miền Nam cũng muốn mua về làm quà cho người thân.'
WHERE slug = 'keo-dua-ben-tre';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/hat-dieu.jpg',
    short_description = N'Hạt điều rang muối giòn bùi, món quà đặc sản được ưa chuộng.',
    description = N'Tuyển chọn từ hạt điều loại A kích cỡ lớn đều hạt của vùng đất bazan màu mỡ. Rang củi truyền thống cùng muối hạt tinh khiết giữ nguyên lớp lụa nâu bên ngoài, hạt giòn rụm, vị béo ngậy ngọt tự nhiên đặc trưng. Giàu protein, chất béo lành mạnh và khoáng chất, đóng hộp nhựa tròn sang trọng có màng seal kín khí.'
WHERE slug = 'hat-dieu-rang-muoi';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/kho-bo.jpg',
    short_description = N'Khô bò dai ngọt đậm vị, món nhắm và quà vặt quen thuộc.',
    description = N'Chế biến từ 100% thịt bò bắp tươi ngon tẩm ướp cùng sả băm, ớt hiểm, ngũ vị hương và mật ong tự nhiên. Miếng thịt bò sấy lò thủ công giữ được thớ thịt dài, độ dai mềm vừa phải và vị cay ngọt đậm đà khó cưỡng. Vắt thêm lát chanh tươi khi ăn để bùng nổ trọn vẹn hương vị món quà vặt đường phố nổi danh Sài Gòn.'
WHERE slug = 'kho-bo-sai-gon';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/mut-trai-cay.jpg',
    short_description = N'Mứt trái cây ngọt dịu làm từ các loại trái chín tự nhiên.',
    description = N'Hộp quà tổng hợp các loại mứt hoa quả nhiệt đới sấy dẻo tự nhiên: xoài cát sấy dẻo, mứt gừng cay ấm, mãng cầu xiêm chua ngọt và vỏ bưởi sấy giòn thơm tinh dầu. Sử dụng công nghệ sấy lạnh hiện đại giữ nguyên màu sắc tươi mới, vitamin và vị ngọt thanh nguyên bản không đường hóa học.'
WHERE slug = 'mut-trai-cay-sai-gon';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/tra-sen.jpg',
    short_description = N'Trà sen ướp hương hoa sen thanh tao, hậu vị ngọt dịu.',
    description = N'Tinh hoa trà Việt kết hợp giữa búp trà tân cương thượng hạng và gạo sen Bách Diệp tươi ngát hương. Trà được ủ nhiều lần công phu để từng sợi trà thấm đượm hương thơm thanh khiết của hoa sen. Nước trà vàng mật ong, tiền chát dịu nhẹ và hậu ngọt lắng sâu nơi cuống họng.'
WHERE slug = 'tra-sen-sai-gon';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/tranh-cho-ben-thanh.jpg',
    short_description = N'Tranh mạ vàng ánh kim hình Chợ Bến Thành, quà tặng sang trọng.',
    description = N'Tác phẩm mạ vàng chế tác độc quyền tái hiện biểu tượng kiến trúc tháp đồng hồ bốn mặt của Chợ Bến Thành sầm uất. Nền tranh kim loại phủ vàng bóng bẩy tương phản nổi bật với khung viền gỗ sồi trang nhã. Món quà ghi dấu ấn trọn vẹn về trung tâm giao thương sầm uất hơn 100 năm tuổi của đất Sài Gòn - Gia Định.'
WHERE slug = 'tranh-ma-vang-cho-ben-thanh';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/tranh-co-dong.jpg',
    short_description = N'Tranh cổ động phong cách cũ, món lưu niệm đậm dấu ấn lịch sử.',
    description = N'Tranh cổ động nghệ thuật tái bản theo phong cách đồ họa lịch sử những năm kháng chiến vì hòa bình và thống nhất non sông. Gam màu rực rỡ, nét vẽ dứt khoát giàu biểu cảm cùng khẩu hiệu ý nghĩa khát vọng tự do. In trên giấy mỹ thuật định lượng cao, là ấn phẩm nghệ thuật độc đáo cho du khách yêu chuộng lịch sử và trang trí phong cách retro.'
WHERE slug = 'tranh-co-dong-viet-nam';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/sach-lich-su.jpg',
    short_description = N'Sách ảnh về lịch sử và con người Sài Gòn, quà tặng cho người ham đọc.',
    description = N'Ấn phẩm sách ảnh song ngữ Việt - Anh dày hơn 200 trang biên khảo công phu về chặng đường hơn 300 năm hình thành và phát triển của vùng đất Sài Gòn - Gia Định - TP. Hồ Chí Minh. Hàng trăm bức ảnh tư liệu quý hiếm, bản đồ cổ và câu chuyện sống động về văn hóa, con người hào sảng, nghĩa tình của thành phố phương Nam.'
WHERE slug = 'sach-lich-su-sai-gon';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/huy-hieu.jpg',
    short_description = N'Huy hiệu ghim lưu niệm với thiết kế biểu tượng Sài Gòn.',
    description = N'Huy hiệu cài áo kim loại đúc nổi hình bồ câu trắng ngậm cành ô-liu biểu tượng cho hòa bình và tình hữu nghị quốc tế. Bề mặt phủ men màu tươi sáng chống gỉ sét, mặt sau có chốt gài bướm chắc chắn tiện cài lên áo sơ mi, balo, nón du lịch hoặc dây đeo thẻ.'
WHERE slug = 'huy-hieu-luu-niem';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/tranh-bao-tang.jpg',
    short_description = N'Nam châm tủ lạnh in hình Bảo tàng Chứng tích Chiến tranh.',
    description = N'Nam châm lưu niệm đúc nổi hình khối mặt tiền Bảo tàng Chứng tích Chiến tranh - một trong những điểm đến thu hút du khách quốc tế hàng đầu tại Việt Nam. Sản phẩm mang thông điệp gìn giữ ký ức lịch sử và trân trọng giá trị hòa bình, gắn chắc chắn trên mọi bề mặt kim loại.'
WHERE slug = 'nam-cham-bao-tang';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/huong.jpg',
    short_description = N'Nhang thơm dịu, dùng dâng hương hoặc tạo không gian ấm cúng.',
    description = N'Nhang trầm thảo mộc tự nhiên chế tác theo công thức cổ truyền của các làng nghề Chợ Lớn. Bột nhang làm từ gỗ trầm hương, quế chi, hoa hồi và thảo quả thiên nhiên, không pha hóa chất dẫn cháy hay hương liệu tổng hợp độc hại. Khi thắp tỏa làn khói trắng mảnh mai, hương thơm ấm áp thanh tịnh, mang lại cảm giác an yên cho không gian gia đình.'
WHERE slug = 'nhang-thom-chua-ba';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/bao-li-xi.jpg',
    short_description = N'Bao lì xì đỏ in họa tiết may mắn, món quà nhỏ mang lời chúc tốt lành.',
    description = N'Bộ 10 bao lì xì giấy mỹ thuật đỏ thắm in kim chữ Hán "Bình An - Đại Cát" cùng họa tiết mây lành và lân sư rồng may mắn. Chất liệu giấy thơm cao cấp dày dặn, dập nổi 3D sang trọng, mang ý nghĩa trao gửi lộc đầu xuân, chúc phúc cát tường và bình an trong các dịp lễ hội, năm mới và tân gia.'
WHERE slug = 'bao-li-xi-do';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/vong-tay-da.jpg',
    short_description = N'Vòng tay đá tự nhiên mài bóng, tượng trưng cho bình an may mắn.',
    description = N'Vòng tay phong thủy được xâu từ những viên đá thạch anh và mã não tự nhiên mài bóng thủ công mịn màng, mát lạnh khi chạm vào da. Màu sắc đá tự nhiên hài hòa, mang năng lượng tích cực bảo trợ bình an, sức khỏe và may mắn theo tín ngưỡng văn hóa phương Đông của cư dân vùng Chợ Lớn.'
WHERE slug = 'vong-tay-da-may-man';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/den-long.jpg',
    short_description = N'Đèn lồng đỏ trang trí mang nét văn hóa của người Hoa.',
    description = N'Chiếc đèn lồng vải gấm đỏ thắm truyền thống của các hội quán người Hoa vùng Chợ Lớn. Khung nan tre dẻo dai kết hợp tua rua vàng óng ánh rủ xuống mềm mại, có thể xếp gọn dễ dàng để vận chuyển. Khi treo thắp sáng tạo không gian ấm cúng, rực rỡ và tràn đầy vượng khí.'
WHERE slug = 'den-long-hoi-quan';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/tranh-cau-ba-son.jpg',
    short_description = N'Tranh in hình Cầu Ba Son, biểu tượng mới bên bờ sông Sài Gòn.',
    description = N'Bức tranh nghệ thuật chụp khoảnh khắc hoàng hôn tráng lệ buông xuống trên Cầu Ba Son vắt qua dòng sông Sài Gòn thơ mộng. Kiến trúc cầu dây văng hiện đại kết hợp những tòa nhà chọc trời lung linh ánh đèn phản chiếu mặt nước. In trên vải canvas cao cấp căng khung gỗ chống cong vênh, là điểm nhấn nội thất hiện đại cho ngôi nhà.'
WHERE slug = 'tranh-cau-ba-son';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/mat-ong.jpg',
    short_description = N'Mật ong rừng ngập mặn Cần Giờ thơm ngon, giàu dưỡng chất.',
    description = N'Mật ong hoa sú vẹt tự nhiên nguyên chất 100% thu hoạch từ khu dự trữ sinh quyển rừng ngập mặn Cần Giờ. Mật có màu vàng hổ phách sóng sánh, mùi thơm thảo mộc hoang dã và vị ngọt thanh đặc trưng không gắt. Rất giàu khoáng chất, enzyme tự nhiên và chất chống oxy hóa, đóng chai thủy tinh cao cấp kèm nút bần bảo quản.'
WHERE slug = 'mat-ong-rung-ngap-man';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/dau-dua.jpg',
    short_description = N'Dầu dừa nguyên chất ép lạnh, dùng nấu ăn và chăm sóc da, tóc.',
    description = N'Dầu dừa nguyên chất được chiết xuất bằng công nghệ ép lạnh ly tâm từ cơm dừa tươi Bến Tre, giữ trọn 100% axit lauric và vitamin E quý giá. Dầu trong suốt như nước khoáng, thơm ngậy mùi dừa tự nhiên, thẩm thấu nhanh không gây nhờn rít. Đa công dụng: dưỡng ẩm da, ủ mượt tóc, dưỡng môi hoặc dùng trong ẩm thực dưỡng sinh.'
WHERE slug = 'dau-dua-nguyen-chat';

UPDATE dbo.products SET
    image_path = '/images/souvenirs/duong-thot-not.jpg',
    short_description = N'Đường thốt nốt An Giang ngọt thanh, dùng nấu ăn và pha chế.',
    description = N'Đường thốt nốt dạng viên nén nấu hoàn toàn từ mật hoa cây thốt nốt vùng Bảy Núi An Giang theo phương pháp cô đặc thủ công truyền thống. Màu vàng nâu cánh gián tự nhiên, vị ngọt thanh mát dịu, thơm béo đặc trưng và giàu khoáng chất kali, sắt. Là gia vị hảo hạng để nấu chè, kho cá thịt hoặc pha chế nước giải khát miền Tây.'
WHERE slug = 'duong-thot-not-an-giang';
GO

