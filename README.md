# Chuyển hồ sơ MoMo Jobs → iPOS HRM

Dashboard và dịch vụ nền đẩy hồ sơ ứng viên từ Merchant Job Board sang iPOS HRM.
Đây là bản demo cho request #26 ("Webhook khi có user mới apply"), chạy độc lập với repo chính
nên deploy được ngay mà không cần đụng vào code đang chạy PROD.

## Cách hoạt động

```
Partner API (Merchant Job Board)                     iPOS HRM
GET  .../jobs/{job}               lấy internalId ─┐
GET  .../jobs/{job}/applications  hồ sơ chưa import ─► kiểm tra dữ liệu ─► POST /api/v2/job-application/webhook
PATCH .../applications/mark-imported  ◄── chỉ những hồ sơ HRM đã nhận (200)
```

- `external_application_id` = id hồ sơ trên MoMo, `external_job_id` = `internalId` của tin (đúng như tài liệu webhook yêu cầu).
- `applied_at` đổi từ ISO sang Unix giây; `cv_url` dạng tương đối được ghép domain của Partner API.
- Hồ sơ **thiếu email hoặc email sai** bị giữ lại (HRM bắt buộc email, còn form MoMo để email tuỳ chọn).
- Retry đúng theo tài liệu HRM: 429 chờ `Retry-After`, 5xx/lỗi mạng chờ tăng dần, các lỗi khác không retry.
  Webhook idempotent nên gửi lại không tạo trùng.
- Hồ sơ bị chặn hoặc bị HRM từ chối **không** bị đánh dấu imported, lượt sau sẽ thử lại.
- Màn hình che bớt SĐT và email ứng viên.

## Chạy demo

Không cần biến môi trường nào: thiếu key là app tự chạy **chế độ demo** với 3 tin và 7 hồ sơ giả
(có sẵn ca thiếu email, email sai, và tin bị HRM tắt kênh trả 404).

```bash
npm install
npm run dev     # mở http://localhost:3000
```

Dữ liệu demo nằm trong bộ nhớ server, tự reset khi Vercel khởi động lại function; có nút "Đặt lại dữ liệu demo".

## Deploy lên Vercel

1. Đẩy thư mục này lên một repo GitHub (nên đặt trong org của team, không phải tài khoản cá nhân).
2. Vào vercel.com → **Add New → Project** → chọn repo → **Deploy**. Không cần chỉnh gì, Vercel tự nhận Next.js.
3. Muốn nối dữ liệu thật: **Settings → Environment Variables**, thêm các biến dưới đây, rồi **Redeploy**.

| Biến | Bắt buộc khi chạy thật | Ghi chú |
| --- | --- | --- |
| `PARTNER_BASE_URL` | Không | Mặc định là UAT `.../api/v1/partner` |
| `PARTNER_API_KEY` | Có | Key Partner API |
| `PARTNER_IMPORT_STATUS` | Không | Mặc định `new`. Tài liệu ghi lẫn `new`/`pending`, cần thử trên UAT |
| `HRM_BASE_URL`, `HRM_API_KEY` | Có | HRM cấp riêng cho từng môi trường |
| `RELAY_JOBS` | Có | `merchantExternalId:jobExternalId,...` — Partner API chưa có endpoint liệt kê tin |
| `RELAY_MARK_IMPORTED` | Không | Mặc định `true` |
| `DASHBOARD_PASSWORD` | Có | Bật đăng nhập cho dashboard. Thiếu biến này app sẽ khoá dữ liệu thật |
| `CRON_SECRET` | Có (để chạy tự động) | Vercel tự gửi kèm khi gọi cron |

Thiếu bất kỳ key nào trong `PARTNER_API_KEY`, `HRM_API_KEY`, `HRM_BASE_URL` thì app vẫn ở chế độ demo.

**Lịch tự động:** `vercel.json` đặt cron 1 lần/ngày (01:00 UTC) vì gói Hobby chỉ cho cron hằng ngày.
Gói Pro có thể đổi thành `*/10 * * * *`.

## Thử trên UAT trước khi lên PROD (theo checklist của HRM)

1. Gửi 1 hồ sơ → HRM trả 200, `stage = NEW`.
2. Bấm gửi lại hồ sơ đó (đặt `RELAY_MARK_IMPORTED=false` khi thử) → cùng `data.id`, không tạo trùng.
3. Thêm một tin sai mã vào `RELAY_JOBS` → hiện lỗi 404 ở tin đó, các tin khác vẫn chạy.
4. Xem log cron trong Vercel → Logs (log chỉ có số lượng, không có thông tin ứng viên).

## Cần chốt trước khi chạy thật

- **Pull hay push?** Nếu iPOS vẫn đang tự kéo hồ sơ qua Partner API thì không chạy cả hai cùng lúc:
  relay đánh dấu `imported` sẽ làm hồ sơ biến khỏi luồng kéo của iPOS.
- **Email bắt buộc:** hoặc bật `requireEmail` cho tin đồng bộ từ iPOS, hoặc xin HRM nới điều kiện.
- **Link CV:** HRM cần link còn hiệu lực lâu dài. Cần xác nhận `/api/cv/[id]` có truy cập được từ phía HRM không.
- **Về lâu dài** nên gọi webhook ngay trong luồng apply của repo chính thay vì chạy định kỳ; logic trong
  `lib/relay.ts` và `lib/hrm.ts` có thể chuyển sang nguyên vẹn.

## Cấu trúc

```
app/page.tsx              trang chính (server): kiểm tra cấu hình, chạy thử
app/dashboard.tsx         giao diện
app/api/relay/route.ts    GET = kiểm tra thử, POST = gửi
app/api/cron/relay        Vercel Cron gọi định kỳ
lib/relay.ts              luồng chính: lấy hồ sơ → kiểm tra → gửi → đánh dấu
lib/partner.ts            client Partner API
lib/hrm.ts                client webhook HRM + retry
lib/mock.ts               dữ liệu demo
middleware.ts             đăng nhập bằng DASHBOARD_PASSWORD
```
