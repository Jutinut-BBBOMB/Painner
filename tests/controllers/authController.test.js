const { register, login, getMe } = require('../../controllers/authController');
const { User } = require('../../models');
const jwt = require('jsonwebtoken');

// จำลอง (Mock) Dependencies ต่างๆ
jest.mock('../../models'); // Mock Database (User model)
jest.mock('jsonwebtoken'); // Mock การสร้าง Token

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    // รีเซ็ตค่า Request และ Response ก่อนเทสต์แต่ละเคส
    req = { body: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // จำลองให้ jwt.sign ส่งคืนค่า token ปลอมสำเร็จเสมอ
    jwt.sign.mockReturnValue('mocked_jwt_token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- หมวด: Register ---
  describe('register()', () => {
    it('ควรคืนค่า 400 ถ้าส่งข้อมูลมาไม่ครบ', async () => {
      req.body = { email: 'test@mail.com' }; // ส่งมาแค่อีเมล ขาด field อื่น

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'All fields are required' });
    });

    it('ควรสร้าง User สำเร็จและคืนค่า 201 พร้อม Token (Happy Path)', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@mail.com',
        username: 'johndoe',
        password: 'password123'
      };

      // จำลองให้ User.create สำเร็จและคืนค่า Object กลับมา
      const mockUser = {
        _id: 'user_id_123',
        toSafe: jest.fn().mockReturnValue({ username: 'johndoe', email: 'john@mail.com' })
      };
      User.create.mockResolvedValue(mockUser);

      await register(req, res);

      expect(User.create).toHaveBeenCalledWith(req.body); // เช็คว่าส่งข้อมูลไปสร้างจริง
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        token: 'mocked_jwt_token',
        user: { username: 'johndoe', email: 'john@mail.com' }
      });
    });
  });

  // --- หมวด: Login ---
  describe('login()', () => {
    it('ควรคืนค่า 400 ถ้าไม่ส่ง email หรือ password', async () => {
      req.body = { email: 'john@mail.com' }; // ขาดรหัสผ่าน

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Email and password required' });
    });

    it('ควรคืนค่า 401 ถ้าหา User ไม่เจอ', async () => {
      req.body = { email: 'unknown@mail.com', password: 'password123' };
      
      // จำลองว่าหาใน DB แล้วไม่เจอ (ได้ค่า null)
      User.findOne.mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid credentials' });
    });

    it('ควรคืนค่า 401 ถ้ารหัสผ่านผิด', async () => {
      req.body = { email: 'john@mail.com', password: 'wrongpassword' };
      
      // จำลองว่าเจอ User แต่ comparePassword ได้ผลเป็น false
      const mockUser = { comparePassword: jest.fn().mockResolvedValue(false) };
      User.findOne.mockResolvedValue(mockUser);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid credentials' });
    });

    it('ควร Login สำเร็จ ได้รับ Token และข้อมูล User', async () => {
      req.body = { email: 'john@mail.com', password: 'password123' };
      
      const mockUser = {
        _id: 'user_id_123',
        comparePassword: jest.fn().mockResolvedValue(true), // รหัสผ่านถูก
        toSafe: jest.fn().mockReturnValue({ email: 'john@mail.com' })
      };
      User.findOne.mockResolvedValue(mockUser);

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        token: 'mocked_jwt_token',
        user: { email: 'john@mail.com' }
      });
    });
  });

  // --- หมวด: Get Me ---
  describe('getMe()', () => {
    it('ควรคืนค่า 404 ถ้าหา User ในระบบไม่เจอ', async () => {
      req.user = { userId: 'ghost_id' }; // ข้อมูลที่แนบมากับ Token (จาก middleware)
      
      // จำลองว่า User.findById(id).select(...) คืนค่า null
      const mockQuery = { select: jest.fn().mockResolvedValue(null) };
      User.findById.mockReturnValue(mockQuery);

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found' });
    });

    it('ควรคืนค่าข้อมูล User สำเร็จ', async () => {
      req.user = { userId: 'real_id' };
      const mockFoundUser = { username: 'johndoe', email: 'john@mail.com' };
      
      const mockQuery = { select: jest.fn().mockResolvedValue(mockFoundUser) };
      User.findById.mockReturnValue(mockQuery);

      await getMe(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockFoundUser
      });
    });
  });
});