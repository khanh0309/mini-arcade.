# Mini Arcade v2.4

Mini Arcade chạy trên Netlify, gồm 7 game và bảng xếp hạng online theo username.

## 7 game
- Neon Snake
- Sky Flap
- Dino Run
- Sliding Puzzle
- Block Drop
- Road Rush (đua xe vượt chướng ngại vật)
- Chicken Crossing (đưa gà qua các làn xe)

## Tính năng mới
- Nhập username khi vào Arcade; username được nhớ trên thiết bị và có thể đổi.
- Nhạc nền chiptune và hiệu ứng âm thanh được tạo bằng Web Audio API, không dùng bài nhạc có bản quyền.
- Sau khi kết thúc/vượt game, bảng xếp hạng của đúng game đó tự hiện.
- Bảng xếp hạng online dùng Netlify Functions + Netlify Blobs; giữ điểm tốt nhất của mỗi username cho từng game.
- Nếu API online không khả dụng khi chạy local, game tự dùng bảng xếp hạng local trên thiết bị.

## Deploy
Project có `package.json` với `@netlify/blobs`, `netlify/functions/leaderboard.mjs`, và `netlify.toml` đã chỉ định functions directory. Khi repo GitHub đã nối Netlify, chỉ cần commit/push các file mới; Netlify sẽ tự cài dependency và deploy.

## Cấu trúc cần giữ nguyên
- `assets/` chứa giao diện, audio và leaderboard client.
- `games/` chứa từng game riêng.
- `netlify/functions/leaderboard.mjs` là API bảng xếp hạng.
- `package.json` là dependency server-side.

## Lưu ý
Leaderboard này phù hợp cho nhóm bạn chơi thử, nhưng điểm được gửi từ trình duyệt nên chưa có cơ chế chống gian lận chuyên nghiệp.


## V2.1
- Tăng âm lượng tổng thể.
- Nhạc nền mặc định 70%.
- Hiệu ứng mặc định 100%.
- Có nút 🎚️ để chỉnh riêng nhạc nền và hiệu ứng.


## V2.2
- Rắn được vẽ lại với đầu, mắt và lưỡi rõ hơn.
- Sky Flap, Dino Run và Chicken Crossing có nhân vật đẹp hơn.
- Road Rush hỗ trợ di chuyển lên/xuống ngoài trái/phải.


## V2.3
- Thêm hệ thống skin cho Snake, Sky Flap, Dino Run, Chicken Crossing và Road Rush.
- Dino Run được nâng cấp giống Google Chrome Dino hơn: có cúi né chim bay và chu kỳ ngày / đêm.
- Giữ nguyên username, nhạc nền và leaderboard online.


## V2.4
- Coin economy: kết thúc game sẽ nhận coin.
- Shop trang phục trên trang chủ.
- Skin mặc định miễn phí, skin khác mua bằng coin.
- Coin và skin đã mua lưu trên trình duyệt/thiết bị.
- Bảng xếp hạng sau game hiển thị số coin vừa nhận.
- Giữ toàn bộ V2.3: username, nhạc, leaderboard online, Dino cúi né chim và ngày/đêm, Road Rush 4 hướng.
