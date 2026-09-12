# Mini Arcade v2

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
