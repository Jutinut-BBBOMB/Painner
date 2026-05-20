# Painner - KabanBoard
Painner คือระบบจัดการโปรเจกต์ที่รวม Kanban Board และ Team Chat ไว้ในที่เดียว ออกแบบมาเพื่อแก้ปัญหาการขาดข้อมูลสำหรับการตรวจสอบ และการวางแผนงานที่ไม่สอดคล้องกับความจริง โดยระบบจะช่วยคำนวณระยะเวลาที่เป็นไปได้จริงจากปริมาณงาน (Tasks) ที่ใส่เข้าไป

## Team Members
### นายจุติณัฏฐ์ รัตนะมงคลกุล (6609650228)
### นายภูวฤทธิ์ เจริญพล (6609650590) 
### นายรพินทร์ นะราช (6609650624)
### นายศุภณัฐ ตั้งกิจวุฒิกล (6609650665) 
### นายสุทธิพจน์ ประทุมทอง (6609650699) 
### นายสุรบดี ผาสุข (6609650707)

## Install & Run

### Prerequisites

- [Docker](https://www.docker.com/) และ Docker Compose
- MongoDB (ถ้ารันแบบ local โดยไม่ใช้ Docker)

### Environment Variables

สร้างไฟล์ `.env` ใน root ของโปรเจกต์:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/painner
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
```

### Run with Docker

```bash
# Build image
docker build -t painner-backend .

# Run container
docker run -p 5000:5000 --env-file .env painner-backend
```

### Run without Docker

```bash
# ติดตั้ง dependencies
npm install

# รันในโหมด production
npm start

# รันในโหมด development (hot reload)
npm run dev
```

เซิร์ฟเวอร์จะรันที่ `http://localhost:5000`

---

## Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Database:** MongoDB 7 + Mongoose 8
- **Authentication:** JWT (jsonwebtoken)
- **Containerization:** Docker

---

## Project Structure

```
Painner-main/
├── app.js                  # Entry point
├── Dockerfile
├── package.json
├── controllers/            # Business logic
│   ├── authController.js
│   ├── boardController.js
│   ├── chatController.js
│   ├── memberController.js
│   ├── projectController.js
│   ├── taskController.js
│   ├── teamController.js
│   └── userController.js
├── middleware/
│   ├── authenticate.js     # JWT verification
│   └── errorHandler.js     # Global error handler
├── models/
│   └── index.js            # Mongoose schemas
└── routes/
    ├── authRoutes.js
    ├── boardRoutes.js
    ├── chatRoutes.js
    ├── memberRoutes.js
    ├── projectRoutes.js
    ├── taskRoutes.js
    ├── teamRoutes.js
    └── userRoutes.js
```

---

## API Endpoints

endpoint ทั้งหมด (ยกเว้น `/register` และ `/login`) ต้องใส่ JWT token ใน header:

```
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | สมัครสมาชิก |
| POST | `/api/auth/login` | เข้าสู่ระบบ |
| GET | `/api/auth/me` | ดูข้อมูลตัวเอง  |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:userId` | ดู profile  |
| PATCH | `/api/users/:userId` | แก้ไข profile  |

### Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams` | ดูทีมของฉัน  |
| POST | `/api/teams` | สร้างทีม  |
| GET | `/api/teams/:teamId/members` | รายชื่อสมาชิก  |
| POST | `/api/teams/:teamId/members` | เพิ่มสมาชิก  |
| PATCH | `/api/teams/:teamId/members/:userId` | แก้ไข role  |
| DELETE | `/api/teams/:teamId/members/:userId` | นำสมาชิกออก  |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | ดูโปรเจกต์ทั้งหมด  |
| POST | `/api/projects` | สร้างโปรเจกต์  |
| GET | `/api/projects/:projectId` | ดูโปรเจกต์  |
| PATCH | `/api/projects/:projectId` | แก้ไขโปรเจกต์  |
| DELETE | `/api/projects/:projectId` | ลบโปรเจกต์  |
| GET | `/api/projects/:projectId/stats` | สถิติ tasks  |
| GET | `/api/projects/:projectId/boards` | ดู boards  |
| POST | `/api/projects/:projectId/boards` | สร้าง board  |
| GET | `/api/projects/:projectId/chats` | ห้องแชทโปรเจกต์  |

### Project Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:projectId/members` | ดูสมาชิก  |
| GET | `/api/projects/:projectId/members/:userId` | ดูสมาชิกคนนึง  |
| POST | `/api/projects/:projectId/members` | เพิ่มสมาชิก  |
| PUT | `/api/projects/:projectId/members/:userId` | แก้ไข role  |
| DELETE | `/api/projects/:projectId/members/:userId` | นำสมาชิกออก  |

### Boards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards/:boardId` | ดู board  |
| GET | `/api/boards/:boardId/tasks` | ดู tasks ใน board  |
| POST | `/api/boards/:boardId/tasks` | สร้าง task  |
| PATCH | `/api/boards/:boardId` | แก้ไข board  |
| DELETE | `/api/boards/:boardId` | ลบ board  |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/:taskId` | ดู task  |
| PUT | `/api/tasks/:taskId` | แก้ไข task  |
| DELETE | `/api/tasks/:taskId` | ลบ task  |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chats/:chatId/messages` | ดูข้อความ  |
| POST | `/api/chats/:chatId/messages` | ส่งข้อความ  |

---

## Git Workflow

```
main        ← final version
└── develop ← รวมงานจากทุก feature
    ├── feature/auth
    ├── feature/teams
    ├── feature/projects
    ├── feature/boards
    ├── feature/tasks
    └── feature/chat
```
