# SaigonVoice Event Contract

Tài liệu đặc tả hợp đồng sự kiện (Event Contract) giữa `content-service` và `translation-tts-service` thông qua RabbitMQ.

---

## 1. Kiến trúc Trao đổi Message

- **Exchange**: `saigonvoice.topic` (Loại `TopicExchange`, durable = true).
- **Dead Letter Exchange (DLX)**: `saigonvoice.dlx` (Loại `TopicExchange`).
- **Encoding**: UTF-8.
- **Content-Type**: `application/json`.
- **Nguyên tắc đồng bộ**:
  - `content-service` chịu trách nhiệm quản lý nội dung gốc tiếng Việt (`vi`) và điều phối trạng thái xuất bản (`publish_status`, `publish_event_type`).
  - `translation-tts-service` nhận sự kiện, tiến hành dịch sang các ngôn ngữ đích (`en`, `ja`, `ko`), sinh âm thanh (TTS), và phản hồi kết quả về `content-service`.
  - **Consumer (`translation-tts-service`) phải xử lý sự kiện `poi.created` và `poi.updated` giống hệt nhau**: Cả hai sự kiện đều mang toàn bộ nội dung tiếng Việt mới nhất của POI. Consumer duyệt danh sách `targetLanguages`, tính `contentHash`, kiểm tra cache âm thanh `tts_audio_cache`, và thực hiện dịch/TTS nếu có thay đổi.

---

## 2. Công thức Chuẩn hóa và Tính `contentHash`

Để `content-service` và `translation-tts-service` tính ra cùng một giá trị băm duy nhất và nhất quán, công thức chuẩn hóa và nối chuỗi được quy định chặt chẽ như sau:

### 2.1. Hàm làm sạch chuỗi `clean(s)`
Hàm `clean(s)` nhận vào một chuỗi $s$ bất kỳ và thực hiện:
- Nếu $s$ là `null` hoặc chuỗi rỗng sau khi xóa khoảng trắng (`s.trim().isEmpty()`): trả về chuỗi rỗng `""`.
- Ngược lại: trả về chuỗi đã được cắt bỏ toàn bộ khoảng trắng thừa ở hai đầu bằng `s.trim()`.

### 2.2. Chuỗi chuẩn hóa (Canonical String)
Chuỗi ghép nguồn ghép 5 thành phần theo thứ tự cố định, phân cách bằng ký tự điều khiển chuẩn **ASCII Unit Separator `\u001F`** (mã hex `0x1F`, mã thập phân `31`). 
Ký tự này không bao giờ xuất hiện trong văn bản tự nhiên của con người, loại bỏ hoàn toàn khả năng xung đột (collision) hoặc nhập nhằng (ambiguity) khi văn bản có chứa ký tự gạch đứng `|`, dấu phẩy hay dấu chấm phẩy:

```
canonicalString = clean(targetLanguageCode).toLowerCase()
                + "\u001F" + clean(viTitle)
                + "\u001F" + clean(viSummary)
                + "\u001F" + clean(viDescription)
                + "\u001F" + clean(viHistoricalSignificance)
```

Trong đó:
- `targetLanguageCode`: Mã ngôn ngữ đích viết thường (ví dụ: `"en"`, `"ja"`, `"ko"`).
- `viTitle`, `viSummary`, `viDescription`, `viHistoricalSignificance`: Nội dung **tiếng Việt nguồn** nhận được từ sự kiện `poi.created` hoặc `poi.updated`.

### 2.3. Thuật toán băm
- Thuật toán: **SHA-256**.
- Charset: **UTF-8**.
- Output: Chuỗi **64 ký tự thập lục phân (hex) viết thường**.

```java
// Cài đặt mẫu trong Java (ContentHashUtils.java)
public static String computeHash(String targetLang, String title, String summary, String description, String historicalSignificance) {
    String cleanLang = clean(targetLang).toLowerCase(Locale.ROOT);
    String cleanTitle = clean(title);
    String cleanSummary = clean(summary);
    String cleanDesc = clean(description);
    String cleanHist = clean(historicalSignificance);

    String raw = cleanLang + "\u001F" + cleanTitle + "\u001F" + cleanSummary + "\u001F" + cleanDesc + "\u001F" + cleanHist;
    try {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] digest = md.digest(raw.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder(64);
        for (byte b : digest) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    } catch (NoSuchAlgorithmException e) {
        throw new IllegalStateException("SHA-256 not available", e);
    }
}

public static String clean(String s) {
    return (s == null || s.isBlank()) ? "" : s.trim();
}
```

### 2.4. Hai ví dụ kiểm thử cố định (Test Vectors)

