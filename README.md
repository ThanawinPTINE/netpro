
# ChatCord — Terminal UI (Browser)

คุณสมบัติ (ตรงตามภาพที่กำหนด):
- UI ผ่าน Browser (เว็บเพจเดียว สไตล์ Command Prompt)
- Feature เหมือน Command prompt: อินพุตเป็นบรรทัดคำสั่ง (`/login`, `/join`, `/rooms`, `/me`, `/help`) และพิมพ์ข้อความเพื่อคุย
- มีฐานข้อมูล (SQLite) จัดเก็บ `users`, `rooms`, `messages`
- ไม่ Fix: สามารถสร้างห้อง chat ได้ด้วย `/join <room>` (ถ้ายังไม่มีจะถูกสร้างอัตโนมัติ)
- สร้าง user ได้: `/login <username>` ถ้าไม่พบจะสร้างใหม่ทันที

## วิธีรัน
1. ติดตั้ง Node.js LTS
2. แตกไฟล์โปรเจกต์ แล้วรันคำสั่ง:
   ```bash
   npm install
   npm run init-db   # สร้างฐานข้อมูลครั้งแรก
   npm start
   ```
3. เปิดเบราว์เซอร์ไปที่ http://localhost:3000

## โครงสร้างคำสั่งในหน้าเว็บ
- `/login <username>` เข้าระบบหรือสร้างผู้ใช้ใหม่
- `/join <room>` เข้าห้อง (ถ้าไม่มี จะสร้างให้)
- `/rooms` รายชื่อห้องทั้งหมด
- `/me` แสดงสถานะปัจจุบัน
- `/help` แสดงคู่มือคำสั่ง

## โครงสร้างตาราง
- `users(id, username, password_hash, created_at)`
- `rooms(id, name, created_at)`
- `messages(id, room_id, user_id, content, created_at)`

> หากต้องการเพิ่มระบบรหัสผ่านจริงจัง ให้ส่ง `password` ใน `POST /api/register` และเปิดการตรวจสอบก่อนให้ `socket.emit("register")` ใน `client.js`
