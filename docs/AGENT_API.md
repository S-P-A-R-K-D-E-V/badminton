# Agent API — Kết nối cho AI Agent

API dành riêng cho AI agent / automation thao tác toàn quyền: CRUD lịch chơi
(session) + sân (court), CRUD người chơi trong lịch (registration), CRUD chi
phí từng buổi (cost), tạo mã QR thanh toán (VietQR) và gửi thông báo thanh
toán vào nhóm Telegram — **kể cả lịch đã diễn ra trong quá khứ**. Đây là API
riêng biệt với API admin dùng cookie (`/api/admin/...`), xác thực bằng API
key tĩnh nên phù hợp gọi từ server-to-server/agent mà không cần đăng nhập
trình duyệt.

## Xác thực

Mọi request gửi kèm header:

```
x-agent-key: <AGENT_API_KEY>
```

`AGENT_API_KEY` được cấu hình qua biến môi trường (xem `.env.example` và
`k8s/secret.yaml`). Thiếu hoặc sai key → `401 Unauthorized`.

**Base URL:** `https://<domain-cua-ban>` (xem `NEXT_PUBLIC_APP_URL` / ingress
host trong `k8s/deployment.yaml`).

## Tổng quan endpoint

| Method | Path | Chức năng |
|---|---|---|
| GET | `/api/agent/sessions` | Liệt kê toàn bộ lịch (cả cũ/mới), filter theo `from`, `to`, `status` |
| POST | `/api/agent/sessions` | Tạo lịch mới (ngày bất kỳ, kể cả ngày trong quá khứ) |
| GET | `/api/agent/sessions/:id` | Chi tiết 1 lịch: sân, toàn bộ đăng ký (mọi trạng thái), chi phí |
| PUT | `/api/agent/sessions/:id` | Sửa thông tin lịch hoặc chỉ đổi `status` |
| DELETE | `/api/agent/sessions/:id` | Xoá lịch |
| POST | `/api/agent/sessions/:id/courts` | Thêm sân vào 1 lịch |
| PUT | `/api/agent/courts/:id` | Sửa sân (tên/số slot/ngưỡng cảnh báo) |
| DELETE | `/api/agent/courts/:id` | Xoá sân |
| POST | `/api/agent/sessions/:id/players` | Thêm người chơi trực tiếp vào 1 sân |
| PUT | `/api/agent/registrations/:id` | Sửa người chơi (tên/hạng/trạng thái/đã thanh toán) |
| DELETE | `/api/agent/registrations/:id` | Huỷ đăng ký (thêm `?hard=true` để xoá hẳn) |
| GET | `/api/agent/sessions/:id/cost` | Xem chi phí buổi chơi |
| PUT | `/api/agent/sessions/:id/cost` | Cập nhật (upsert) chi phí buổi chơi |
| DELETE | `/api/agent/sessions/:id/cost` | Xoá chi phí đã chốt |
| POST | `/api/agent/payment-requests` | Tạo yêu cầu thanh toán + mã QR VietQR cho 1 nhóm đăng ký |
| GET | `/api/agent/payment-requests/:id` | Xem trạng thái 1 yêu cầu thanh toán (PENDING/CONFIRMED/REJECTED) |
| POST | `/api/agent/payment-requests/:id/notify` | Gửi thông báo thanh toán vào nhóm Telegram (kèm nút xác nhận/hủy cho admin) |

Tất cả body/response là JSON. Lỗi validate trả `400` kèm chi tiết field lỗi
(`{ error: { fieldErrors, formErrors } }`), lỗi không tìm thấy trả `404`.

---

## 1. Liệt kê lịch

```bash
curl -H "x-agent-key: $AGENT_API_KEY" \
  "https://domain/api/agent/sessions?from=2026-01-01&to=2026-12-31"
```

Bỏ `from`/`to`/`status` để lấy tất cả (kể cả lịch cũ). Kết quả gồm `courts[]`,
mỗi court có `registrations[]` (mọi trạng thái: CONFIRMED/WAITLIST/CANCELLED)
và `cost`.

