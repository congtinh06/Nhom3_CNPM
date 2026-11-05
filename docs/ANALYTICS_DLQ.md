# Analytics DLQ — phân tích và cách đọc

Hàng đợi chết: `analytics.event.dlq` (DLX `echora.analytics.dlx`, routing key `analytics.event.dlq`).

## 1. Vì sao message vào DLQ

Cấu hình trong `RabbitMQConfig`:

- Queue chính `analytics.event.queue` khai báo:
  - `x-dead-letter-exchange = echora.analytics.dlx`
  - `x-dead-letter-routing-key = analytics.event.dlq`
- Queue chết `analytics.event.dlq` bind vào DLX với routing key trên.
- Listener retry có `MessageConversionException` và `AmqpRejectAndDontRequeueException`
  là **non-retryable**. Vì vậy message sai schema bị reject ngay, không quay lại queue chính.

Có hai nhóm nguyên nhân thực tế:

1. **Sai schema / JSON hỏng** — `Jackson2JsonMessageConverter` ném
   `MessageConversionException` trước khi vào method listener:
   - JSON bị cắt cụt: `{"eventId":"...","eventType":"SCAN",`
   - sai kiểu: `"poiId":"not-a-number"` không deserialize được thành `Long`.
2. **Lỗi DB không phải trùng `event_id`** — `AnalyticsEventListener` chỉ nuốt
   `DataIntegrityViolationException` khi `event_id` đã tồn tại; các lỗi CHECK/NOT NULL khác
   được ném lại và đi vào DLQ.

## 2. Cách đọc message trong DLQ

Dùng `rabbitmqadmin` **trong container rabbitmq**, chế độ `ack_requeue_true` để đọc mà
không xoá message:

```powershell
docker compose exec -T rabbitmq rabbitmqadmin `
  -u echora_app -p 'SgVoice_Rabbit!2026' `
  get queue=analytics.event.dlq count=3 ackmode=ack_requeue_true
```

Các cột quan trọng:

| Cột | Ý nghĩa |
|---|---|
| `routing_key` | Luôn là `analytics.event.dlq` |
| `exchange` | `echora.analytics.dlx` — chứng minh message đi qua DLX |
| `message_count` | Số message còn lại trong queue sau lần đọc này |
| `payload` | Nội dung gốc; với message sai schema thường là JSON lỗi hoặc body bị cắt |
| `redelivered` | `false` = lần đầu bị đẩy sang DLQ |

Nếu payload là JSON hợp lệ, có thể pipe sang `jq` để đọc đẹp hơn. Với payload lỗi,
đọc nguyên văn rồi đối chiếu `eventId`/field sai kiểu với log analytics-service.

Xem log consumer:

```powershell
docker compose logs analytics-service --since 10m |
  Select-String -Pattern "MessageConversionException|InvalidFormatException|Retries exhausted"
```

## 3. Tái hiện 2 message (đã chạy thật)

Gửi trực tiếp vào exchange `echora.analytics` với routing key `analytics.event`:

```powershell
# Message 1: JSON bị cắt cụt
docker compose exec -T rabbitmq rabbitmqadmin -u echora_app -p 'SgVoice_Rabbit!2026' `
  publish exchange=echora.analytics routing_key=analytics.event `
  payload='{ "eventId": "dlq-repro-1", "eventType": "SCAN",'

# Message 2: sai kiểu poiId
docker compose exec -T rabbitmq rabbitmqadmin -u echora_app -p 'SgVoice_Rabbit!2026' `
  publish exchange=echora.analytics routing_key=analytics.event `
  payload='{"eventId":"dlq-repro-2","eventType":"SCAN","poiId":"not-a-number","occurredAt":"2026-11-04T00:00:00"}'
```

Kết quả đọc DLQ ngay sau đó (rút gọn):

```
+---------------------+----------------------+---------------+--------------------------------------------------------------------------------------------------------+
|     routing_key     |       exchange       | message_count |                                                payload                                                 |
+---------------------+----------------------+---------------+--------------------------------------------------------------------------------------------------------+
| analytics.event.dlq | echora.analytics.dlx | 2             | {eventId:123,eventType:{bad:true},occurredAt:not-a-date}                                               |
| analytics.event.dlq | echora.analytics.dlx | 1             | { "eventId": "dlq-repro-1", "eventType": "SCAN",                                                       |
| analytics.event.dlq | echora.analytics.dlx | 0             | {"eventId":"dlq-repro-2","eventType":"SCAN","poiId":"not-a-number","occurredAt":"2026-11-04T00:00:00"} |
+---------------------+----------------------+---------------+--------------------------------------------------------------------------------------------------------+
```

Log tương ứng:

```
Caused by: org.springframework.amqp.support.converter.MessageConversionException:
  Failed to convert Message content
Caused by: com.fasterxml.jackson.databind.exc.InvalidFormatException:
  Cannot deserialize value of type `java.lang.Long` from String "not-a-number"
Retries exhausted for message ... consumerQueue=analytics.event.queue
```

Sau khi ghi nhận, DLQ được dọn:

```powershell
docker compose exec -T rabbitmq rabbitmqadmin -u echora_app -p 'SgVoice_Rabbit!2026' `
  purge queue name=analytics.event.dlq
# analytics.event.dlq	0
```

> Ghi chú: câu "bomb 3 messages" trong ghi chú cũ chỉ là **ví dụ minh hoạ quy trình purge**
> (bơm message rồi purge để kiểm tra queue), không phải yêu cầu tạo 3 message thật.
> Lần tái hiện này dùng đúng 2 message như mô tả lỗi ban đầu, sau đó purge sạch.

## 4. Test tự động

| Test | Nội dung |
|---|---|
| `AnalyticsEventListenerTest#testHandleAnalyticsEvent_dataIntegrityViolation_nonDuplicate_rethrows` | Lỗi DB không phải trùng `event_id` bị ném lại để vào DLQ |
| `AnalyticsEventListenerTest#testHandleAnalyticsEvent_dataIntegrityViolation_caughtAndSkipped` | Trùng `event_id` do race được nuốt, không vào DLQ |
| `RabbitMQDlqConfigTest#mainQueueDeclaresDeadLetterRoute` | Queue chính có đúng DLX/routing key |
| `RabbitMQDlqConfigTest#dlqBindingTargetsDeadLetterExchange` | DLQ bind đúng DLX |
| `RabbitMQDlqConfigTest#truncatedJsonFailsConversion` | JSON cắt cụt → `MessageConversionException` |
| `RabbitMQDlqConfigTest#wrongFieldTypeFailsConversion` | `poiId` sai kiểu → `MessageConversionException` |
| `RabbitMQDlqConfigTest#conversionFailureIsNotRetried` | Conversion lỗi chỉ chạy 1 lần, bị reject thẳng sang DLQ |

Chạy riêng:

```powershell
cd backend
.\mvnw.cmd -pl analytics-service test `
  -Dtest=RabbitMQDlqConfigTest,AnalyticsEventListenerTest
```
