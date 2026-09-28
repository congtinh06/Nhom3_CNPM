# -*- coding: utf-8 -*-
"""Sinh file Word (.docx) BAO CAO REVIEW CHI TIET du an Anti-Phishing.

Khong can cai dat thu vien ngoai: goi .docx la mot ZIP chua XML chuan OOXML.
Van hanh:  python scripts/make_review_docx.py
Ket qua:    Bao-cao-Review-AntiPhishing.docx (ngay goc du an)
"""
import zipfile
from pathlib import Path

# ---------------------------------------------------------------------------
# 1. Noi dung bao cao (du lieu bay vao ham sinh document.xml)
# ---------------------------------------------------------------------------

TITLE = "BÁO CÁO REVIEW CHI TIẾT DỰ ÁN"
SUBTITLE = ("Hệ thống kiểm tra & cảnh báo web/SMS giả mạo ngân hàng "
            "(Anti-Phishing / Brand Protection Microservices)")
FOOTER_NOTE = ("Tài liệu được sinh tự động bởi quá trình review code — "
               "dựa trên toàn bộ mã nguồn hiện có trong repository.")

# Mỗi mục: (heading1, [heading2 hoặc ("P", đoạn văn), ("B", bullet), ("N", đánh số), ("T", tiêu đề bảng)])
CONTENT = [
    ("1. TỔNG QUAN DỰ ÁN", [
        ("P", "Dự án là một hệ thống phát hiện và cảnh báo lừa đảo (anti-phishing) "
              "cho ngân hàng, được xây dựng theo kiến trúc microservices. Người dùng "
              "gửi báo cáo về một URL hoặc tin nhắn SMS đáng ngờ; hệ thống kiểm tra URL "
              "đó qua nhiều nguồn dữ liệu lừa đảo (Google Safe Browsing, Phishunt, "
              "PhishTank), tính điểm rủi ro (risk score), sinh câu giải thích tự động "
              "đa ngôn ngữ (vi/en), rồi gửi cảnh báo qua email (Mailtrap) và SMS (Twilio) "
              "kèm ghi log kiểm toán (audit log) đầy đủ."),
        ("P", "Công nghệ chính: Java 17, Spring Boot 3.3.4, Spring Cloud Gateway + "
              "OpenFeign, RabbitMQ, SQL Server 2022 (mới chuyển từ PostgreSQL tháng "
              "2026-09), React 18 + TypeScript + Vite, Docker Compose, GitHub Actions CI, "
              "Render và Vercel để triển khai."),
    ]),
    ("2. KIẾN TRÚC HỆ THỐNG", [
        ("P", "Hệ thống gồm 10 service trong docker-compose.yml, chia 3 nhóm:"),
        ("N", ["Hạ tầng: rabbitmq (5672/15672), 3 database SQL Server riêng biệt cho "
               "từng service (mssql-link 1433, mssql-report 1434, mssql-notification 1435) "
               "và mssql-db-init — service chạy 1 lần để tạo database và seed dữ liệu.",
               "Nghiệp vụ: link-verification-service (8082) kiểm tra phishing; "
               "report-service (8081) nhận báo cáo; notification-service (8083) gửi "
               "email/SMS; narration-service (8084) sinh câu thuyết minh đa ngôn ngữ.",
               "Cổng vào: api-gateway (8080) dùng Spring Cloud Gateway định tuyến "
               "/api/v1/reports/**, /api/v1/verify/**, /api/v1/notifications/**, "
               "/api/v1/narrate/** đến đúng service; frontend React (5173) gọi vào gateway."]),
        ("P", "Luồng xử lý chính: Người dùng gửi báo cáo → api-gateway → report-service "
              "(lưu DB, trạng thái PENDING/VERIFIED) → gọi đồng bộ sang "
              "link-verification-service qua OpenFeign để chấm điểm → publish sự kiện "
              "ReportCreatedEvent lên exchange report.exchange (routing key "
              "report.created) → notification-service consume queue report.created.queue, "
              "gọi narration-service để sinh lời thuyết minh theo locale, gửi email/SMS "
              "và ghi notification_log."),
        ("P", "Điểm tốt của kiến trúc: mỗi service sở hữu database riêng (database-per-"
              "service, không JOIN chéo); giao tiếp bất đồng bộ qua RabbitMQ giúp phần "
              "gửi thông báo không chặn luồng chính; có mssql-db-init tách file schema "
              "theo marker \"-- SECTION-DB:\" để seed đúng từng database, script "
              "idempotent chạy lại không lỗi."),
    ]),
    ("3. REVIEW TỪNG THÀNH PHẦN", [
        ("T", "Bảng 1 — Đánh giá tổng quan từng service (thang điểm /10)"),
        ("P", "API Gateway (7/10): Định tuyến gọn, có CORS cấu hình đúng origin frontend, "
              "filter log request. Chưa có filter xác thực/token chung; các trang admin "
              "frontend chỉ chặn ở phía client (AuthContext role) nên dễ bị bypass — "
              "cần thêm JWT ở gateway nếu mở rộng."),
        ("P", "Report Service (8/10): Validation DTO tốt (@URL, @NotBlank, @Size), "
              "validator tùy biến @ValidReporterContact bắt buộc email khi kênh WEB và "
              "số điện thoại khi kênh SMS; RateLimitFilter dùng Bucket4j giới hạn 5 "
              "request/phút/IP cho POST /api/v1/reports và trả 429 kèm JSON; Global "
              "Exception Handler không lộ stack trace. Graceful degradation chuẩn: khi "
              "link-verification-service chết, báo cáo vẫn được lưu với trạng thái "
              "PENDING thay vì lỗi 500. Publish RabbitMQ sau khi lưu DB trong cùng "
              "@Transactional."),
        ("P", "Link Verification Service (8/10): Gọi 3 nguồn độc lập, mỗi nguồn bọc "
              "try/catch riêng nên 1 nguồn lỗi không ảnh hưởng kết quả chung; risk score "
              "tính tỷ lệ số nguồn flag / số nguồn trả lời thành công; ReasonCodeDetector "
              "sinh mã lý do (BLACKLISTED_DOMAIN, NO_HTTPS, BRAND_KEYWORD_MATCH, "
              "SHORT_URL_OBFUSCATION...) có allow-list tên miền ngân hàng thật để tránh "
              "báo sai; Mock Mode dự phòng cho demo khi mất mạng; lưu mọi kết quả vào "
              "verification_result. InternalApiKeyFilter chặn gọi lậu khi cấu hình "
              "INTERNAL_API_KEY."),
        ("P", "Notification Service (7.5/10): Consume RabbitMQ đúng queue/exchange, bỏ "
              "qua báo cáo an toàn (isPhishing khác TRUE), gọi narration-service có "
              "fallback nội dung mặc định, gửi email admin + người báo cáo, SMS Twilio "
              "tùy chọn, và quan trọng nhất: luôn ghi NotificationLog (SENT/FAILED kèm "
              "error_message) dù gửi thành công hay thất bại — đúng ràng buộc audit."),
        ("P", "Narration Service (7/10): Service nhỏ gọn dùng Spring MessageSource, "
              "template i18n vi/en, validate locale và reasonCodes (400 khi rỗng/không "
              "hỗ trợ). Không lưu DB, thuần tính toán."),
        ("P", "Frontend React (7/10): Cấu trúc page/component/context rõ ràng; axios "
              "client tập trung một chỗ, baseURL từ env VITE_API_BASE_URL, có timeout "
              "10s; router có trang admin bảo vệ bởi AdminRoute (chặn theo role). Lưu "
              "ý: role đang lưu phía client nên chỉ mang tính hiển thị — backend chưa "
              "xác thực token nên các API admin thực tế vẫn mở."),
        ("T", "Bảng 2 — Cơ sở dữ liệu (3 database độc lập, SQL Server 2022)"),
        ("P", "link_verification_db.verification_result: url, domain, is_phishing (BIT), "
              "risk_score NUMERIC(3,2) CHECK 0–1, sources, checked_at DATETIMEOFFSET; "
              "index trên domain và checked_at DESC."),
        ("P", "report_db.report: target_url, channel CHECK (WEB/SMS), reporter_contact, "
              "is_phishing, risk_score CHECK 0–1, status CHECK (PENDING/VERIFIED/"
              "NOTIFIED/FAILED), created_at; index status và created_at DESC; có 3 dòng "
              "seed mẫu (1 portal ngân hàng thật an toàn, 2 URL giả mạo)."),
        ("P", "notification_db.notification_log: report_id, channel CHECK (EMAIL/SMS), "
              "recipient, status CHECK (SENT/FAILED), sent_at, error_message; index theo "
              "report_id, status, sent_at DESC; seed mẫu audit log. Toàn bộ DDL có guard "
              "IF OBJECT_ID / IF NOT EXISTS nên chạy lại không lỗi, không nhân đôi data."),
    ]),
    ("4. ĐIỂM MẠNH NỔI BẬT", [
        ("B", ["Kiến trúc microservices chuẩn: tách responsibility rõ, database-per-service, "
               "giao tiếp đồng bộ (Feign) cho truy vấn và bất đồng bộ (RabbitMQ) cho sự kiện.",
               "Bảo mật nhiều lớp (defense-in-depth): INTERNAL_API_KEY giữa các service, "
               "rate limit chống spam, validation chặt cả DTO lẫn DB (CHECK constraint), "
               "không secret nào hardcode trong git (dùng .env).",
               "Chịu lỗi tốt: mock mode cho demo offline, graceful degradation ở cả 2 điểm "
               "gọi liên service (verify và narrate), luôn audit log mọi lần gửi thông báo.",
               "DevEx tốt: docker-compose một lệnh dựng đủ 10 container có healthcheck + "
               "depends_on điều kiện, seed DB tự động, CI riêng cho backend/frontend, "
               "render.yaml cho IaC, README chi tiết có sẵn kịch bản demo và curl test."]),
    ]),
    ("5. ĐIỂM CẦN CẢI TIỆN & KHUYẾN NGHỊ", [
        ("T", "Bảng 3 — Vấn đề và khuyến nghị sửa (xếp theo mức độ ưu tiên)"),
        ("P", "Ưu tiên CAO — (1) Bảng report thiếu cột locale nhưng event gửi kèm locale "
              "cho narration; nên bổ sung cột locale VARCHAR(10) để truy vết. (2) "
              "notification_db.notification_log.report_id không có khóa ngoại logic về "
              "report_db — chấp nhận được với database-per-service nhưng nên ghi chú rõ. "
              "(3) Chưa có chữ ký tín hiệu health cho rabbitmq publisher confirm "
              "(publisher-confirm-type) — nếu RabbitMQ sập sau khi lưu DB, sự kiện mất "
              "im lặng, nên bật confirm + retry."),
        ("P", "Ưu tiên TRUNG BÌNH — (4) RateLimitFilter lưu bucket theo IP trong "
              "ConcurrentHashMap không bao giờ dọn dẹp → có thể bị memory leak khi có "
              "nhiều IP; nên dùng Caffeine cache có TTL/expireAfterAccess. (5) "
              "InternalApiKeyFilter hiện áp cho MỌI request của service, kể cả actuator "
              "health — nên whitelist /actuator/health để healthcheck Docker không bị "
              "401. (6) Xác thực admin phía frontend (AuthContext) chưa có token backend "
              "hỗ trợ — ai biết URL vẫn gọi thẳng API. (7) reason_code không được lưu "
              "riêng trong report_db, chỉ nằm trong event — khó tái hiện."),
        ("P", "Ưu tiên THẤP — (8) application.yml các service vẫn còn comment cấu hình "
              "PostgreSQL cũ dễ gây nhầm lẫn, nên dọn khi ổn định. (9) Risk score chỉ là "
              "tỷ lệ nguồn flag — 1 nguồn flag trên 1 nguồn thành công cho 1.0 điểm tuyệt "
              "đối, nên cân nhắc trọng số theo độ tin cậy nguồn. (10) Chuẩn hóa cấu trúc "
              "thư mục: backend hiện có thư mục lạ \"link-verification-service;C\" tạo "
              "nhầm, nên xóa."),
    ]),
    ("6. LỖI DOCKER 'PORTS ARE NOT AVAILABLE' (HTTP 500) — CHẨN ĐOÁN & CÁCH SỬA", [
        ("P", "Hiện tượng: khi chạy docker compose up, Docker Desktop báo lỗi dạng "
              "\"Error response from daemon: driver failed programming external "
              "connectivity ... ports are not available: exposing port TCP 0.0.0.0:8080 "
              "-> 0.0.0.0, listen tcp 0.0.0.0:8080...\" kèm HTTP code 500 từ daemon."),
        ("P", "Nguyên nhân gốc (đã xác minh trực tiếp trên máy bạn): một tiến trình "
              "Windows khác đang chiếm cổng mà compose cần map ra ngoài. Kết quả netstat "
              "trên máy bạn cho thấy:"),
        ("B", ["Port 8080 (api-gateway): bị chiếm bởi tiến trình AgentService.exe — "
               "PID 6168, đường dẫn C:\\Program Files (x86)\\MiniTool ShadowMaker\\"
               "AgentService.exe. Đây là service của phần mềm backup MiniTool, chạy "
               "ngầm cùng Windows.",
               "Port 8084 (narration-service): bị chiếm bởi tiến trình java.exe PID "
               "25816 (JDK 17 tại D:\\Program Files\\Eclipse Adoptium) — tức là bạn đã "
               "từng chạy narration-service bằng mvnw spring-boot:run ngoài Docker và "
               "tiến trình đó vẫn còn sống.",
               "Các port 1433/1434/1435, 5672, 15672, 8082, 5173 hiện do Docker backend "
               "(PID 21752) và wslrelay (PID 30348) giữ — bình thường vì đó chính là "
               "các container đang chạy.",
               "Ngoài ra Windows đang khóa dải 8781–9680 (Hyper-V/WSL reserved ranges) "
               "— không trùng port của dự án nên không phải thủ phạm, nhưng cần biết "
               "để tránh chọn port trong dải này sau này."]),
        ("P", "Hậu quả cụ thể trong lần chạy gần nhất: api-gateway, report-service, "
              "notification-service, narration-service đang ở trạng thái Exited (255) — "
              "khởi động xong bị đẩy ra vì không bind được port (hoặc bị ảnh hưởng dây "
              "chuyền); các container SQL Server, RabbitMQ và mssql-db-init thì healthy "
              "và seed DB xong bình thường (log: \"All databases are created and "
              "seeded.\")."),
        ("T", "Bảng 4 — Bước xử lý lỗi port, theo thứ tự"),
        ("P", "Bước 1 — Dọn container cũ đang treo: mở terminal tại thư mục dự án chạy "
              "lệnh: docker compose down. Lệnh này dừng và xóa container của dự án "
              "(volume dữ liệu giữ nguyên)."),
        ("P", "Bước 2 — Giải phóng port 8080 (thủ phạm chính): tắt service MiniTool "
              "bằng lệnh admin: sc stop MTAgentService rồi chặn khởi động cùng Windows: "
              "sc config MTAgentService start= disabled (mở PowerShell Run as "
              "Administrator). Nếu bạn vẫn muốn dùng MiniTool ShadowMaker, chỉ cần stop "
              "trong lúc chạy dự án, hoặc đổi gateway sang port khác (xem Bước 4)."),
        ("P", "Bước 3 — Giải phóng port 8084: tắt tiến trình Java chạy narration ngoài "
              "Docker. Xác định PID: netstat -ano | findstr :8084 (trên máy bạn đang là "
              "PID 25816) rồi: taskkill /PID 25816 /F. Hoặc đơn giản hơn: chạy trong "
              "PowerShell lệnh taskkill /IM java.exe /F nếu không còn tiến trình Java "
              "nào khác cần giữ."),
        ("P", "Bước 4 — (Tùy chọn nếu không muốn tắt MiniTool) Đổi port gateway: sửa "
              "dòng \"8080:8080\" trong docker-compose.yml thành ví dụ \"9080:8080\" "
              "và đổi VITE_API_BASE_URL trong .env thành http://localhost:9080; lưu ý "
              "tránh dải Windows đã khóa 8781–9680. Tương tự có thể đổi 8084 thành "
              "9084 nếu cần."),
        ("P", "Bước 5 — Khởi động lại và kiểm chứng: docker compose up --build -d; "
              "sau đó docker compose ps — kỳ vọng toàn bộ service Up/healthy, không còn "
              "Exited (255); mở http://localhost:8080/actuator/health phải trả về "
              "{\"status\":\"UP\"}."),
        ("P", "Mẹo phòng tránh: sau khi khởi động lại Windows, Windows có thể tái khóa "
              "dải port Hyper-V mới; nếu gặp lại lỗi port lạ, kiểm tra nhanh bằng "
              "netsh interface ipv4 show excludedportrange protocol=tcp và netstat "
              "-ano | findstr :<port> để tìm thủ phạm trước khi đổi port."),
    ]),
    ("7. HƯỚNG DẪN VẬN HÀNH NHANH (CHEAT SHEET)", [
        ("N", ["Chạy toàn bộ hệ thống: docker compose up --build -d",
               "Xem trạng thái: docker compose ps; xem log: docker compose logs -f "
               "[tên-service]",
               "Dừng giữ nguyên dữ liệu: docker compose down; dừng xóa cả dữ liệu: "
               "docker compose down -v",
               "Điểm vào hệ thống: API Gateway http://localhost:8080; RabbitMQ UI "
               "http://localhost:15672 (guest/guest); Frontend: cd frontend && npm run "
               "dev → http://localhost:5173",
               "Chạy test backend: mvn -f backend/<service>/pom.xml test",
               "Cấu hình môi trường: sao chép .env.example thành .env rồi điền "
               "MSSQL_SA_PASSWORD, MAIL_USERNAME/PASSWORD (Mailtrap), GSB_API_KEY..."]),
    ]),
]

