# Circuit Breaker Audit

Ngày đo: 2026-11-04. Môi trường: Docker Compose đang chạy trên máy local, dữ liệu seed thật.

## 1. Phương pháp đo

Mỗi breaker được đo bằng **12 lần gọi thật** (nằm trong khoảng yêu cầu 10–20 lần), ghi
`p50` và `max`. Với breaker bọc lời gọi HTTP nội bộ, thời gian được đo **đúng lời gọi mà
breaker bọc** (không tính cache/DB của endpoint bên ngoài) bằng `wget`/`curl` từ container
gọi. Với breaker bọc tiến trình ngoài (edge-tts), đo trực tiếp lệnh `edge-tts` với đúng
văn bản của một POI thật.

| Breaker | Cách đo | Lệnh rút gọn |
|---|---|---|
| `contentAuthEntitlement` | content-service → auth-service, gọi 12 lần endpoint nội bộ | `wget -q -O /dev/null --header="X-Internal-Api-Key: $INTERNAL_API_KEY" http://auth-service:8086/api/auth/internal/entitlements/2/pois` |
| `locationContentService` | location-service → content-service qua `GET /api/location/nearby` (12 lần) | `curl -s -o NUL -w "%{http_code} %{time_total}" "http://localhost:18080/api/location/nearby?lat=10.7769&lng=106.7009&radius=1000"` |
| `orderContentPoiPrice` | order-service → content-service qua `POST /api/orders/poi` (12 lần, mỗi lần idempotency key mới) | `POST /api/orders/poi` body `{"poiId":1,"paymentMethod":"VIETQR"}` |
| `orderContentProductPrice` | order-service → content-service qua `POST /api/orders` (12 lần) | `POST /api/orders` body có `items=[{"productId":1,"quantity":1}]` |
| `translationMyMemory` | translation-service → MyMemory, gọi 12 lần với chunk 433 byte | `curl --get https://api.mymemory.translated.net/get --data-urlencode "q@/tmp/q.txt" --data-urlencode "langpair=vi\|en"` |
| `translationEdgeTts` | chạy `edge-tts` 12 lần với văn bản POI 1 (1923 ký tự / 2716 byte) | `edge-tts --voice vi-VN-HoaiMyNeural --file /tmp/tts-text.txt --write-media /tmp/tts-out.mp3 --write-subtitles /tmp/tts-out.vtt` |

## 2. Kết quả đo

| Instance | `slow-call-duration-threshold` (trước) | Client timeout | p50 | max | Kết luận |
|---|---:|---:|---:|---:|---|
| `contentAuthEntitlement` | 2s | 3s (read) | 0.035s | 0.075s | Hợp lệ: max < ngưỡng < timeout |
| `locationContentService` | 2s | 5s (read) | 0.141s | 0.223s | Hợp lệ: max < ngưỡng < timeout |
| `orderContentPoiPrice` | 2s | 3s (read) | 0.119s | 0.268s | Hợp lệ: max < ngưỡng < timeout |
| `orderContentProductPrice` | 2s | 3s (read) | 0.306s | 0.648s | Hợp lệ: max < ngưỡng < timeout |
| `translationMyMemory` | 2s | 10s (read) | 0.992s | 1.529s | Hợp lệ: max < ngưỡng < timeout |
| `translationEdgeTts` | **300s** | **120s** (`TTS_TIMEOUT_MS`) | 3.657s | 112.866s | **Vi phạm: ngưỡng > timeout**, call chậm không bao giờ được ghi nhận |

### Raw output (rút gọn)

```
contentAuthEntitlement: 75 38 59 30 31 26 38 35 36 34 30 29 ms
  n=12 min=0.026s p50=0.035s max=0.075s

locationContentService: 0.223 0.141 0.136 0.215 0.184 0.137 0.163 0.083 0.155 0.115 0.128 0.118 s
  n=12 min=0.083s p50=0.141s max=0.223s

orderContentPoiPrice: 0.268 0.138 0.119 0.095 0.119 0.123 0.107 0.107 0.102 0.118 0.122 0.099 s
  n=12 min=0.095s p50=0.119s max=0.268s

orderContentProductPrice: 0.315 0.208 0.238 0.315 0.306 0.648 0.381 0.385 0.252 0.190 0.216 0.192 s
  n=12 min=0.190s p50=0.306s max=0.648s

translationMyMemory: 1.529 1.266 0.875 0.976 0.937 0.993 1.028 1.057 0.899 1.334 0.983 0.951 s
  n=12 min=0.875s p50=0.992s max=1.529s

translationEdgeTts: 226839 4168 3552 2564 112866 7711 2628 4161 3657 2420 2347 143666 ms
  n=12 min=2.347s p50=3.657s max=112.866s (hai outlier 143s/226s vượt timeout 120s
  nên sẽ bị CommandRunner cắt; max hợp lệ trong timeout là 112.866s)
```

