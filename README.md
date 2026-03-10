# File Length & Complexity Visualizer 📊

Hiển thị tổng số dòng code và độ phức tạp ngay trong thanh Explorer của VSCode. Một giải pháp nhẹ nhàng, hiệu quả để quản lý chất lượng tệp tin trong dự án của bạn.

![Mockup](mockup.png)

## ✨ Tính năng nổi bật

- **Hiển thị trực tiếp**: Số dòng code xuất hiện ngay bên cạnh tên file trong cây thư mục Explorer.
- **Rút gọn thông minh**: Tự động chuyển đổi các số lớn sang định dạng rút gọn (ví dụ: `1,200` -> `1.2k`).
- **Lazy Loading**: Chỉ tính toán số dòng cho các file đang hiển thị, không làm chậm VSCode ngay cả với dự án hàng chục nghìn file.
- **Cập nhật thời gian thực**: Tự động đếm lại khi bạn lưu file, đổi tên hoặc tạo file mới.
- **Tùy chỉnh linh hoạt**:
  - Bỏ qua dòng trống.
  - Bỏ qua các dòng comment (hỗ trợ JS, TS, Python, C++, HTML, SQL, và nhiều ngôn ngữ khác).
  - Bật/Tắt dễ dàng qua Settings.

## ⚙️ Cấu hình (Settings)

Bạn có thể tùy chỉnh extension thông qua Settings (Ctrl + ,) bằng cách tìm kiếm `Line Count Explorer`:

| Setting                           | Mặc định | Mô tả                                                                             |
| :-------------------------------- | :------- | :-------------------------------------------------------------------------------- |
| `lineCount.enabled`               | `true`   | Bật hoặc tắt hiển thị số dòng.                                                    |
| `lineCount.showOnlyNonEmptyLines` | `false`  | Nếu bật, chỉ đếm các dòng có nội dung (không tính dòng trắng).                    |
| `lineCount.ignoreComments`        | `false`  | Nếu bật, sẽ bỏ qua các dòng chỉ chứa comment (dựa trên regex theo từng ngôn ngữ). |

## 🚀 Hiệu năng & Kỹ thuật

Extension này được thiết kế với tiêu chuẩn "Production-ready":

- **Cơ chế Cache**: Sử dụng Map để lưu trữ kết quả, giảm thiểu việc đọc ổ đĩa lặp lại.
- **Giới hạn tệp tin**: Tự động bỏ qua các file binary hoặc file văn bản lớn hơn 10MB để đảm bảo UI luôn mượt mà.
- **Throttling**: Sử dụng cơ chế chờ (debounce) 100ms khi người dùng gõ phím liên tục để tránh lãng phí tài nguyên CPU.
- **API Chính thống**: Sử dụng `FileDecorationProvider` - API chính thức của VSCode cho việc trang trí Explorer.

## 🛠️ Cài đặt từ mã nguồn

1. Clone repository này.
2. Chạy `pnpm install`.
3. Nhấn `F5` để mở cửa sổ Extension Development Host và trải nghiệm.

## 📄 Giấy phép

MIT License.