## 2. Tạo lịch mới (kể cả gán ngày trong quá khứ)

```bash
curl -X POST -H "x-agent-key: $AGENT_API_KEY" -H "Content-Type: application/json" \
  https://domain/api/agent/sessions \
  -d '{
    "title": "Buổi tối thứ 3",
    "date": "2026-08-04",
    "startTime": "19:00",
    "endTime": "21:00",
    "location": "Nhà thi đấu Quận 1",
    "isRecurring": false,
    "status": "CLOSED",
    "courts": [
      { "name": "Sân 1", "maxSlots": 10, "warnAt": 8 }
    ]
  }'
```

`courts` là tuỳ chọn — có thể thêm sân sau bằng endpoint riêng. `status` tuỳ
chọn (mặc định `OPEN`), nhận `OPEN`/`CLOSED`/`CANCELLED` — hữu ích khi tạo bù
lịch cũ đã kết thúc.

## 3. Sửa / đổi trạng thái lịch (kể cả lịch cũ)

```bash
# Sửa toàn bộ thông tin
curl -X PUT -H "x-agent-key: $AGENT_API_KEY" -H "Content-Type: application/json" \
  https://domain/api/agent/sessions/SESSION_ID \
  -d '{"title":"...","date":"2026-08-04","startTime":"19:00","endTime":"21:00","location":"...","isRecurring":false}'

# Chỉ đổi trạng thái
curl -X PUT -H "x-agent-key: $AGENT_API_KEY" -H "Content-Type: application/json" \
  https://domain/api/agent/sessions/SESSION_ID -d '{"status":"CANCELLED"}'
```

## 4. Thêm sân vào lịch

```bash
curl -X POST -H "x-agent-key: $AGENT_API_KEY" -H "Content-Type: application/json" \
  https://domain/api/agent/sessions/SESSION_ID/courts \
  -d '{"name":"Sân 2","maxSlots":10,"warnAt":8}'
```

## 5. Thêm người chơi vào lịch (kể cả lịch cũ/đã đóng)

```bash
curl -X POST -H "x-agent-key: $AGENT_API_KEY" -H "Content-Type: application/json" \
  https://domain/api/agent/sessions/SESSION_ID/players \
  -d '{
    "courtId": "COURT_ID",
    "registrantName": "Nguyễn Văn A",
    "registrantPhone": "0912345678",
    "players": [
      { "playerName": "Nguyễn Văn A", "playerGender": "MALE", "playerRank": "TB" },
      { "playerName": "Trần Thị B", "playerGender": "FEMALE", "playerRank": "Y+" }
    ],
    "status": "CONFIRMED"
  }'
```

Endpoint này **không** kiểm tra lịch có đang `OPEN` hay còn slot trống —
agent chủ động chỉ định `status` (`CONFIRMED` mặc định, hoặc `WAITLIST`), phù
hợp để bổ sung người cho lịch cũ đã kết thúc.

## 6. Sửa / huỷ người chơi

```bash
# Sửa (playerName/playerGender/playerRank/status/isPaid/registrantName/registrantPhone — mọi field optional)
curl -X PUT -H "x-agent-key: $AGENT_API_KEY" -H "Content-Type: application/json" \
  https://domain/api/agent/registrations/REG_ID \
  -d '{"playerRank":"TB+","isPaid":true,"registrantName":"Nguyễn Văn A"}'

# Huỷ (soft — giữ lịch sử)
curl -X DELETE -H "x-agent-key: $AGENT_API_KEY" \
  https://domain/api/agent/registrations/REG_ID

# Xoá hẳn khỏi DB
curl -X DELETE -H "x-agent-key: $AGENT_API_KEY" \
  "https://domain/api/agent/registrations/REG_ID?hard=true"
```

## 7. Chi phí buổi chơi