> Lưu ý: `orderContent*` đo qua endpoint có ghi DB nên thời gian **bao gồm** cả phần order-service;
> lời gọi content-service thực tế còn nhanh hơn. Vì vậy đây là cận trên an toàn.

## 3. Vi phạm và cách sửa

`translationEdgeTts` là breaker duy nhất vi phạm. Ngưỡng 300s lớn hơn timeout 120s của
`CommandRunner`, nghĩa là mọi lời gọi đều kết thúc (thành công hoặc timeout) trước khi
Resilience4j kịp phân loại là "slow". Ngưỡng cũ 2s thì ngược lại: mọi lời gọi TTS bình
thường (3–113s) đều bị coi là chậm và mở breaker sau 5 lần.

**Sửa:** đặt `slow-call-duration-threshold: 110s`.

- Nhỏ hơn timeout: `110s < 120s`, chừa đúng 10 giây — thỏa yêu cầu "ngưỡng chậm giữ dưới
  timeout ít nhất 10 giây". Call nào chạy 110–120s sẽ được ghi nhận là *slow* (đúng mục
  đích của ngưỡng), còn call vượt 120s bị `CommandRunner` kill và tính là *failure*.
- Không đặt ngưỡng thấp hơn: p50 chỉ 3.657s, nhưng max hợp lệ đo được là 112.866s; nếu đặt
  ngưỡng dưới 112.866s thì một POI dài bình thường cũng bị coi là chậm, dễ mở breaker oan.
- `slow-call-rate-threshold: 80%` vẫn giữ nguyên, nên một vài call chậm lẻ tẻ không mở breaker.

### Vì sao có lần 143s và 226s dù timeout là 120s?

Hai con số 143s/226s là thời gian **đo trực tiếp tiến trình `edge-tts` bằng `time`**, không
đi qua `ProcessCommandRunner`, nên không bị cắt ở 120s. Trong service, `EdgeTtsRunner` gọi
`CommandRunner.run(command, timeoutMs)`; `ProcessCommandRunner` dùng
`process.waitFor(timeoutMs, MILLISECONDS)`:

- `waitFor` trả `false` sau đúng `TTS_TIMEOUT_MS` (120s), không phụ thuộc việc tiến trình
  có tự thoát hay không.
- Khi đó code gọi `killProcessAndDescendants(process)`: duyệt `process.descendants()` và
  `destroyForcibly()` từng tiến trình con (python `edge-tts`) rồi `destroyForcibly()`
  tiến trình cha, sau đó ném `TtsTimeoutException` — call được đánh dấu **thất bại** cho
  breaker.

Bản trước đã có `destroyForcibly()` nhưng **không chờ** tiến trình thực sự thoát trước khi
ném lỗi, nên trong khoảng ngắn vẫn có thể thấy tiến trình python còn sống. Bản hiện tại chờ
tối đa 5s sau kill để bảo đảm tiến trình đã exit; nếu vẫn còn sống thì ghi log cảnh báo và
vẫn fail call (không treo request). Bằng chứng `ps aux` sau khi chạy 5 POI: không còn tiến
trình `edge-tts`/`python` nào (chỉ còn PID 1 là Java và một `[sh] <defunct>` có từ trước,
không phải tiến trình TTS).

Bốn breaker HTTP còn lại đã thỏa điều kiện `max < ngưỡng 2s < timeout` nên **không đổi**.

## 4. Trước / sau

| Instance | Trước | Sau |
|---|---:|---:|
| `contentAuthEntitlement` | 2s | 2s (không đổi) |
| `locationContentService` | 2s | 2s (không đổi) |
| `orderContentPoiPrice` | 2s | 2s (không đổi) |
| `orderContentProductPrice` | 2s | 2s (không đổi) |
| `translationMyMemory` | 2s | 2s (không đổi) |
| `translationEdgeTts` | **300s** | **110s** |

## 5. Bằng chứng breaker vẫn đóng sau khi đo

```
contentAuthEntitlement   bufferedCalls=3  failedCalls=0 slowCalls=0 state=CLOSED
locationContentService   bufferedCalls=10 failedCalls=0 slowCalls=0 state=CLOSED
orderContentPoiPrice     bufferedCalls=10 failedCalls=0 slowCalls=0 state=CLOSED
orderContentProductPrice bufferedCalls=10 failedCalls=0 slowCalls=0 state=CLOSED
translationMyMemory      bufferedCalls=0  failedCalls=0 slowCalls=0 state=CLOSED
translationEdgeTts       bufferedCalls=0  failedCalls=0 slowCalls=0 state=CLOSED
```

Lấy bằng `wget -qO- http://localhost:<port>/actuator/circuitbreakers` trong từng container.
`translationMyMemory`/`translationEdgeTts` có `bufferedCalls=0` vì phép đo được thực hiện
trực tiếp lên upstream/tiến trình (cùng lời gọi breaker bọc) chứ không qua endpoint nghiệp vụ.