# ---------------------------------------------------------------------------
# 2. Bo tro sinh OOXML
# ---------------------------------------------------------------------------

def esc(text: str) -> str:
    return (text.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace('"', "&quot;"))


def run(text: str, bold=False, italic=False, size=26, color=None, font="Times New Roman"):
    rpr = ['<w:rFonts w:ascii="%s" w:hAnsi="%s" w:cs="%s"/>' % (font, font, font)]
    if bold:
        rpr.append("<w:b/>")
    if italic:
        rpr.append("<w:i/>")
    rpr.append('<w:sz w:val="%d"/><w:szCs w:val="%d"/>' % (size, size))
    if color:
        rpr.append('<w:color w:val="%s"/>' % color)
    return ('<w:r><w:rPr>%s</w:rPr><w:t xml:space="preserve">%s</w:t></w:r>'
            % ("".join(rpr), esc(text)))


def para(text_runs, justify="both", spacing_after=120, line=300,
         style=None, numbering=None, indent=None, spacing_before=None):
    ppr = []
    if style:
        ppr.append('<w:pStyle w:val="%s"/>' % style)
    if numbering:
        ppr.append('<w:numPr><w:ilvl w:val="0"/><w:numId w:val="%d"/></w:numPr>' % numbering)
    if indent:
        ppr.append('<w:ind w:left="%d"/>' % indent)
    if spacing_before is None:
        ppr.append('<w:spacing w:after="%d" w:line="%d" w:lineRule="auto"/>' % (spacing_after, line))
    else:
        ppr.append('<w:spacing w:before="%d" w:after="%d" w:line="%d" w:lineRule="auto"/>'
                   % (spacing_before, spacing_after, line))
    if justify == "both":
        ppr.append('<w:jc w:val="both"/>')
    return "<w:p><w:pPr>%s</w:pPr>%s</w:p>" % ("".join(ppr), text_runs)


CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>"""

ROOT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>"""

DOC_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>"""

CORE_PROPS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>Bao cao review chi tiet du an Anti-Phishing</dc:title>
<dc:creator>Codebuff (Buffy)</dc:creator>
<cp:lastModifiedBy>Codebuff (Buffy)</cp:lastModifiedBy>
<dcterms:created xsi:type="dcterms:W3CDTF">2026-09-28T00:00:00Z</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">2026-09-28T00:00:00Z</dcterms:modified>
</cp:coreProperties>"""

APP_PROPS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
<Application>Microsoft Office Word</Application>
</Properties>"""

STYLES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults>
  <w:rPrDefault><w:rPr>
    <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
    <w:sz w:val="26"/><w:szCs w:val="26"/>
  </w:rPr></w:rPrDefault>
  <w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault>
</w:docDefaults>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/>
  <w:pPr><w:jc w:val="center"/><w:spacing w:after="120"/></w:pPr>
  <w:rPr><w:b/><w:sz w:val="36"/><w:szCs w:val="36"/><w:color w:val="1F3864"/></w:rPr>
</w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/>
  <w:pPr><w:keepNext/><w:spacing w:before="280" w:after="140"/><w:outlineLvl w:val="0"/></w:pPr>
  <w:rPr><w:b/><w:sz w:val="30"/><w:szCs w:val="30"/><w:color w:val="1F3864"/></w:rPr>
</w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/>
  <w:pPr><w:keepNext/><w:spacing w:before="200" w:after="100"/><w:outlineLvl w:val="1"/></w:pPr>
  <w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/><w:color w:val="2E5395"/></w:rPr>
</w:style>
<w:style w:type="paragraph" w:styleId="TableTitle"><w:name w:val="Table Title"/><w:basedOn w:val="Normal"/>
  <w:pPr><w:keepNext/><w:jc w:val="center"/><w:spacing w:before="160" w:after="80"/></w:pPr>
  <w:rPr><w:b/><w:i/><w:sz w:val="24"/></w:rPr>
</w:style>
</w:styles>"""

