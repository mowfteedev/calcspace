# Calcspace

Không gian tính toán cá nhân: Máy tính khoa học, IPv4 Subnet/CIDR và Quy đổi đơn vị (PWA offline-first).

- Chạy dev: `npm start` (mở tại `http://localhost:8080`)
- Chạy test: `npm test`

## Phát triển

Dùng Node.js 22+ và chạy `npm ci` để cài công cụ. `npm start` dùng Python 3.
Chạy `npm run preview` để thử bằng môi trường Workers cục bộ.

## Cloudflare Workers

GitHub lưu mã nguồn; Cloudflare tự deploy mỗi lần push lên `main`.
Cấu hình Workers Builds:

- Worker: `calcspace`.
- Root directory: gốc repo.
- Build command: để trống.
- Deploy command: `npx wrangler deploy`.

`wrangler.jsonc` chạy `npm test` trước khi deploy và chỉ publish thư mục `public/`.
Thêm file chạy trên web vào thư mục này. Có thể deploy thủ công bằng `npm run deploy`
sau khi đăng nhập Cloudflare qua `npx wrangler login`.
