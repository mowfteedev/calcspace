# Calcspace

Một không gian tính toán bằng tiếng Việt: máy tính khoa học lấy cảm hứng từ fx-570, bộ phân tích IPv4 subnet/CIDR và quy đổi đơn vị. Giao diện thích ứng với điện thoại, có chế độ sáng/tối, lịch sử trên thiết bị và hỗ trợ offline sau lần tải đầu tiên.

## Chạy dự án

Không cần cài thư viện để sử dụng:

```sh
python3 -m http.server 8080
```

Mở **http://localhost:8080**. Có thể mở trực tiếp `index.html` để dùng các công cụ; PWA/offline và clipboard hoạt động tốt nhất trên localhost hoặc HTTPS.

## Tính năng

- **Máy tính:** phép toán cơ bản, thứ tự ưu tiên, số mũ, căn bậc hai/ba, logarit, lượng giác và lượng giác ngược, DEG/RAD, giai thừa, phần trăm, π/e, Ans, bộ nhớ M và phân số/thập phân. Hỗ trợ nhân ngầm như `2(3+4)`.
- **Lịch sử:** lưu tối đa 50 phép tính ngay trên trình duyệt, xem nhanh ba phép tính gần nhất, chọn để sửa và tính lại. REPLAY lên/xuống duyệt lịch sử, trái/phải di chuyển con trỏ.
- **IPv4:** kiểm tra địa chỉ và CIDR nghiêm ngặt, network/broadcast, subnet/wildcard, host range, nhị phân, phân loại các dải phổ biến, sao chép nhanh. Hỗ trợ `/0`, `/31` và `/32`.
- **Quy đổi:** dữ liệu thập phân/nhị phân, băng thông, độ dài, khối lượng, nhiệt độ và thời gian. Quy đổi hai chiều, hoán đổi đơn vị, bảng đối chiếu cập nhật trực tiếp và thời gian tải file.
- **Offline:** toàn bộ CSS/JS/icon nằm trong dự án; không tải font hoặc mã giao diện từ CDN. Service worker ưu tiên bản mới từ mạng và dùng cache khi mất kết nối.

Đây là máy tính khoa học web, không mô phỏng toàn bộ chức năng của phần cứng Casio. Kết quả hiển thị làm tròn 12 chữ số có nghĩa; không dùng cho phép tính đòi hỏi độ chính xác tùy ý. Lịch sử nằm trong bộ nhớ trình duyệt của thiết bị đang dùng.

## Phím tắt

| Phím | Chức năng |
| --- | --- |
| `0–9`, `.`, `+`, `-`, `*`, `/`, `^`, `(`, `)` | Nhập biểu thức |
| `Enter` / `=` | Tính kết quả |
| `Backspace` | Xóa trước con trỏ |
| `Escape` | Xóa biểu thức |
| Phím mũi tên | Di chuyển con trỏ / duyệt lịch sử |
| `S`, `C`, `T`, `L` | sin, cos, tan, log |
| `D` | Đổi phân số / thập phân |
| `M` | Menu công cụ |
| `A` | Nhập π |
| `Shift`, sau đó phím hàm | Hàm thứ hai theo nhãn trên phím |
| `%`, `!` | Phần trăm, giai thừa |

Nhấn nút **π / e** để nhập π, hoặc **SHIFT → π / e** để nhập e. **M+** cộng kết quả vào bộ nhớ; **SHIFT → M+** trừ; **RCL** đọc bộ nhớ; **SHIFT → RCL** xóa bộ nhớ. Dùng dấu ngoặc đầy đủ, ví dụ `sin(30)`.

## Phát triển & kiểm tra

Node.js 18+ chỉ cần khi chạy kiểm tra tự động. Dự án không có phụ thuộc npm:

```sh
npm test
```

`css/utilities.css` chứa các lớp tiện ích được biên dịch sẵn từ Tailwind CSS 3 (MIT); website không phụ thuộc vào trình biên dịch hoặc CDN. Khi mở rộng giao diện, thêm CSS vào `css/style.css` hoặc dùng các lớp đã có trong `utilities.css`. Khi thay đổi tài nguyên offline, tăng phiên bản `CACHE_NAME` trong `sw.js`.

- `index.html`: bố cục và các công cụ.
- `js/calculator.js`: bộ phân tích biểu thức, trạng thái máy tính và lịch sử.
- `js/ip-calc.js`, `js/converter.js`: logic mạng và quy đổi.
- `js/app.js`: tương tác giao diện, bàn phím, clipboard và chủ đề.
- `tests/engines.test.cjs`: kiểm tra hồi quy cho ba bộ tính toán.

Giấy phép [MIT](LICENSE).