#### Ví dụ 1: Đầy đủ 5 trường có giá trị
- `targetLanguageCode`: `"en"`
- `viTitle`: `"Bưu điện Trung tâm"`
- `viSummary`: `"Tóm tắt mẫu"`
- `viDescription`: `"Mô tả chi tiết"`
- `viHistoricalSignificance`: `"Ý nghĩa lịch sử"`
- **Chuỗi nối thô (UTF-8 bytes)**:
  `en\u001fBưu điện Trung tâm\u001fTóm tắt mẫu\u001fMô tả chi tiết\u001fÝ nghĩa lịch sử`
- **Hash SHA-256 mong đợi**:
  `c6058aa86f5e0249240ce39c549bc35cbb64f58bd3cadd00ec4f7cf61206ee2c`

#### Ví dụ 2: Trường ý nghĩa lịch sử là `null`
- `targetLanguageCode`: `"ja"`
- `viTitle`: `"Nhà thờ Đức Bà"`
- `viSummary`: `"Tóm tắt kiến trúc"`
- `viDescription`: `"Mô tả nhà thờ"`
- `viHistoricalSignificance`: `null` (hoặc `""`)
- **Chuỗi nối thô (UTF-8 bytes)**:
  `ja\u001fNhà thờ Đức Bà\u001fTóm tắt kiến trúc\u001fMô tả nhà thờ\u001f`
- **Hash SHA-256 mong đợi**:
  `e86ff203fb7b2bbb6e6f8b89ef5207559429dc40b58e117229392d20203e01f9`

---

## 3. Đặc tả Chi tiết 4 Sự kiện

### 3.1. Sự kiện `poi.created`
- **Bên phát (Publisher)**: `content-service` (phát sau khi transaction tạo mới POI commit thành công).
- **Bên nhận (Consumer)**: `translation-tts-service`.
- **Routing Key**: `poi.created`
- **Queue chính**: `poi.created.queue`
- **Dead Letter Queue (DLQ)**: `poi.created.dlq`

#### Cấu trúc Payload:
| Tên Field | Kiểu Dữ Liệu | Bắt Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `poiId` | `Long` | Có | Khóa chính ID của POI trong cơ sở dữ liệu |
| `poiCode` | `String` | Có | Mã định danh duy nhất của POI (ví dụ: `"POI_MAU_01"`) |
| `zoneId` | `Long` | Có | ID khu vực du lịch mà POI trực thuộc |
| `sourceLanguage` | `String` | Có | Ngôn ngữ nguồn của nội dung đính kèm, luôn là `"vi"` |
| `title` | `String` | Có | Tiêu đề POI tiếng Việt |
| `summary` | `String` | Có | Tóm tắt POI tiếng Việt |
| `description` | `String` | Có | Mô tả chi tiết POI tiếng Việt |
| `historicalSignificance` | `String` | Không | Ý nghĩa lịch sử tiếng Việt (có thể `null`) |
| `targetLanguages` | `List<String>` | Có | Danh sách mã ngôn ngữ cần dịch và sinh giọng nói (ví dụ: `["en", "ja", "ko"]`) |

#### JSON mẫu (Dữ liệu trung tính):
```json
{
  "poiId": 101,
  "poiCode": "POI_MAU_01",
  "zoneId": 1,
  "sourceLanguage": "vi",
  "title": "Tên mẫu điểm tham quan",
  "summary": "Tóm tắt mẫu về điểm tham quan",
  "description": "Mô tả chi tiết mẫu về điểm tham quan phục vụ thử nghiệm hệ thống",
  "historicalSignificance": "Ý nghĩa lịch sử mẫu",
  "targetLanguages": [
    "en",
    "ja",
    "ko"
  ]
}
```

#### Quy tắc Retry:
- **Phía Publisher**: `PoiPublishService` ghi nhận `publish_status = PENDING`. Khi có lỗi broker/mạng, `PoiPublishRetryJob` quét định kỳ các POI còn `PENDING` và đã "nguội" > 30s để gửi lại. Nếu vượt quá `maxAttempts` (mặc định 5), POI chuyển sang `FAILED`. Admin có thể dùng `POST /api/content/admin/pois/{id}/republish` để reset số lần thử và gửi lại ngay.
- **Phía Consumer**: Nếu gặp lỗi tạm thời (timeout API dịch/TTS), Spring AMQP retry tối đa 3 lần. Nếu lỗi logic vĩnh viễn hoặc quá số lần retry, message chuyển về `poi.created.dlq`.

---

### 3.2. Sự kiện `poi.updated`
- **Bên phát (Publisher)**: `content-service` (phát sau khi transaction cập nhật POI có nội dung tiếng Việt thay đổi commit thành công).
- **Bên nhận (Consumer)**: `translation-tts-service`.
- **Routing Key**: `poi.updated`
- **Queue chính**: `poi.updated.queue`
- **Dead Letter Queue (DLQ)**: `poi.updated.dlq`

