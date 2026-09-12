# Mini Arcade

Một website mini-game dạng static, phù hợp deploy lên Netlify hoặc GitHub Pages.

## 5 game hiện có
- Neon Snake
- Sky Flap
- Dino Run
- Sliding Puzzle
- Block Drop

## Chạy thử trên máy
Khuyến nghị chạy bằng web server thay vì double-click `index.html` để `games.json` và Service Worker hoạt động đúng.

Ví dụ nếu máy có Python:

```bash
python -m http.server 8000
```

Sau đó mở `http://localhost:8000`.

## Cách thêm game mới sau này
1. Tạo thư mục mới trong `games/`, ví dụ `games/racing/`.
2. Đặt `index.html` và file JS của game trong đó.
3. Thêm game vào `games.json`.
4. Thêm đường dẫn file mới vào mảng `CORE` trong `sw.js` và đổi tên cache, ví dụ `mini-arcade-v2`.
5. Commit/push lên GitHub. Netlify sẽ tự deploy nếu repository đã được kết nối.

## Lưu điểm
Các game dùng `localStorage`, nên kỷ lục chỉ tồn tại trên trình duyệt/thiết bị đang chơi. Không có database hoặc tài khoản người dùng.
