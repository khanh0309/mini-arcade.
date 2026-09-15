# Mini Arcade v2.5.1

Mini Arcade chạy trên Netlify, gồm 8 game và bảng xếp hạng online theo username.

## 8 game
- Neon Snake
- Sky Flap
- Dino Run
- Sliding Puzzle
- Block Drop
- Road Rush (đua xe vượt chướng ngại vật)
- Chicken Crossing (đưa gà qua các làn xe)
- Arcade Football (Practice CPU / Local 2P / Online 1v1, first to 3 goals)

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


## V2.4.2
- Ghim tài khoản `ez noob` ở TOP 1 với 50.000 điểm cho cả 8 game.
- Tất cả game có độ khó tăng dần theo thời gian/tiến độ chơi, bắt đầu ở mức khá dễ rồi tăng lên khó.
- Chicken Crossing được cân bằng lại: xe chậm hơn, khoảng cách xe rộng hơn, hitbox gà nhỏ hơn; sau đó giao thông tăng dần.
- Sliding Puzzle có cấp độ: mỗi lần hoàn thành, bàn tiếp theo được xáo khó hơn và BXH dùng điểm thay vì số bước.


## V2.4.2 hotfix
- `ez noob` 50,000 được ghim ở UI lẫn backend cho cả 8 game, kể cả khi backend cũ chưa cập nhật.
- Chicken Crossing dễ hơn rõ rệt lúc đầu: 4 lane xe hoạt động, xe chậm hơn, khoảng trống lớn hơn, hitbox công bằng hơn; độ khó tăng từ từ tới 8 lane.
- Service worker ưu tiên lấy JS/JSON mới từ mạng để giảm lỗi còn thấy bản cũ sau deploy.


## V2.5 — Arcade Football Online 1v1
- Thêm game thứ 8: **Arcade Football**.
- Luật: **ai ghi 3 bàn trước thắng**, không dùng đồng hồ trận đấu.
- `Practice vs CPU`: chơi ngay, không cần backend.
- `Local 2 Players`: 2 người cùng bàn phím/máy.
- `Online 1v1`: Create Room, Join Room bằng mã 4 ký tự, Quick Match và Rematch.
- PC: A/D hoặc ←/→ để chạy, W/↑ để nhảy, F/Space/Enter để sút. Có nút cảm ứng cho điện thoại.
- Thắng online: +120 coin; thua online: +30 coin. Practice cũng có coin thấp hơn.
- Thêm Football Points vào leaderboard; `ez noob` vẫn được ghim 50.000 ở TOP 1.
- Thêm skin Football vào Shop.

### Backend realtime mới
Thư mục `football-server/` là server Node + WebSocket dành cho Render. Website vẫn được deploy bằng Netlify như cũ.

Sau khi upload V2.5 lên GitHub:
1. Render → New → Web Service.
2. Chọn repo Mini Arcade.
3. Root Directory: `football-server`.
4. Build Command: `npm install`.
5. Start Command: `npm start`.
6. Environment Variable: `FRONTEND_URL=https://serene-gumdrop-00730c.netlify.app`.
7. Deploy và copy URL HTTPS Render.
8. Điền URL đó vào `games/arcade-football/config.js`, hoặc gửi URL cho ChatGPT để tạo V2.5.1.

Nếu chưa cấu hình Render, **Practice vs CPU** và **Local 2 Players** vẫn hoạt động; Online sẽ báo chưa có server.