```bash
# Xem
curl -H "x-agent-key: $AGENT_API_KEY" \
  https://domain/api/agent/sessions/SESSION_ID/cost

# Chốt/sửa (upsert — vừa tạo mới vừa cập nhật)
curl -X PUT -H "x-agent-key: $AGENT_API_KEY" -H "Content-Type: application/json" \
  https://domain/api/agent/sessions/SESSION_ID/cost \
  -d '{"courtFee":300000,"shuttlecockCost":150000,"supplyCost":50000,"otherCost":0,"note":"..."}'

# Xoá (chốt nhầm)
curl -X DELETE -H "x-agent-key: $AGENT_API_KEY" \
  https://domain/api/agent/sessions/SESSION_ID/cost
```

## 8. Tạo mã QR thanh toán + gửi thông báo Telegram

Chi phí buổi chơi (`cost`) phải được chốt trước (bước 7) — mỗi người
chơi/`registration` sẽ được tính `costPerPerson = tổng chi phí / số người
CONFIRMED trong buổi`. `registrationIds` lấy từ `registrations[].id` trong
`GET /api/agent/sessions/:id` — chỉ chọn được đăng ký `CONFIRMED` và chưa
`isPaid`.

```bash
# 1. Tạo yêu cầu thanh toán — trả về mã ngắn (BAD-XXXXXX) + ảnh QR sẵn dùng
curl -X POST -H "x-agent-key: $AGENT_API_KEY" -H "Content-Type: application/json" \
  https://domain/api/agent/payment-requests \
  -d '{"registrationIds": ["REG_ID_1", "REG_ID_2"]}'
# → { "id": "...", "code": "BAD-K3P9QZ", "totalAmount": 100000,
#     "qrUrl": "https://img.vietqr.io/image/...", "status": "PENDING", ... }
```

Nội dung chuyển khoản trên QR chỉ là mã ngắn (`code`) — không lộ tên/SĐT —
nhưng `id` của yêu cầu vẫn tra lại được đầy đủ registrationIds/tên/SĐT/số
tiền sau này, kể cả khi không gửi Telegram.

```bash
# 2. (tuỳ chọn) Gửi thông báo vào nhóm Telegram — kèm nút xác nhận/hủy cho admin
curl -X POST -H "x-agent-key: $AGENT_API_KEY" \
  https://domain/api/agent/payment-requests/PAYMENT_REQUEST_ID/notify
# → { "id": "...", "telegramSent": true }

# 3. Kiểm tra admin đã xác nhận qua Telegram chưa
curl -H "x-agent-key: $AGENT_API_KEY" \
  https://domain/api/agent/payment-requests/PAYMENT_REQUEST_ID
# → status: "PENDING" | "CONFIRMED" | "REJECTED"
```

Khi admin bấm "✅ Xác nhận đã trả" trên Telegram, toàn bộ `registrationIds`
trong yêu cầu tự động được đánh dấu `isPaid: true` — không cần agent gọi
thêm `PUT /api/agent/registrations/:id`.

Bước 2 cần `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID` đã cấu hình (khác với
`AGENT_API_KEY`) — thiếu 1 trong 2 thì request vẫn `200` nhưng
`telegramSent: false`, không có tin nhắn nào được gửi.

---

## Cấu hình

1. Thêm `AGENT_API_KEY` (chuỗi ngẫu nhiên đủ mạnh) vào secret:
   - Local: `.env` (xem `.env.example`)
   - K8s: `k8s/secret.yaml` → áp dụng lại `kubectl apply -f k8s/secret.yaml`
     rồi restart deployment (`kubectl rollout restart deployment/badminton-app`)
     để pod nhận biến môi trường mới.
2. Đưa key này cho agent lưu như một credential riêng, **không commit vào
   git**, không log ra ngoài.

## Ghi chú an toàn

- Toàn bộ endpoint `/api/agent/*` đều có quyền tương đương admin (tạo/sửa/xoá
  không giới hạn), kể cả trên lịch đã qua — chỉ chia sẻ `AGENT_API_KEY` cho
  agent/tool tin cậy.
- Muốn thu hồi quyền: đổi giá trị `AGENT_API_KEY` và deploy lại.