# Numbering: numId 1 = bullet, numId 2 = so thu tu
NUMBERING = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>
  <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="&#8226;"/>
    <w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl>
</w:abstractNum>
<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>
  <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/>
    <w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
</w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
<w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>"""


def table_caption(text):
    return para(run(text, bold=True, italic=True, size=24), justify="center",
                spacing_after=80, style="TableTitle")


def build_table(rows):
    """rows: list of list of (text, bold)."""
    borders = ('<w:tblBorders>'
               + "".join('<w:%s w:val="single" w:sz="6" w:space="0" w:color="9CA3AF"/>' % s
                         for s in ("top", "left", "bottom", "right", "insideH", "insideV"))
               + '</w:tblBorders>')
    width = '<w:tblW w:w="0" w:type="auto"/><w:jc w:val="center"/>'
    out = ['<w:tbl><w:tblPr>%s%s</w:tblPr>' % (width, borders)]
    for i, row in enumerate(rows):
        out.append("<w:tr>")
        for cell_text, bold in row:
            shade = ('<w:shd w:val="clear" w:color="auto" w:fill="DCE6F1"/>'
                     if i == 0 else '')
            tcpr = ('<w:tcPr>%s<w:vAlign w:val="center"/></w:tcPr>' % shade)
            p = para(run(cell_text, bold=bold, size=22), justify="left", spacing_after=0)
            out.append('<w:tc>%s%s</w:tc>' % (tcpr, p))
        out.append("</w:tr>")
    out.append('</w:tbl>')
    out.append(para("", spacing_after=120))
    return "".join(out)


def build_document():
    body = []
    body.append(para(run(TITLE, bold=True, size=36, color="1F3864"),
                     justify="center", spacing_after=80))
    body.append(para(run(SUBTITLE, italic=True, size=26), justify="center", spacing_after=60))
    body.append(para(run(FOOTER_NOTE, italic=True, size=22, color="666666"),
                     justify="center", spacing_after=200))

    for heading, items in CONTENT:
        body.append(para(run(heading, bold=True, size=30, color="1F3864"),
                         spacing_after=140, style="Heading1"))
        bullet_idx = 0
        for kind, payload in items:
            if kind == "P":
                body.append(para(run(payload, size=26)))
            elif kind == "B":
                # danh sách nhiều phần tử -> mỗi phần tử 1 bullet
                for item in payload:
                    body.append(para(run(item, size=26), numbering=1, indent=360))
                bullet_idx += 1
            elif kind == "N":
                for item in payload:
                    body.append(para(run(item, size=26), numbering=2, indent=360))
            elif kind == "T":
                body.append(table_caption(payload))
                # Tự sinh bảng theo tiêu đề đã biết
                rows = make_table_rows(payload)
                if rows:
                    body.append(build_table(rows))
    body.append(para(run("— Hết báo cáo —", italic=True, size=22, color="666666"),
                     justify="center", spacing_before=200))

    sect = ('<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
            '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" '
            'w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>')
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            '<w:body>%s%s</w:body></w:document>' % ("".join(body), sect))


def make_table_rows(caption):
    """Sinh nội dung 4 bảng minh họa trong báo cáo."""
    if caption.startswith("Bảng 1"):
        return [
            [("Service", True), ("Port", True), ("Vai trò", True), ("Điểm /10", True)],
            [("api-gateway", False), ("8080", False), ("Cổng vào, định tuyến, CORS", False), ("7", False)],
            [("report-service", False), ("8081", False), ("Nhận báo cáo, rate limit, publish event", False), ("8", False)],
            [("link-verification-service", False), ("8082", False), ("Kiểm tra phishing 3 nguồn + mock", False), ("8", False)],
            [("notification-service", False), ("8083", False), ("Gửi email/SMS + audit log", False), ("7.5", False)],
            [("narration-service", False), ("8084", False), ("Thuyết minh i18n vi/en", False), ("7", False)],
            [("frontend (React/Vite)", False), ("5173", False), ("SPA người dùng", False), ("7", False)],
        ]
    if caption.startswith("Bảng 2"):
        return [
            [("Database", True), ("Bảng chính", True), ("Ràng buộc chính", True)],
            [("link_verification_db", False), ("verification_result", False),
             ("risk_score CHECK 0–1, NOT NULL url/domain/is_phishing/checked_at", False)],
            [("report_db", False), ("report", False),
             ("channel CHECK (WEB|SMS), status CHECK 4 giá trị, risk_score CHECK 0–1", False)],
            [("notification_db", False), ("notification_log", False),
             ("channel CHECK (EMAIL|SMS), status CHECK (SENT|FAILED)", False)],
        ]
    if caption.startswith("Bảng 3"):
        return [
            [("Ưu tiên", True), ("Vấn đề", True), ("Khuyến nghị", True)],
            [("CAO", False), ("Sự kiện RabbitMQ có thể mất khi broker sập sau khi lưu DB", False),
             ("Bật publisher-confirm + retry template", False)],
            [("CAO", False), ("Thiếu cột locale trong bảng report", False),
             ("Thêm cột locale VARCHAR(10) trong schema + entity", False)],
            [("TRUNG BÌNH", False), ("RateLimitFilter tích tụ bucket theo IP, không dọn", False),
             ("Dùng Caffeine cache expireAfterAccess", False)],
            [("TRUNG BÌNH", False), ("InternalApiKeyFilter chặn cả /actuator/health", False),
             ("Whitelist /actuator/** trong filter", False)],
            [("TRUNG BÌNH", False), ("Admin chỉ chặn ở frontend, API mở tự do", False),
             ("Thêm JWT/authentication ở gateway", False)],
            [("THẤP", False), ("Còn comment PostgreSQL cũ, thư mục rác 'link-verification-service;C'", False),
             ("Dọn dẹp khi ổn định", False)],
        ]
    if caption.startswith("Bảng 4"):
        return [
            [("Bước", True), ("Thao tác", True), ("Ghi chú", True)],
            [("1", False), ("docker compose down", False), ("Dọn container cũ", False)],
            [("2", False), ("sc stop MTAgentService; sc config MTAgentService start= disabled", False),
             ("Port 8080 do MiniTool chiếm — cần PowerShell Admin", False)],
            [("3", False), ("taskkill /PID <pid_java_8084> /F", False),
             ("Port 8084 do java.exe ngoài Docker chiếm", False)],
            [("4", False), ("Đổi port trong docker-compose.yml + .env (tùy chọn)", False),
             ("Tránh dải Windows khóa 8781–9680", False)],
            [("5", False), ("docker compose up --build -d; docker compose ps", False),
             ("Kiểm tra /actuator/health trả UP", False)],
        ]
    return None


def main():
    doc_xml = build_document()
    out = Path("Bao-cao-Review-AntiPhishing.docx")
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", CONTENT_TYPES)
        z.writestr("_rels/.rels", ROOT_RELS)
        z.writestr("docProps/core.xml", CORE_PROPS)
        z.writestr("docProps/app.xml", APP_PROPS)
        z.writestr("word/_rels/document.xml.rels", DOC_RELS)
        z.writestr("word/styles.xml", STYLES)
        z.writestr("word/numbering.xml", NUMBERING)
        z.writestr("word/document.xml", doc_xml)
    print("OK: %s (%.1f KB)" % (out, out.stat().st_size / 1024))


if __name__ == "__main__":
    main()
