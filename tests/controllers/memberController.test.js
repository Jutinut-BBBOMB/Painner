const { getMembers, getMember, addMember, editMember, removeMember } = require('../../controllers/memberController');
const { ProjectMember } = require('../../models');
const mongoose = require('mongoose');

// Mock ProjectMember Model
jest.mock('../../models', () => ({
  ProjectMember: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn()
  }
}));

const validPId = new mongoose.Types.ObjectId().toString();
const validUId = new mongoose.Types.ObjectId().toString();
const myUserId = new mongoose.Types.ObjectId().toString(); // ไอดีสมมติของเราเอง

describe('Member Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { userId: myUserId }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- GET /api/projects/:projectId/members ---
  describe('getMembers()', () => {
    it('ควรส่ง 400 ถ้า projectId ผิด format', async () => {
      req.params = { projectId: 'nope' };
      await getMembers(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรดึงข้อมูล members พร้อม populate userId ได้สำเร็จ', async () => {
      req.params = { projectId: validPId };
      const mockPopulate = jest.fn().mockResolvedValue([{ role: 'Owner' }]);
      ProjectMember.find.mockReturnValue({ populate: mockPopulate });

      await getMembers(req, res);

      expect(ProjectMember.find).toHaveBeenCalledWith({ projectId: validPId });
      expect(mockPopulate).toHaveBeenCalledWith('userId', '-password');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ role: 'Owner' }] });
    });
  });

  // --- GET /api/projects/:projectId/members/:userId ---
  describe('getMember()', () => {
    it('ควรส่ง 400 ถ้า projectId ผิด format', async () => {
      req.params = { projectId: 'nope', userId: validUId };
      await getMember(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรส่ง 400 ถ้า userId ผิด format', async () => {
      req.params = { projectId: validPId, userId: 'nope' };
      await getMember(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรส่ง 404 ถ้าหา member ไม่เจอ', async () => {
      req.params = { projectId: validPId, userId: validUId };
      const mockPopulate = jest.fn().mockResolvedValue(null);
      ProjectMember.findOne.mockReturnValue({ populate: mockPopulate });

      await getMember(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('ควรดึงข้อมูล member เจาะจงคนได้สำเร็จ', async () => {
      req.params = { projectId: validPId, userId: validUId };
      const mockPopulate = jest.fn().mockResolvedValue({ role: 'Member' });
      ProjectMember.findOne.mockReturnValue({ populate: mockPopulate });

      await getMember(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { role: 'Member' } });
    });
  });

  // --- POST /api/projects/:projectId/members ---
  describe('addMember()', () => {
    it('ควรส่ง 400 ถ้าไม่ส่ง userId มาใน body', async () => {
      req.params = { projectId: validPId };
      req.body = { role: 'Admin' };
      await addMember(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรเพิ่ม member และใช้ role เริ่มต้นเป็น Member ถ้าไม่ได้ส่ง role มา', async () => {
      req.params = { projectId: validPId };
      req.body = { userId: validUId }; // ไม่ได้ส่ง role
      ProjectMember.create.mockResolvedValue({});

      await addMember(req, res);

      expect(ProjectMember.create).toHaveBeenCalledWith({
        projectId: validPId,
        userId: validUId,
        role: 'Member' // ค่า default
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // --- PUT /api/projects/:projectId/members/:userId ---
  describe('editMember()', () => {
    it('ควรส่ง 400 ถ้า projectId ผิด format', async () => {
      req.params = { projectId: 'bad', userId: validUId };
      await editMember(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรส่ง 400 ถ้า userId ผิด format', async () => {
      req.params = { projectId: validPId, userId: 'bad' };
      await editMember(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรส่ง 404 ถ้าเป้าหมายที่จะแก้ไม่ได้เป็น member ในโปรเจกต์', async () => {
      req.params = { projectId: validPId, userId: validUId };
      // จำลองครั้งที่ 1 (หาเป้าหมาย) ให้คืนค่า null
      ProjectMember.findOne.mockResolvedValueOnce(null); 
      
      await editMember(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('ควรส่ง 403 (Permission denied) ถ้าคนแก้ไม่ใช่ Owner และไม่ใช่ตัวเอง', async () => {
      req.params = { projectId: validPId, userId: validUId }; // จะแก้ข้อมูลของ validUId
      
      // เป้าหมายมีตัวตน
      ProjectMember.findOne.mockResolvedValueOnce({ userId: validUId, role: 'Member' });
      // คนแก้ (เราเอง) มีตัวตน แต่เป็นแค่ Member ธรรมดา
      ProjectMember.findOne.mockResolvedValueOnce({ userId: myUserId, role: 'Member' });

      await editMember(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Permission denied' });
    });

    it('ควรส่ง 403 ถ้าแก้โปรไฟล์ตัวเองได้ แต่ดันพยายามจะเปลี่ยน Role ด้วย (ไม่ใช่ Owner)', async () => {
      req.params = { projectId: validPId, userId: myUserId }; // แก้ตัวเอง
      req.body = { role: 'Owner' }; // แอบอัปเกรดตัวเอง!

      ProjectMember.findOne.mockResolvedValueOnce({ userId: myUserId, role: 'Member' }); // เป้าหมายคือเราเอง
      ProjectMember.findOne.mockResolvedValueOnce({ userId: myUserId, role: 'Member' }); // คนสั่งคือเราเอง (เป็นแค่ Member)

      await editMember(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Only Owner can change roles' });
    });

    it('ควรส่ง 400 ถ้าไม่ได้ส่ง field ที่อนุญาตให้แก้มาเลย', async () => {
      req.params = { projectId: validPId, userId: myUserId };
      req.body = { hack_level: 99 }; // ส่ง field มั่วมา

      ProjectMember.findOne.mockResolvedValueOnce({ userId: myUserId, role: 'Member' });
      ProjectMember.findOne.mockResolvedValueOnce({ userId: myUserId, role: 'Member' });

      await editMember(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No valid fields' });
    });

    it('ควรแก้ข้อมูลสำเร็จ (กรณี: แก้โปรไฟล์ตัวเอง เปลี่ยนชื่อกับสีได้)', async () => {
      req.params = { projectId: validPId, userId: myUserId };
      req.body = { displayName: 'New Name', avatarColor: '#FFF' };

      ProjectMember.findOne.mockResolvedValueOnce({ userId: myUserId, role: 'Member' });
      ProjectMember.findOne.mockResolvedValueOnce({ userId: myUserId, role: 'Member' });

      const mockPopulate = jest.fn().mockResolvedValue({ displayName: 'New Name' });
      ProjectMember.findOneAndUpdate.mockReturnValue({ populate: mockPopulate });

      await editMember(req, res);

      expect(ProjectMember.findOneAndUpdate).toHaveBeenCalledWith(
        { projectId: validPId, userId: myUserId },
        { $set: { displayName: 'New Name', avatarColor: '#FFF' } },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  // --- DELETE /api/projects/:projectId/members/:userId ---
  describe('removeMember()', () => {
    it('ควรลบ member ออกจากโปรเจกต์ได้', async () => {
      req.params = { projectId: validPId, userId: validUId };
      ProjectMember.findOneAndDelete.mockResolvedValue({});

      await removeMember(req, res);

      expect(ProjectMember.findOneAndDelete).toHaveBeenCalledWith({
        projectId: validPId,
        userId: validUId
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Member removed' });
    });
  });
});