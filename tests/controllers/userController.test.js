const { getUser, updateUser } = require('../../controllers/userController');
const { User } = require('../../models');

// จำลอง (Mock) Model User
jest.mock('../../models', () => ({
  User: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn()
  }
}));

describe('User Controller', () => {
  let req, res;
  const myUserId = 'user_my_id_123';
  const otherUserId = 'user_other_id_999';

  beforeEach(() => {
    req = { 
      params: {}, 
      body: {}, 
      user: { userId: myUserId } // เราล็อกอินด้วย myUserId
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- GET /api/users/:userId ---
  describe('getUser()', () => {
    it('ควรส่ง 404 ถ้าหาข้อมูล User ไม่เจอ', async () => {
      req.params = { userId: 'ghost_id' };
      
      const mockSelect = jest.fn().mockResolvedValue(null);
      User.findById.mockReturnValue({ select: mockSelect });

      await getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found' });
    });

    it('ควรดึงข้อมูล User ได้สำเร็จ (โดยไม่ดึง password มาด้วย)', async () => {
      req.params = { userId: otherUserId };
      const mockUser = { firstName: 'John', lastName: 'Doe' };
      
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({ select: mockSelect });

      await getUser(req, res);

      expect(User.findById).toHaveBeenCalledWith(otherUserId);
      expect(mockSelect).toHaveBeenCalledWith('-password'); // เช็คว่าสั่งไม่เอา password 
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockUser });
    });
  });

  // --- PATCH /api/users/:userId ---
  describe('updateUser()', () => {
    it('ควรส่ง 403 (Forbidden) ถ้าพยายามแก้โปรไฟล์ของคนอื่น', async () => {
      req.params = { userId: otherUserId }; // พยายามจะแก้ของคนอื่น
      req.body = { firstName: 'HackedName' };

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Cannot edit another user's profile" });
    });

    it('ควรส่ง 400 ถ้ายิงฟิลด์มั่วๆ มา โดยไม่มีฟิลด์ที่อนุญาตเลย', async () => {
      req.params = { userId: myUserId };
      req.body = { role: 'Admin', balance: 999999 }; // ส่งค่าที่ไม่อยู่ใน allowed array

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No valid fields to update' });
    });

    it('ควรแก้โปรไฟล์ตัวเองสำเร็จ และดึงข้อมูลใหม่มาตอบกลับโดยไม่มี password', async () => {
      req.params = { userId: myUserId };
      req.body = { firstName: 'NewName', avatarColor: '#000' };

      const mockUpdatedUser = { firstName: 'NewName', avatarColor: '#000' };
      const mockSelect = jest.fn().mockResolvedValue(mockUpdatedUser);
      
      User.findByIdAndUpdate.mockReturnValue({ select: mockSelect });

      await updateUser(req, res);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        myUserId,
        { $set: { firstName: 'NewName', avatarColor: '#000' } },
        { new: true, runValidators: true }
      );
      expect(mockSelect).toHaveBeenCalledWith('-password');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Profile updated', data: mockUpdatedUser });
    });
  });
});