#### Cấu trúc Payload:
Cấu trúc giống hệt sự kiện `poi.created`:
| Tên Field | Kiểu Dữ Liệu | Bắt Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `poiId` | `Long` | Có | ID của POI |
| `poiCode` | `String` | Có | Mã POI |
| `zoneId` | `Long` | Có | ID khu vực |
| `sourceLanguage` | `String` | Có | Luôn là `"vi"` |
| `title` | `String` | Có | Tiêu đề tiếng Việt mới |
| `summary` | `String` | Có | Tóm tắt tiếng Việt mới |
| `description` | `String` | Có | Mô tả chi tiết tiếng Việt mới |
| `historicalSignificance` | `String` | Không | Ý nghĩa lịch sử mới (có thể `null`) |
| `targetLanguages` | `List<String>` | Có | Danh sách ngôn ngữ đích: `["en", "ja", "ko"]` |

#### JSON mẫu (Dữ liệu trung tính):
```json
{
  "poiId": 101,
  "poiCode": "POI_MAU_01",
  "zoneId": 1,
  "sourceLanguage": "vi",
  "title": "Tên mẫu điểm tham quan cập nhật",
  "summary": "Tóm tắt mẫu cập nhật",
  "description": "Mô tả chi tiết mẫu cập nhật phục vụ thử nghiệm hệ thống",
  "historicalSignificance": "Ý nghĩa lịch sử mẫu cập nhật",
  "targetLanguages": [
    "en",
    "ja",
    "ko"
  ]
}
```

#### Quy tắc Retry:
- Tương tự `poi.created`. `content-service` xác định routing key `poi.updated` thông qua cột `publish_event_type = 'POI_UPDATED'` trong bảng `poi`.
- Phía consumer xử lý hoàn toàn giống `poi.created`.

---

### 3.3. Sự kiện `poi.audio.ready`
- **Bên phát (Publisher)**: `translation-tts-service` (phát khi hoàn tất dịch và tổng hợp âm thanh thành công cho một ngôn ngữ).
- **Bên nhận (Consumer)**: `content-service` (`PoiAudioListener.onAudioReady`).
- **Routing Key**: `poi.audio.ready`
- **Queue chính**: `poi.audio.ready.queue`
- **Dead Letter Queue (DLQ)**: `poi.audio.ready.dlq`

#### Cấu trúc Payload:
| Tên Field | Kiểu Dữ Liệu | Bắt Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `poiId` | `Long` | Có | ID của POI |
| `languageCode` | `String` | Có | Mã ngôn ngữ của bản dịch (ví dụ: `"en"`, `"ja"`, `"ko"`, `"vi"`) |
| `title` | `String` | Có | Tiêu đề đã dịch |
| `summary` | `String` | Có | Tóm tắt đã dịch |
| `description` | `String` | Có | Mô tả chi tiết đã dịch |
| `historicalSignificance` | `String` | Không | Ý nghĩa lịch sử đã dịch (có thể `null`) |
| `audioUrl` | `String` | Có | Đường dẫn truy cập file âm thanh đã sinh |
| `audioDurationSeconds` | `Integer` | Không | Thời lượng âm thanh tính theo giây (mặc định 0 nếu null) |
| `audioStatus` | `String` | Có | Giá trị cố định: `"READY"` |
| `contentHash` | `String` | Có | Giá trị SHA-256 tính theo công thức mục 2 |

#### JSON mẫu (Dữ liệu trung tính):
```json
{
  "poiId": 101,
  "languageCode": "en",
  "title": "Sample Sightseeing Point",
  "summary": "Sample summary of the sightseeing point",
  "description": "Detailed sample description for system integration testing",
  "historicalSignificance": "Sample historical significance",
  "audioUrl": "http://localhost:8083/api/tts/audio/poi_101_en.mp3",
  "audioDurationSeconds": 120,
  "audioStatus": "READY",
  "contentHash": "c6058aa86f5e0249240ce39c549bc35cbb64f58bd3cadd00ec4f7cf61206ee2c"
}
```

