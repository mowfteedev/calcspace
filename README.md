# Calcspace

Một không gian tính toán bằng tiếng Việt: máy tính khoa học với ô nhập công thức, bộ phân tích IPv4 subnet/CIDR và quy đổi đơn vị. Giao diện thích ứng với điện thoại, có chế độ sáng/tối, lịch sử trên thiết bị và hỗ trợ offline sau lần tải đầu tiên.

## Sử dụng

Mở **https://mowfteedev.github.io/may-tinh/** để sử dụng trực tiếp. Không cần cài đặt hoặc chạy server trên máy. Sau lần tải đầu tiên, các công cụ tiếp tục hoạt động khi mất mạng.

Nếu muốn phát triển hoặc kiểm tra bản sửa trên máy:

```sh
python3 -m http.server 8080
```

Sau đó mở `http://localhost:8080`. Toàn bộ tài nguyên là file tĩnh, tương thích với GitHub Pages.

## Tính năng

- **Máy tính:** phép toán cơ bản, thứ tự ưu tiên, số mũ, căn bậc hai/ba, logarit, lượng giác và lượng giác ngược, DEG/RAD, giai thừa, phần trăm, π/e, Ans và phân số/thập phân. Nhập, dán hoặc chọn để sửa công thức trực tiếp; các nút hàm chèn tại con trỏ hoặc bao quanh đoạn đã chọn. Hỗ trợ Undo/Redo của trình duyệt. Kết quả chỉ xuất hiện và được lưu khi nhấn Enter hoặc nút Tính kết quả. Khi sửa công thức hoặc đổi DEG/RAD, kết quả cũ được ẩn để tránh nhầm lẫn. Hỗ trợ nhân ngầm như `2(3+4)`.
- **Lịch sử:** lưu tối đa 50 phép tính ngay trên trình duyệt, xem nhanh ba phép tính gần nhất, chọn để sửa và tính lại. Alt + ↑/↓ duyệt lịch sử trong ô công thức. Các phép tính mới lưu kèm DEG/RAD và giá trị Ans tại thời điểm tính để có thể dùng lại chính xác.
- **IPv4:** kiểm tra địa chỉ và CIDR nghiêm ngặt, network/broadcast, subnet/wildcard, host range, nhị phân, phân loại các dải phổ biến, sao chép nhanh. Hỗ trợ `/0`, `/31` và `/32`.
- **Quy đổi:** dữ liệu thập phân/nhị phân, băng thông, độ dài, khối lượng, nhiệt độ và thời gian. Quy đổi hai chiều, hoán đổi đơn vị, bảng đối chiếu cập nhật trực tiếp và thời gian tải file.
- **Offline:** toàn bộ CSS/JS/icon nằm trong dự án; không tải font hoặc mã giao diện từ CDN. Service worker ưu tiên bản mới từ mạng và dùng cache khi mất kết nối.

Kết quả hiển thị làm tròn 12 chữ số có nghĩa; không dùng cho phép tính đòi hỏi độ chính xác tùy ý. Lịch sử nằm trong bộ nhớ trình duyệt của thiết bị đang dùng.

## Phím tắt

| Phím | Chức năng |
| --- | --- |
| Gõ trực tiếp hoặc dán | Nhập biểu thức như `sqrt(81) + sin(30)` |
| `Enter` | Tính và lưu kết quả vào lịch sử |
| `Shift + Enter` | Xuống dòng trong công thức |
| `Backspace` / `Delete` | Xóa ký tự hoặc đoạn đã chọn |
| `Escape` | Xóa công thức |
| Phím mũi tên, Home, End | Di chuyển con trỏ theo thao tác chuẩn của trình duyệt |
| `Ctrl/Cmd + Z` | Hoàn tác, bao gồm chèn bằng nút toán học |
| `Alt + ↑/↓` | Duyệt lịch sử; trở về bản nháp khi nhấn xuống hết |

Các nút toán học gồm phép toán cơ bản, ngoặc, lũy thừa, căn, phân số, hằng số, logarit và lượng giác. Mục **Thêm hàm toán học** chứa căn bậc ba, giai thừa, hàm hyperbolic và ký hiệu khoa học. Nút **½ ⇄ 0.5** đổi cách hiển thị kết quả; nút **Sao chép** chép kết quả hiện tại.

Có thể gõ `pi`, `sqrt(...)`, `cbrt(...)`, `asin(...)`, `acos(...)`, `atan(...)`, `Ans`; hoặc dùng ký hiệu tương ứng trên thanh nút. Viết đầy đủ ngoặc, ví dụ `sin(30)` hoặc `sin(30)^2`. Phần trăm là phép toán một ngôi: `200 × 15% = 30`.

## Phát triển & kiểm tra

Node.js 18+ chỉ cần khi chạy kiểm tra tự động. Dự án không có phụ thuộc npm:

```sh
npm test
```

`css/utilities.css` chứa các lớp tiện ích được biên dịch sẵn từ Tailwind CSS 3 (MIT); website không phụ thuộc vào trình biên dịch hoặc CDN. Khi mở rộng giao diện, thêm CSS vào `css/style.css` hoặc dùng các lớp đã có trong `utilities.css`. Khi phát hành, đổi `RELEASE` trong `sw.js` và tham số `?v=` của CSS/JS trong `index.html` sang cùng một mã phiên bản. Service worker bỏ qua HTTP cache khi cài bản mới, xóa cache cũ của ứng dụng và làm mới trang một lần khi nâng cấp; lịch sử trong localStorage vẫn được giữ lại.

- `index.html`: bố cục và các công cụ.
- `js/calculator.js`: bộ phân tích biểu thức, trạng thái máy tính và lịch sử.
- `js/ip-calc.js`, `js/converter.js`: logic mạng và quy đổi.
- `js/app.js`: tương tác giao diện, bàn phím, clipboard và chủ đề.
- `tests/engines.test.cjs`: kiểm tra hồi quy cho ba bộ tính toán.

Giấy phép [MIT](LICENSE).
