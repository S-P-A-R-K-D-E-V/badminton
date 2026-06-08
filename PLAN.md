# 🏸 SPARK Badminton Tracker — Project Plan (Final)

## 1. Stack Final

### ✅ Next.js 14 App Router + Prisma + PostgreSQL

```
App:         Next.js 14 (App Router + API Routes)
ORM:         Prisma
DB:          PostgreSQL (có sẵn trên VPS)
Styling:     Tailwind CSS + shadcn/ui
Notification: grammy (Telegram Bot)
Deploy:      Docker → k3s (VPS, domain sẵn)
```

### Tại sao Next.js thay vì alternatives?

| Tiêu chí | Next.js 14 | Hono + Vite | SvelteKit |
|---|---|---|---|
| MVP speed | ⭐⭐⭐ | ⭐⭐ (2 services) | ⭐⭐⭐ |
| Ecosystem | Lớn nhất | Nhỏ | Trung bình |
| k8s deploy | 1 image | 2 images | 1 image |
| Team quen thuộc | Cao | Thấp | Thấp |
| Type safety | ✅ Prisma | ✅ | ✅ |

> **Dùng API Routes (không Server Actions)** — REST rõ ràng, dễ test, dễ debug hơn.

### k3s Architecture

```
Ingress (Nginx/Traefik)
  └── Service: badminton-app
        └── Deployment: next.js app (1-2 pods)
              ├── ENV: DATABASE_URL → PostgreSQL (external)
              └── ENV: TELEGRAM_BOT_TOKEN

CronJob: send-reminders (chạy trước buổi chơi 2h)
```

---

## 2. Rank System

```typescript
// Thứ tự từ thấp đến cao
enum BaseRank { NB, Y, TBY, TB, TBK, K }
enum Modifier { MINUS_MINUS = "--", MINUS = "-", NONE = "", PLUS = "+", PLUS_PLUS = "++" }

// Lưu DB dạng string: "NB", "Y-", "Y", "Y+", "TBY--", "K++"
// Validate regex: /^(NB|Y|TBY|TB|TBK|K)(\+\+|\+|--|-)? $/
```

---

## 3. Business Rules

| Rule | Value |
|------|-------|
| Max per court | 10 người |
| Warning threshold | ≥ 8 người |
| Cancel deadline | 2h trước `start_time` |
| Recurring session | Admin confirm thủ công từng tuần |
| Đăng ký hộ | 1 lần đăng ký N người, cùng SĐT người đứng đăng ký |
| Notification | Telegram Bot (gửi trước 2h qua chat/group) |

---

## 4. Data Model (Prisma Schema)

```prisma
model Session {
  id           String   @id @default(cuid())
  title        String
  date         DateTime @db.Date
  startTime    DateTime @db.Time
  endTime      DateTime @db.Time
  location     String
  isRecurring  Boolean  @default(false)
  status       SessionStatus @default(OPEN)
  createdBy    String
  createdAt    DateTime @default(now())
  courts       Court[]
}

model Court {
  id            String   @id @default(cuid())
  sessionId     String
  session       Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  name          String   // "Sân A", "Sân B"
  maxSlots      Int      @default(10)
  warnAt        Int      @default(8)
  registrations Registration[]
}

model Registration {
  id                  String   @id @default(cuid())
  courtId             String
  court               Court    @relation(fields: [courtId], references: [id])
  registrantName      String   // Người đứng đăng ký
  registrantPhone     String
  playerName          String   // Người chơi thực
  playerGender        Gender
  playerRank          String   // "Y+", "TB", "K--" etc.
  isProxy             Boolean  @default(false)  // đăng ký hộ
  cancelToken         String   @unique @default(cuid())
  status              RegStatus @default(CONFIRMED)
  notified            Boolean  @default(false)
  registeredAt        DateTime @default(now())
  cancelledAt         DateTime?
}

model Admin {
  id        String    @id @default(cuid())
  name      String
  role      AdminRole @default(ADMIN)
  pinHash   String    // bcrypt(6-digit PIN)
  createdAt DateTime  @default(now())
}

enum SessionStatus { OPEN CLOSED CANCELLED }
enum Gender        { MALE FEMALE OTHER }
enum RegStatus     { CONFIRMED CANCELLED WAITLIST }
enum AdminRole     { SUPER_ADMIN ADMIN }
```

---

## 5. API Routes

