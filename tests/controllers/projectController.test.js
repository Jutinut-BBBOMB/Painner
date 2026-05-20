const { 
  getProjects, 
  getProject, 
  createProject, 
  updateProject, 
  deleteProject, 
  getProjectStats 
} = require('../../controllers/projectController');

// นำเข้า Models เพื่อมาทำ Mock
const { Project, ProjectMember, Task } = require('../../models');

// จำลอง Models ทั้ง 3 ตัว
jest.mock('../../models', () => ({
  Project: {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
  },
  ProjectMember: {
    create: jest.fn()
  },
  Task: {
    find: jest.fn(),
    deleteMany: jest.fn()
  }
}));

describe('Project Controller', () => {
  let req, res;

  beforeEach(() => {
    // รีเซ็ต req และ res ใหม่ทุกครั้ง
    req = { 
      query: {}, 
      params: {}, 
      body: {}, 
      user: { userId: 'user_id_123' } // จำลองข้อมูล user ที่ได้จาก authenticate middleware
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- หมวด: GET /api/projects ---
  describe('getProjects()', () => {
    it('ควรดึงโปรเจกต์ของทีมตาม teamId และเรียงลำดับได้ถูกต้อง', async () => {
      req.query = { teamId: 'team_id_1' };
      
      // การ Mock .find().sort() ต้องทำแบบเชนกัน
      const mockSort = jest.fn().mockResolvedValue([{ name: 'Project A' }]);
      Project.find.mockReturnValue({ sort: mockSort });

      await getProjects(req, res);

      expect(Project.find).toHaveBeenCalledWith({ teamId: 'team_id_1' });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ name: 'Project A' }] });
    });

    it('ควรดึงโปรเจกต์ทั้งหมด (filter ว่าง) ถ้าไม่ได้ส่ง teamId มา', async () => {
      req.query = {}; // ไม่มี teamId
      
      const mockSort = jest.fn().mockResolvedValue([{ name: 'All Projects' }]);
      Project.find.mockReturnValue({ sort: mockSort });

      await getProjects(req, res);

      expect(Project.find).toHaveBeenCalledWith({});
    });
  });

  // --- หมวด: GET /api/projects/:projectId ---
  describe('getProject()', () => {
    it('ควรคืนค่า 404 ถ้าหาโปรเจกต์ไม่เจอ', async () => {
      req.params = { projectId: 'ghost_id' };
      Project.findById.mockResolvedValue(null);

      await getProject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Project not found' });
    });

    it('ควรคืนค่าข้อมูลโปรเจกต์ถ้าค้นหาสำเร็จ', async () => {
      req.params = { projectId: 'real_id' };
      Project.findById.mockResolvedValue({ _id: 'real_id', name: 'My Project' });

      await getProject(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: 'real_id', name: 'My Project' } });
    });
  });

  // --- หมวด: POST /api/projects ---
  describe('createProject()', () => {
    it('ควรคืนค่า 400 ถ้าไม่ส่ง name หรือ teamId', async () => {
      req.body = { name: 'Only Name' }; // ขาด teamId

      await createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'name and teamId required' });
    });

    it('ควรสร้างโปรเจกต์และเพิ่ม ProjectMember แบบ Owner สำเร็จ', async () => {
      req.body = { name: 'New Project', teamId: 'team_1' };
      
      // Mock การสร้างโปรเจกต์สำเร็จ
      const mockProject = { _id: 'new_project_id', name: 'New Project', teamId: 'team_1' };
      Project.create.mockResolvedValue(mockProject);
      ProjectMember.create.mockResolvedValue({});

      await createProject(req, res);

      // ตรวจสอบว่าสั่งสร้างโปรเจกต์และสร้าง member ถูกต้อง
      expect(Project.create).toHaveBeenCalledWith({ name: 'New Project', teamId: 'team_1', createdBy: 'user_id_123' });
      expect(ProjectMember.create).toHaveBeenCalledWith({ 
        projectId: 'new_project_id', 
        userId: 'user_id_123', 
        role: 'Owner', 
        displayName: '' 
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockProject });
    });
  });

  // --- หมวด: PATCH /api/projects/:projectId ---
  describe('updateProject()', () => {
    it('ควรคืนค่า 404 ถ้าหาโปรเจกต์ที่จะแก้ไม่เจอ', async () => {
      req.params = { projectId: 'no_id' };
      req.body = { name: 'Update Name' };
      Project.findByIdAndUpdate.mockResolvedValue(null);

      await updateProject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Project not found' });
    });

    it('ควรแก้ไขข้อมูลโปรเจกต์สำเร็จ', async () => {
      req.params = { projectId: 'real_id' };
      req.body = { name: 'Updated', status: 'active' };
      
      const mockUpdatedProject = { _id: 'real_id', name: 'Updated', status: 'active' };
      Project.findByIdAndUpdate.mockResolvedValue(mockUpdatedProject);

      await updateProject(req, res);

      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        'real_id', 
        { $set: { name: 'Updated', status: 'active' } }, 
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockUpdatedProject });
    });
  });

  // --- หมวด: DELETE /api/projects/:projectId ---
  describe('deleteProject()', () => {
    it('ควรลบโปรเจกต์และลบ Task ที่อยู่ในโปรเจกต์ทั้งหมดออก', async () => {
      req.params = { projectId: 'target_id' };
      
      Project.findByIdAndDelete.mockResolvedValue({});
      Task.deleteMany.mockResolvedValue({});

      await deleteProject(req, res);

      expect(Project.findByIdAndDelete).toHaveBeenCalledWith('target_id');
      expect(Task.deleteMany).toHaveBeenCalledWith({ projectId: 'target_id' });
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Project deleted' });
    });
  });

  // --- หมวด: GET /api/projects/:projectId/stats ---
  describe('getProjectStats()', () => {
    it('ควรคำนวณและสรุปจำนวน Task แยกตาม Status ได้ถูกต้อง', async () => {
      req.params = { projectId: 'project_id' };
      
      // จำลอง Tasks ในบอร์ด 4 ตัว (todo=2, inprogress=1, done=1, review=0)
      const mockTasks = [
        { status: 'todo' },
        { status: 'todo' },
        { status: 'inprogress' },
        { status: 'done' }
      ];
      Task.find.mockResolvedValue(mockTasks);

      await getProjectStats(req, res);

      expect(Task.find).toHaveBeenCalledWith({ projectId: 'project_id' });
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: { 
          todo: 2, 
          inprogress: 1, 
          review: 0, 
          done: 1, 
          total: 4 
        } 
      });
    });
  });
});