# MoMo Jobs – trang việc làm, cổng quản lý tuyển dụng và công cụ chuyển hồ sơ sang iPOS

Project gồm 3 phần dùng chung một kho dữ liệu, deploy một lần lên Vercel:

| Đường dẫn | Dành cho | Nội dung |
| --- | --- | --- |
| `/jobs` | Ứng viên (public) | Tìm việc theo từ khoá, tỉnh/thành, quận (tối đa 5), loại hình, mức lương, thương hiệu; sắp xếp Đề xuất / Mới nhất / Cũ nhất / Lương cao / Gần tôi |
| `/jobs/[id]` | Ứng viên | Chi tiết tin, địa điểm + chỉ đường, ứng tuyển (form hoặc link ngoài), chia sẻ, lối sang Lộ trình nghề và Đối chiếu CV |
| `/brand/[slug]` | Ứng viên | Trang tuyển dụng của từng thương hiệu (giữ nguyên slug như trang cũ) |
| `/faq` | Ứng viên | Câu hỏi thường gặp (nội dung từ sheet Tracking) |
| `/portal` | Merchant + MoMo vận hành (đăng nhập) | Đăng/sửa/tạm dừng tin, nhận hồ sơ và CV, cập nhật trạng thái tới khi đi làm, theo dõi theo thương hiệu |
| `/relay` | Nội bộ (có mật khẩu) | Công cụ đẩy hồ sơ sang iPOS HRM, mô tả bên dưới |

`/` tự chuyển sang `/jobs`.

## Trang việc làm

Giữ lại gần như toàn bộ tính năng của trang `/jobs` cũ (theo tài liệu Handover): bộ lọc tỉnh/quận/loại hình/lương/thương hiệu,
sắp xếp "Đề xuất" theo thứ tự merchant tự sắp, "Xem thêm", lọc theo vị trí GPS, badge "Đã xác thực iPOS",
form ứng tuyển (họ tên, SĐT, email và CV tuỳ chọn, thời gian liên lạc) với câu đồng ý của Legal,
ứng tuyển qua link ngoài khi tin dùng `directUrl`, khối "Trang tuyển dụng của thương hiệu", nút chia sẻ.
Bộ lọc nằm trên URL nên gửi link là người nhận thấy đúng kết quả.

- **Dữ liệu:** mặc định là các tin đang tuyển trong `/portal` (lần đầu tự nạp dữ liệu mẫu: 17 tin, 8 thương hiệu đối tác). Đặt `JOBS_SOURCE_URL` để đọc tin thật từ
  API cũ `GET /api/worker/jobs`; phần chuyển đổi đọc theo tên cột trong Prisma schema và **cần kiểm tra lại khi có source code**.
  Đọc lỗi thì trang tự quay về dữ liệu mẫu và hiện thông báo.
- **Ứng tuyển:** hồ sơ và CV được lưu vào kho và hiện ngay trong `/portal`. Cùng SĐT nộp lại cùng tin trong 24 giờ thì không tạo trùng.
- **Font:** copy `MoMoTrustSans-Regular.otf`, `MoMoTrustSans-Medium.otf`, `MoMoTrustDisplay.otf` từ repo cũ vào `public/fonts/`
  là trang dùng font MoMo; chưa có thì dùng Be Vietnam Pro.
- **Logo:** chưa có ảnh nên hiển thị chữ viết tắt trên màu thương hiệu; dữ liệu thật có `logoUrl` thì tự dùng ảnh.

## Cổng quản lý tuyển dụng (`/portal`)

Luồng khép kín: merchant đăng tin ở `/portal` → tin hiện ngay ở `/jobs` → ứng viên nộp hồ sơ (kèm CV) → hồ sơ về `/portal`
→ merchant gọi, cập nhật trạng thái tới **Đã đi làm** → MoMo theo dõi tỉ lệ đi làm theo từng thương hiệu.

**Hai vai trò**
- **Merchant**: chỉ thấy tin và hồ sơ của thương hiệu mình (kể cả khi đoán link hay gọi thẳng API).
- **MoMo vận hành (admin)**: thấy mọi thương hiệu, đăng tin hộ, tạm dừng tin vi phạm kèm lý do (merchant thấy lý do),
  xem bảng theo thương hiệu: tỉ lệ đã cập nhật trạng thái, hồ sơ quá hạn, phỏng vấn, đi làm. Có lối sang `/relay`.

**Tính năng**
- Tổng quan: tin đang tuyển, hồ sơ mới 7 ngày, **hồ sơ chưa liên hệ sau 7 ngày** (cam kết với ứng viên trong FAQ), số người đã đi làm,
  phễu Mới nộp → Đang xem xét → Đã phỏng vấn → Đã nhận → Đã đi làm.
- Tin tuyển dụng: lọc theo trạng thái; form đăng tin (cửa hàng, lương theo giờ/ca/tháng/thoả thuận, mô tả từng dòng, bắt buộc email/CV,
  nhận hồ sơ qua link ngoài); lưu nháp / đăng / tạm dừng / đóng / mở lại.