```
# Public (no auth)
GET    /api/sessions              → list upcoming sessions
GET    /api/sessions/:id          → detail + courts + registration counts
POST   /api/sessions/:id/register → đăng ký (1 hoặc nhiều người)
DELETE /api/cancel/:token         → hủy đăng ký

# Admin (PIN auth via session cookie)
POST   /api/admin/login
GET    /api/admin/sessions
POST   /api/admin/sessions
PUT    /api/admin/sessions/:id
DELETE /api/admin/sessions/:id
POST   /api/admin/sessions/:id/courts
DELETE /api/admin/courts/:id
GET    /api/admin/sessions/:id/registrations
POST   /api/admin/registrations/:id/cancel
```

---

## 6. Telegram Bot

Dùng **[grammy](https://grammy.dev/)** — lightweight, TypeScript-native.

```
Bot commands:
/upcoming     → Danh sách buổi chơi sắp tới
/register     → Link đăng ký
/myregistrations <phone> → Xem đăng ký của mình

Tự động gửi:
- Khi sân đầy (10 người) → thông báo group
- Khi sân cảnh báo (≥8) → thông báo admin
- 2h trước buổi → nhắc toàn bộ người đã đăng ký (CronJob)
```

Bot chạy trong **cùng Next.js app** via `/api/telegram/webhook` endpoint (webhook mode, không polling).

---

## 7. Project Structure

```
spark-badminton/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                 # Danh sách buổi chơi
│   │   ├── session/[id]/page.tsx    # Chi tiết + form đăng ký
│   │   └── cancel/[token]/page.tsx  # Confirm hủy
│   └── admin/
│       ├── login/page.tsx
│       ├── sessions/page.tsx
│       └── sessions/[id]/page.tsx   # Quản lý sân + registrations
├── app/api/
│   ├── sessions/route.ts
│   ├── sessions/[id]/
│   │   ├── route.ts
│   │   └── register/route.ts
│   ├── cancel/[token]/route.ts
│   ├── admin/[...]/route.ts
│   └── telegram/webhook/route.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── lib/
│   ├── db.ts            # Prisma singleton
│   ├── auth.ts          # Admin PIN verify
│   ├── bot.ts           # grammy bot instance
│   └── reminder.ts      # Logic gửi nhắc nhở
├── components/
│   ├── SessionCard.tsx
│   ├── CourtBoard.tsx   # Hiển thị slots real-time
│   └── RegisterForm.tsx
└── k8s/
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    ├── secret.yaml
    └── cronjob.yaml     # Send reminders
```

---

## 8. k3s Manifests (outline)

```yaml
# deployment.yaml
image: ghcr.io/spark/badminton-app:latest
env:
  - DATABASE_URL (from Secret)
  - TELEGRAM_BOT_TOKEN (from Secret)
  - TELEGRAM_WEBHOOK_URL
resources:
  requests: { cpu: 100m, memory: 128Mi }
  limits:   { cpu: 500m, memory: 256Mi }

# cronjob.yaml — chạy mỗi 15 phút để check & gửi reminder
schedule: "*/15 * * * *"
```

---

## 9. MVP Roadmap

### Sprint 1 — Week 1: Foundation
- [ ] Init Next.js + Prisma + PostgreSQL
- [ ] Prisma schema + seed data
- [ ] Public pages: list sessions, session detail
- [ ] Register form (single + proxy)
- [ ] Cancel via token

### Sprint 2 — Week 2: Admin + Bot
- [ ] Admin PIN login
- [ ] CRUD sessions + courts
- [ ] Registration management dashboard
- [ ] Capacity warning/lock logic
- [ ] Telegram bot: webhook + /upcoming command
- [ ] Telegram notification: sân đầy, cảnh báo 8

### Sprint 3 — Week 3: Deploy + Polish
- [ ] Dockerfile (multi-stage)
- [ ] k8s manifests
- [ ] CronJob reminder (2h trước)
- [ ] GitHub Actions CI/CD → push image → ArgoCD sync
- [ ] Mobile responsive
- [ ] E2E test nhẹ

---

## 10. GitHub Actions + ArgoCD Flow

```
Push to main
  → GitHub Actions: build & push Docker image to GHCR
    → ArgoCD detects new image tag
      → Sync deployment lên k3s
```

---

## 11. Estimated Timeline

| Sprint | Duration | Deliverable |
|--------|----------|-------------|
| Sprint 1 | 1 tuần | Public flow hoàn chỉnh |
| Sprint 2 | 1 tuần | Admin + Telegram bot |
| Sprint 3 | 1 tuần | Deploy live trên k3s |
| **Total** | **~3 tuần** | **MVP live** |
