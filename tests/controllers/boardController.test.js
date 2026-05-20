const {
  getBoard,
  getTasksByBoard,
  updateBoard,
  deleteBoard,
  getBoardsByProject,
  createBoard
} = require('../../controllers/boardController');
const { Board, Task } = require('../../models');
const mongoose = require('mongoose');

// จำลอง (Mock) Models
jest.mock('../../models', () => ({
  Board: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    find: jest.fn(),
    create: jest.fn()
  },
  Task: {
    find: jest.fn(),
    deleteMany: jest.fn()
  }
}));

// ฟังก์ชันสร้าง ObjectId ปลอมที่ถูกต้องตาม format ของ mongoose
const validObjectId = new mongoose.Types.ObjectId().toString();

describe('Board Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, user: { userId: 'user_id_123' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- GET /api/boards/:boardId ---
  describe('getBoard()', () => {
    it('ควรคืนค่า 400 ถ้า boardId ไม่ถูกต้องตาม format (Invalid ObjectId)', async () => {
      req.params = { boardId: 'invalid_id_format' };

      await getBoard(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid boardId' });
    });

    it('ควรคืนค่า 404 ถ้าหา Board ไม่เจอ', async () => {
      req.params = { boardId: validObjectId };
      // Mock เชน: .populate()
      const mockPopulate = jest.fn().mockResolvedValue(null);
      Board.findById.mockReturnValue({ populate: mockPopulate });

      await getBoard(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Board not found' });
    });

    it('ควรคืนข้อมูล Board พร้อม populate ชื่อโปรเจกต์', async () => {
      req.params = { boardId: validObjectId };
      const mockBoard = { _id: validObjectId, name: 'To Do', projectId: { name: 'Painner' } };
      const mockPopulate = jest.fn().mockResolvedValue(mockBoard);
      Board.findById.mockReturnValue({ populate: mockPopulate });

      await getBoard(req, res);

      expect(Board.findById).toHaveBeenCalledWith(validObjectId);
      expect(mockPopulate).toHaveBeenCalledWith('projectId', 'name');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockBoard });
    });
  });

  // --- GET /api/boards/:boardId/tasks ---
  describe('getTasksByBoard()', () => {
    it('ควรคืนค่า 400 ถ้า boardId ไม่ถูกต้อง', async () => {
      req.params = { boardId: 'bad_id' };
      await getTasksByBoard(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรดึง Tasks พร้อมข้อมูลผู้รับผิดชอบและเรียงตามเวลาได้สำเร็จ', async () => {
      req.params = { boardId: validObjectId };
      const mockTasks = [{ title: 'Fix bug' }];
      
      // Mock เชน: .populate().sort()
      const mockSort = jest.fn().mockResolvedValue(mockTasks);
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      Task.find.mockReturnValue({ populate: mockPopulate });

      await getTasksByBoard(req, res);

      expect(Task.find).toHaveBeenCalledWith({ boardId: validObjectId });
      expect(mockPopulate).toHaveBeenCalledWith('assigneeId', 'firstName lastName username avatarColor');
      expect(mockSort).toHaveBeenCalledWith({ createdAt: 1 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockTasks });
    });
  });

  // --- PATCH /api/boards/:boardId ---
  describe('updateBoard()', () => {
    it('ควรคืนค่า 400 ถ้า boardId ไม่ถูกต้อง', async () => {
      req.params = { boardId: 'invalid_id' };
      await updateBoard(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรคืนค่า 400 ถ้าไม่ได้ส่ง name มา หรือส่งแต่ช่องว่าง', async () => {
      req.params = { boardId: validObjectId };
      req.body = { name: '   ' }; // ส่งชื่อว่างๆ
      await updateBoard(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Board name is required' });
    });

    it('ควรคืนค่า 404 ถ้าหา Board ที่จะแก้ไม่เจอ', async () => {
      req.params = { boardId: validObjectId };
      req.body = { name: 'New Name' };
      Board.findByIdAndUpdate.mockResolvedValue(null);

      await updateBoard(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('ควรแก้ไข Board พร้อมตัดช่องว่างหน้าหลัง (trim) ได้สำเร็จ', async () => {
      req.params = { boardId: validObjectId };
      req.body = { name: '  Clean Name  ' }; // เทสต์การ trim()
      const mockUpdatedBoard = { _id: validObjectId, name: 'Clean Name' };
      Board.findByIdAndUpdate.mockResolvedValue(mockUpdatedBoard);

      await updateBoard(req, res);

      expect(Board.findByIdAndUpdate).toHaveBeenCalledWith(
        validObjectId, 
        { $set: { name: 'Clean Name' } }, 
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockUpdatedBoard });
    });
  });

  // --- DELETE /api/boards/:boardId ---
  describe('deleteBoard()', () => {
    it('ควรคืนค่า 400 ถ้า boardId ไม่ถูกต้อง', async () => {
      req.params = { boardId: 'wrong_format' };
      await deleteBoard(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรลบ Board และ Task ในบอร์ดทิ้งทั้งหมดสำเร็จ', async () => {
      req.params = { boardId: validObjectId };
      Board.findByIdAndDelete.mockResolvedValue({});
      Task.deleteMany.mockResolvedValue({});

      await deleteBoard(req, res);

      expect(Board.findByIdAndDelete).toHaveBeenCalledWith(validObjectId);
      expect(Task.deleteMany).toHaveBeenCalledWith({ boardId: validObjectId });
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Board and its tasks deleted' });
    });
  });

  // --- GET /api/projects/:projectId/boards ---
  describe('getBoardsByProject()', () => {
    it('ควรคืนค่า 400 ถ้า projectId ไม่ถูกต้อง', async () => {
      req.params = { projectId: 'nope' };
      await getBoardsByProject(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรดึงข้อมูล Board ในโปรเจกต์ได้', async () => {
      req.params = { projectId: validObjectId };
      const mockBoards = [{ name: 'To Do' }];
      const mockSort = jest.fn().mockResolvedValue(mockBoards);
      Board.find.mockReturnValue({ sort: mockSort });

      await getBoardsByProject(req, res);

      expect(Board.find).toHaveBeenCalledWith({ projectId: validObjectId });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockBoards });
    });
  });

  // --- POST /api/projects/:projectId/boards (createBoard) ---
  describe('createBoard()', () => {
    it('ควรคืนค่า 400 ถ้า projectId ไม่ถูกต้อง', async () => {
      req.params = { projectId: 'bad_id' };
      req.body = { name: 'New Board' };
      await createBoard(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรคืนค่า 400 ถ้าไม่ส่งชื่อ Board', async () => {
      req.params = { projectId: validObjectId };
      req.body = {};
      await createBoard(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Board name is required' });
    });

    it('ควรสร้าง Board ใหม่สำเร็จ', async () => {
      req.params = { projectId: validObjectId };
      req.body = { name: '  Done  ' }; // เทสต์การ trim()
      const mockCreatedBoard = { _id: 'new_board', name: 'Done', projectId: validObjectId };
      Board.create.mockResolvedValue(mockCreatedBoard);

      await createBoard(req, res);

      expect(Board.create).toHaveBeenCalledWith({
        name: 'Done',
        projectId: validObjectId,
        createdBy: 'user_id_123'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Board created',
        data: mockCreatedBoard
      });
    });
  });
});