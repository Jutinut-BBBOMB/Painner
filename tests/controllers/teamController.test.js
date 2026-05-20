const {
  getMyTeams,
  createTeam,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateTeamMember
} = require('../../controllers/teamController');
const { Team, TeamMember, User } = require('../../models');

// จำลอง (Mock) Models ทั้ง 3 ตัว
jest.mock('../../models', () => ({
  Team: {
    create: jest.fn()
  },
  TeamMember: {
    find: jest.fn(),
    create: jest.fn(),
    findOneAndDelete: jest.fn(),
    findOneAndUpdate: jest.fn()
  },
  User: {
    findOne: jest.fn()
  }
}));

describe('Team Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { userId: 'my_user_id' } // จำลอง user ที่ล็อกอิน
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- GET /api/teams ---
  describe('getMyTeams()', () => {
    it('ควรดึงรายชื่อทีมที่ตัวเองสังกัดอยู่ได้สำเร็จ', async () => {
      // จำลองข้อมูลที่มี teamId เป็น Object และมีฟังก์ชัน toObject()
      const mockMemberships = [
        {
          role: 'Owner',
          teamId: {
            toObject: jest.fn().mockReturnValue({ _id: 'team_1', name: 'Painner Team' })
          }
        }
      ];
      
      const mockPopulate = jest.fn().mockResolvedValue(mockMemberships);
      TeamMember.find.mockReturnValue({ populate: mockPopulate });

      await getMyTeams(req, res);

      expect(TeamMember.find).toHaveBeenCalledWith({ userId: 'my_user_id' });
      expect(mockPopulate).toHaveBeenCalledWith('teamId');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ _id: 'team_1', name: 'Painner Team', role: 'Owner' }]
      });
    });
  });

  // --- POST /api/teams ---
  describe('createTeam()', () => {
    it('ควรส่ง 400 ถ้าไม่ส่งชื่อทีม (name) มา', async () => {
      req.body = { icon: '🚀' }; // ไม่มี name
      await createTeam(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Team name required' });
    });

    it('ควรสร้างทีมสำเร็จ และใช้อักษรตัวแรกของชื่อเป็น icon ถ้าไม่ได้ส่ง icon มา', async () => {
      req.body = { name: 'DevOps' }; // ตัว D ควรกลายเป็น icon
      
      const mockTeam = { _id: 'new_team_id', name: 'DevOps', icon: 'D' };
      Team.create.mockResolvedValue(mockTeam);
      TeamMember.create.mockResolvedValue({});

      await createTeam(req, res);

      expect(Team.create).toHaveBeenCalledWith({
        name: 'DevOps',
        icon: 'D', // เช็คว่า name[0].toUpperCase() ทำงานจริง
        createdBy: 'my_user_id'
      });
      expect(TeamMember.create).toHaveBeenCalledWith({
        teamId: 'new_team_id',
        userId: 'my_user_id',
        role: 'Owner'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockTeam });
    });

    it('ควรสร้างทีมสำเร็จ โดยใช้ icon ที่ส่งมา (ถ้ามี)', async () => {
      req.body = { name: 'Backend', icon: '💻' }; // ส่ง icon มาด้วย
      
      Team.create.mockResolvedValue({ _id: 't2', name: 'Backend', icon: '💻' });
      await createTeam(req, res);

      expect(Team.create).toHaveBeenCalledWith({
        name: 'Backend',
        icon: '💻',
        createdBy: 'my_user_id'
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // --- GET /api/teams/:teamId/members ---
  describe('getTeamMembers()', () => {
    it('ควรดึงรายชื่อสมาชิกในทีมได้สำเร็จ', async () => {
      req.params = { teamId: 'team_abc' };
      
      const mockMembers = [
        {
          _id: 'member_id_1',
          userId: { _id: 'u1', email: 'a@mail.com' }, // ข้อมูล user ที่โดน populate
          role: 'Member',
          joinedAt: '2026-01-01T00:00:00.000Z'
        }
      ];
      
      const mockPopulate = jest.fn().mockResolvedValue(mockMembers);
      TeamMember.find.mockReturnValue({ populate: mockPopulate });

      await getTeamMembers(req, res);

      expect(TeamMember.find).toHaveBeenCalledWith({ teamId: 'team_abc' });
      expect(mockPopulate).toHaveBeenCalledWith('userId', '-password');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{
          _id: 'member_id_1',
          user: { _id: 'u1', email: 'a@mail.com' },
          role: 'Member',
          joinedAt: '2026-01-01T00:00:00.000Z'
        }]
      });
    });
  });

  // --- POST /api/teams/:teamId/members ---
  describe('addTeamMember()', () => {
    it('ควรส่ง 400 ถ้าไม่ส่ง email มา', async () => {
      req.params = { teamId: 'team_abc' };
      req.body = { role: 'Admin' }; // ไม่มี email
      await addTeamMember(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรส่ง 404 ถ้าหา User ด้วย email นี้ไม่เจอในระบบ', async () => {
      req.params = { teamId: 'team_abc' };
      req.body = { email: 'ghost@mail.com' };
      User.findOne.mockResolvedValue(null); // หาไม่เจอ

      await addTeamMember(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found' });
    });

    it('ควรเพิ่มสมาชิกเข้าทีมสำเร็จ', async () => {
      req.params = { teamId: 'team_abc' };
      req.body = { email: 'real@mail.com', role: 'Admin' };
      
      User.findOne.mockResolvedValue({ _id: 'real_user_id' }); // เจอ User
      const mockNewMember = { teamId: 'team_abc', userId: 'real_user_id', role: 'Admin' };
      TeamMember.create.mockResolvedValue(mockNewMember);

      await addTeamMember(req, res);

      expect(TeamMember.create).toHaveBeenCalledWith({
        teamId: 'team_abc',
        userId: 'real_user_id',
        role: 'Admin'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockNewMember });
    });
  });

  // --- DELETE /api/teams/:teamId/members/:userId ---
  describe('removeTeamMember()', () => {
    it('ควรลบสมาชิกออกจากทีมสำเร็จ', async () => {
      req.params = { teamId: 'team_abc', userId: 'target_user' };
      TeamMember.findOneAndDelete.mockResolvedValue({});

      await removeTeamMember(req, res);

      expect(TeamMember.findOneAndDelete).toHaveBeenCalledWith({
        teamId: 'team_abc',
        userId: 'target_user'
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Member removed' });
    });
  });

  // --- PATCH /api/teams/:teamId/members/:userId ---
  describe('updateTeamMember()', () => {
    it('ควรส่ง 404 ถ้าหา Member ในทีมไม่เจอ', async () => {
      req.params = { teamId: 'team_abc', userId: 'ghost_user' };
      req.body = { role: 'Admin' };
      
      TeamMember.findOneAndUpdate.mockResolvedValue(null);

      await updateTeamMember(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Member not found' });
    });

    it('ควรเปลี่ยน Role ของสมาชิกสำเร็จ', async () => {
      req.params = { teamId: 'team_abc', userId: 'real_user' };
      req.body = { role: 'Manager' };
      
      const mockUpdated = { teamId: 'team_abc', userId: 'real_user', role: 'Manager' };
      TeamMember.findOneAndUpdate.mockResolvedValue(mockUpdated);

      await updateTeamMember(req, res);

      expect(TeamMember.findOneAndUpdate).toHaveBeenCalledWith(
        { teamId: 'team_abc', userId: 'real_user' },
        { $set: { role: 'Manager' } },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockUpdated });
    });
  });
});