#### Quy tắc Retry & Khử Mâu Thuẫn Phiên Bản:
- **Kiểm tra hợp lệ**: Nếu thiếu bất kỳ trường bắt buộc nào (`poiId`, `languageCode`, `title`, `summary`, `description`, `audioUrl`, `contentHash`) hoặc không tìm thấy bản dịch tiếng Việt ("vi") trong DB để đối chiếu, ném `AmqpRejectAndDontRequeueException` để đẩy message ngay lập tức vào `poi.audio.ready.dlq`, **không thử lại**.
- **Không tìm thấy POI**: Ném `ResourceNotFoundException`, kích hoạt Spring AMQP retry tối đa 3 lần. Nếu vẫn không thấy, message được chuyển vào DLQ.
- **Khử trùng lặp / lệch phiên bản (contentHash mismatch)**: Khi nhận sự kiện, `PoiAudioUpdateService` tính lại `expectedHash` từ nội dung tiếng Việt hiện tại của POI trong DB. Nếu `event.contentHash` không khớp với `expectedHash` (do POI đã bị cập nhật sang phiên bản mới trong lúc dịch), service **bỏ qua event (ghi log INFO, không ném lỗi, không cập nhật DB, không vào DLQ)**.
- **Xử lý thành công**: Nếu `contentHash` khớp, `PoiAudioUpdateService` cập nhật bản ghi `poi_translation` với `audio_status = 'READY'`, lưu `audio_url`, `content_hash` và cập nhật `updated_at`.

---

### 3.4. Sự kiện `poi.audio.failed`
- **Bên phát (Publisher)**: `translation-tts-service` (phát khi xảy ra lỗi trong quá trình dịch hoặc sinh âm thanh).
- **Bên nhận (Consumer)**: `content-service` (`PoiAudioEventListener.onAudioFailed`).
- **Routing Key**: `poi.audio.failed`
- **Queue chính**: `poi.audio.failed.queue`
- **Dead Letter Queue (DLQ)**: `poi.audio.failed.dlq`

#### Cấu trúc Payload:
| Tên Field | Kiểu Dữ Liệu | Bắt Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `poiId` | `Long` | Có | ID của POI |
| `languageCode` | `String` | Có | Mã ngôn ngữ bị lỗi (ví dụ: `"en"`, `"ja"`, `"ko"`, `"vi"`) |
| `audioStatus` | `String` | Có | Trạng thái lỗi (ví dụ: `"FAILED_TTS"`) |
| `errorMessage` | `String` | Có | Chi tiết thông điệp lỗi kỹ thuật |
| `contentHash` | `String` | Có | Giá trị SHA-256 tính theo công thức mục 2 (Bắt buộc để đối chiếu phiên bản) |
| `title` | `String` | Không | Tiêu đề đã dịch (nếu dịch thành công trước khi TTS lỗi) |
| `summary` | `String` | Không | Tóm tắt đã dịch (tùy chọn) |
| `description` | `String` | Không | Mô tả đã dịch (tùy chọn) |
| `historicalSignificance` | `String` | Không | Ý nghĩa lịch sử đã dịch (tùy chọn) |

#### JSON mẫu (Dữ liệu trung tính):
```json
{
  "poiId": 101,
  "languageCode": "en",
  "audioStatus": "FAILED_TTS",
  "errorMessage": "Edge TTS synthesis timeout after 15000ms",
  "contentHash": "c6058aa86f5e0249240ce39c549bc35cbb64f58bd3cadd00ec4f7cf61206ee2c",
  "title": "Sample Sightseeing Point",
  "summary": "Sample summary of the sightseeing point",
  "description": "Detailed sample description",
  "historicalSignificance": null
}
```

#### Quy tắc Retry & Khử Mâu Thuẫn Phiên Bản:
- **Kiểm tra hợp lệ**: Bắt buộc có các trường `poiId`, `languageCode`, `contentHash`. Nếu thiếu bất kỳ trường bắt buộc nào hoặc không tìm thấy bản dịch tiếng Việt ("vi") trong DB để đối chiếu hash, ném `AmqpRejectAndDontRequeueException` để đẩy message ngay lập tức vào `poi.audio.failed.dlq`, **không thử lại**.
- **Không tìm thấy POI**: Ném `ResourceNotFoundException`, kích hoạt Spring AMQP retry tối đa 3 lần. Nếu vẫn không thấy, message được chuyển vào DLQ.
- **Khử trùng lặp / lệch phiên bản (contentHash mismatch)**: Khi nhận sự kiện, `PoiAudioUpdateService` tính lại `expectedHash` từ nội dung tiếng Việt hiện tại của POI trong DB. Nếu `event.contentHash` không khớp với `expectedHash` (do POI đã bị cập nhật sang phiên bản mới trong lúc dịch/TTS), service **bỏ qua event (ghi log INFO, không ném lỗi, không cập nhật DB, không vào DLQ)**.
- **Xử lý thành công**: Nếu `contentHash` khớp, `PoiAudioUpdateService` cập nhật bản ghi `poi_translation` với `audio_status = 'FAILED_TTS'`, đặt `audio_url = NULL`, gán `content_hash` và cập nhật `updated_at`. Nếu payload có kèm văn bản đã dịch (`title`, `summary`, `description`), lưu văn bản đó để Frontend hiển thị và đọc bằng Web Speech API.
