# WhoziaoHub — Hu Tao Themed Steam Manifest & Lua Registry

Website tra cứu và tải xuống toàn bộ tệp tin `.manifest`, `key.vdf` và file cấu hình `.lua` chuẩn SteamTools trực tiếp từ kho **WhoziaoHub** (`DrxmReal/WhoziaoHub`).

Được xây dựng với chủ đề **Hu Tao (Genshin Impact)**: Tông màu Crimson Ember (#f43f5e), Plum Dark (#12080a) và Spirit Gold (#fbbf24).

---

## 🔥 Tính Năng Nổi Bật

1. **Yêu cầu Key để truy cập:**
   - Người dùng bắt buộc phải nhập **License Key từ SLK Unlocker** mới có thể tra cứu và tải file.
   - Hỗ trợ kiểm tra tự động qua cơ sở dữ liệu Supabase của SLK và Master Key dev: `WHOZIAO-HUTAO-VIP-2026`.
2. **Giới hạn 20 lượt tải / ngày:**
   - Mỗi License Key được cấp phát quota 20 lượt tải/ngày, tự động làm mới vào ngày hôm sau.
   - Hiển thị thanh đếm thời gian thực trên thanh tiêu đề (`19 / 20`).
3. **Tải trọn gói 1-Click (ZIP Package):**
   - Đóng gói toàn bộ file `.manifest` của game gốc và toàn bộ DLC, kèm theo `key.vdf` và `<AppID>.lua` thành 1 file ZIP duy nhất.
4. **Tải từng tệp tin riêng biệt:**
   - Bảng danh mục cho phép tải riêng lẻ từng file `.manifest`, file `.lua` hoặc file `key.vdf`.
5. **Giao diện Hu Tao sắc nét & hiện đại:**
   - Hiệu ứng bụi đom đóm / bướm lửa đặc trưng của Hu Tao.
   - Thẻ hiển thị game tương tác mượt mà, đầy đủ ảnh poster Steam Store và danh sách DLC.

---

## 🚀 Hướng Dẫn Deploy Lên Vercel

Dự án đã được cấu hình sẵn 100% tệp [`vercel.json`](file:///d:/WhoziaoHub-Web/vercel.json) và các Serverless Functions trong thư mục `api/`. Bạn chỉ cần:

### Cách 1: Deploy qua Vercel CLI
```bash
cd d:\WhoziaoHub-Web
npm install -g vercel
vercel
```

### Cách 2: Deploy qua GitHub & Vercel Dashboard
1. Tạo một repository mới trên GitHub (ví dụ: `whoziaohub-web`).
2. Đẩy toàn bộ mã nguồn trong thư mục `d:\WhoziaoHub-Web` lên repo đó:
   ```bash
   cd d:\WhoziaoHub-Web
   git init
   git add .
   git commit -m "Init WhoziaoHub Hu Tao Web App"
   git branch -M main
   git remote add origin https://github.com/<your-username>/whoziaohub-web.git
   git push -u origin main
   ```
3. Đăng nhập vào [vercel.com](https://vercel.com), bấm **Add New Project** -> Chọn repository vừa push -> Bấm **Deploy**.
4. *(Tùy chọn)* Trong phần **Settings -> Environment Variables** của Vercel, bạn có thể cấu hình thêm:
   - `GITHUB_TOKEN`: GitHub Personal Access Token để không bao giờ bị giới hạn API rate limit của GitHub.

---

## 💻 Chạy Thử Cục Bộ (Local)

Máy chủ local đang chạy tại:
```text
http://localhost:3000
```
Key thử nghiệm Master VIP:
```text
WHOZIAO-HUTAO-VIP-2026
```