- Ứng viên: tìm theo tên, SĐT, mã `MJ-…` (ApplyID để đối soát); lọc trạng thái, tin, thương hiệu, quá hạn; tải CSV mở được bằng Excel.
- Hồ sơ: số điện thoại che sẵn, bấm mới hiện và **có ghi log ai đã xem**; tải CV; đổi trạng thái theo bước hợp lệ
  (Không phù hợp cần lý do, Đã đi làm cần ngày bắt đầu); lịch sử đầy đủ ai đổi gì, lúc nào.
- Trạng thái giữ đúng enum của hệ thống cũ (`new_applied`, `reviewing`, `interviewed`, `accepted`, `rejected`, `not_reachable`, `wrong_phone`),
  thêm `onboarded` (đã đi làm) và `withdrawn` (ứng viên rút).

**Dữ liệu**
- Chưa cấu hình gì: lưu trong bộ nhớ server và tự nạp dữ liệu mẫu (17 tin, ~57 hồ sơ). Trên Vercel cách này **không đáng tin**:
  mỗi lần function khởi động lại hoặc chạy nhiều bản là dữ liệu khác nhau.
- Để lưu thật: Vercel → project → **Storage** (hoặc Marketplace) → thêm **Upstash for Redis** → Connect → Redeploy.
  Vercel tự thêm biến môi trường, không cần sửa code. Gói miễn phí đủ cho demo.
- CV lưu trong Redis, tối đa 2 MB/file. Nếu gói Upstash giới hạn kích thước request thấp hơn, giảm `CV_MAX_BYTES` trong `lib/portal/service.ts`.
- Tài khoản demo (mật khẩu `demo123`): `momo_admin`, và mỗi thương hiệu một tài khoản `<slug>_demo`, ví dụ `katinat_demo`.
  Admin có nút "Nạp lại dữ liệu mẫu" khi ở chế độ demo.

**Trước khi dùng thật**
- Đặt `PORTAL_USERS` + `SESSION_SECRET` để tắt tài khoản demo. Đây là đăng nhập tối giản cho giai đoạn thử nghiệm;
  dùng lâu dài nên chuyển sang SSO hoặc hệ thống tài khoản của MoMo.
- Thay dữ liệu mẫu bằng thương hiệu và cửa hàng thật (đồng bộ từ iPOS qua Partner API).
- Hồ sơ trong `/portal` và hồ sơ chuyển sang iPOS (`/relay`) hiện là hai luồng riêng. Bước tiếp theo nên là: hồ sơ nộp vào tin đồng bộ từ iPOS
  thì đẩy webhook ngay khi nộp, và trạng thái iPOS cập nhật về lại `/portal`.

---

# Công cụ chuyển hồ sơ MoMo Jobs → iPOS HRM (`/relay`)

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
npm run dev     # mở http://localhost:3000/jobs (ứng viên) hoặc /relay (nội bộ)
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
| `DASHBOARD_PASSWORD` | Có | Bật đăng nhập cho `/relay`. Thiếu biến này app sẽ khoá dữ liệu thật. Trang ứng viên luôn public |
| `JOBS_SOURCE_URL` | Không | Domain sản phẩm cũ để đọc tin thật cho trang ứng viên |
| `CAREER_HUB_URL` | Không | Nơi mở Lộ trình nghề / Đối chiếu CV |
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
app/jobs/                 trang tìm việc, chi tiết tin, form ứng tuyển
app/brand/[slug]/         trang thương hiệu
app/faq/                  câu hỏi thường gặp
app/api/apply/route.ts    nhận hồ sơ + CV từ trang ứng viên
app/portal/               cổng quản lý: đăng nhập, tổng quan, tin, ứng viên
app/portal/actions.ts     các thao tác ghi (server actions), đều kiểm tra quyền
app/api/portal/           tải CV, xuất CSV (cần đăng nhập)
lib/portal/               vai trò, trạng thái, quy tắc nghiệp vụ, đăng nhập
lib/store/                kho dữ liệu (Upstash Redis hoặc bộ nhớ) + dữ liệu mẫu
app/site.css              giao diện trang ứng viên
components/               header, thẻ việc, logo thương hiệu
lib/jobs/                 dữ liệu mẫu, nguồn dữ liệu, bộ lọc/sắp xếp
app/relay/                công cụ chuyển hồ sơ (nội bộ)
app/api/relay/route.ts    GET = kiểm tra thử, POST = gửi
app/api/cron/relay        Vercel Cron gọi định kỳ
lib/relay.ts              luồng chính: lấy hồ sơ → kiểm tra → gửi → đánh dấu
lib/partner.ts            client Partner API
lib/hrm.ts                client webhook HRM + retry
lib/mock.ts               dữ liệu demo
middleware.ts             đăng nhập bằng DASHBOARD_PASSWORD
```
