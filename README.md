# Mini Arcade v2.5.4

Mini Arcade chạy trên Netlify, gồm 8 game và bảng xếp hạng online theo username.

## 8 game
- Neon Snake
- Sky Flap
- Dino Run
- Sliding Puzzle
- Block Drop
- Road Rush (đua xe vượt chướng ngại vật)
- Chicken Crossing (đưa gà qua các làn xe)
- Arcade Football (Practice CPU / Local 2P / Online 1v1, trận 60 giây + Golden Goal khi hòa)

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
- Ghim tài khoản `ez noob` ở TOP 1 với 10.000.000 điểm cho cả 8 game.
- Tất cả game có độ khó tăng dần theo thời gian/tiến độ chơi, bắt đầu ở mức khá dễ rồi tăng lên khó.
- Chicken Crossing được cân bằng lại: xe chậm hơn, khoảng cách xe rộng hơn, hitbox gà nhỏ hơn; sau đó giao thông tăng dần.
- Sliding Puzzle có cấp độ: mỗi lần hoàn thành, bàn tiếp theo được xáo khó hơn và BXH dùng điểm thay vì số bước.


## V2.4.2 hotfix
- `ez noob` 10.000.000 được ghim ở UI lẫn backend cho cả 8 game.
- Chicken Crossing dễ hơn rõ rệt lúc đầu: 4 lane xe hoạt động, xe chậm hơn, khoảng trống lớn hơn, hitbox công bằng hơn; độ khó tăng từ từ tới 8 lane.
- Service worker ưu tiên lấy JS/JSON mới từ mạng để giảm lỗi còn thấy bản cũ sau deploy.


## V2.5 — Arcade Football Online 1v1
- Thêm game thứ 8: **Arcade Football**.
- Luật: **trận 60 giây; hết giờ ai nhiều bàn hơn thắng, hòa thì Golden Goal**, không dùng đồng hồ trận đấu.
- `Practice vs CPU`: chơi ngay, không cần backend.
- `Local 2 Players`: 2 người cùng bàn phím/máy.
- `Online 1v1`: Create Room, Join Room bằng mã 4 ký tự, Quick Match và Rematch.
- PC: A/D hoặc ←/→ để chạy, W/↑ để nhảy, F/Space/Enter để sút. Có nút cảm ứng cho điện thoại.
- Thắng online: +120 coin; thua online: +30 coin. Practice cũng có coin thấp hơn.
- Thêm Football Points vào leaderboard; `ez noob` vẫn được ghim 10.000.000 ở TOP 1.
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


## V2.5.2 — Chicken collision hotfix + owner score
- Nâng điểm ghim của `ez noob` lên **10.000.000** cho toàn bộ 8 game, cả frontend và Netlify Function.
- Sửa bug Chicken Crossing: spam phím/nút tiến lên quá nhanh có thể đổi nhiều hàng giữa hai frame va chạm và xuyên qua xe.
- Mỗi lần di chuyển giờ kiểm tra hitbox ngay tại ô đích trước khi đổi vị trí.
- Thêm input cooldown 75 ms để không thể dịch chuyển qua nhiều lane trong cùng một frame.
- Bỏ khoảng "bất tử" sau khi bắt đầu/qua đường; hàng xuất phát không có xe nên không cần invincibility.
- Giữ nguyên cân bằng dễ hơn ở đầu game và difficulty curve tăng dần.


## V2.5.4 — Mobile controls + Dino/Sky Flap polish
- Tăng nhẹ kích thước vùng chơi trên desktop và tận dụng sát chiều ngang hơn trên điện thoại.
- Snake, Chicken Crossing và Road Rush đổi nút cảm ứng 4 hướng sang **D-pad hình chữ thập**.
- Block Drop dùng D-pad chữ thập cho trái/xoay/phải/xuống và tách nút **Thả xuống** riêng.
- Arcade Football đổi cụm điều khiển mobile sang bố cục chữ thập dễ bấm hơn.
- Dino Run thêm **jump buffer 160 ms**: bấm nhảy hơi sớm trước khi đáp đất vẫn tự nhảy tiếp ngay khi chạm đất.
- Dino Run tăng khoảng cách tối thiểu giữa chướng ngại vật để tránh tình huống 2 xương rồng gần nhau tạo pha chết bắt buộc, nhưng tốc độ vẫn tăng dần theo thời gian.
- Vẽ lại Dino chi tiết hơn: mõm, cổ, tay, móng, chân, đuôi và gai lưng rõ hơn.
- Sky Flap có hai cánh rõ ràng hơn, có lông cánh và animation flap dễ nhìn.


## V2.5.4 – Football 60s + Stadium Crowd
- Arcade Football đổi sang trận 60 giây.
- Hòa sau 60 giây sẽ vào Golden Goal, bàn tiếp theo thắng.
- Thêm khán đài, khán giả chuyển động và tiếng cổ vũ nhẹ; ghi bàn sẽ có tiếng reo lớn hơn.
- Online server giữ quyền quyết định đồng hồ/trạng thái trận để hai máy không lệch thời gian.
