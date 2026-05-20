const { getTask, createTask, editTask, deleteTask } = require('../../controllers/taskController');
const { Task } = require('../../models');
const mongoose = require('mongoose');

// จำลอง Task Model
jest.mock('../../models', () => ({
  Task: {
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
  }
}));

const validId = new mongoose.Types.ObjectId().toString();
const myUserId = new mongoose.Types.ObjectId().toString(); // ไอดีของเราเอง (จำลอง)

describe('Task Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { 
      params: {}, 
      body: {}, 
      user: { userId: myUserId } // กำหนดให้เราคือ User ที่ล็อกอินเข้ามา
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- GET /api/tasks/:taskId ---
  describe('getTask()', () => {
    it('ควรส่ง 400 ถ้า taskId ผิด format', async () => {
      req.params = { taskId: 'invalid' };
      await getTask(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรส่ง 404 ถ้าหา Task ไม่เจอ', async () => {
      req.params = { taskId: validId };
      // ต้องจำลอง populate แบบเชน 3 ชั้น!
      const mockPopulate3 = jest.fn().mockResolvedValue(null);
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 });
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
      
      Task.findById.mockReturnValue({ populate: mockPopulate1 });

      await getTask(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('ควรดึง Task พร้อม Populate ข้อมูลสำเร็จ', async () => {
      req.params = { taskId: validId };
      const mockTask = { _id: validId, title: 'Test Task' };
      
      const mockPopulate3 = jest.fn().mockResolvedValue(mockTask);
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 });
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
      
      Task.findById.mockReturnValue({ populate: mockPopulate1 });

      await getTask(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockTask });
    });
  });

  // --- POST /api/boards/:boardId/tasks ---
  describe('createTask()', () => {
    it('ควรส่ง 400 ถ้า boardId ผิด format', async () => {
      req.params = { boardId: 'invalid' };
      await createTask(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรส่ง 400 ถ้าไม่ส่ง title มา', async () => {
      req.params = { boardId: validId };
      req.body = { category: 'feature', projectId: validId };
      await createTask(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'title is required' });
    });

    it('ควรส่ง 400 ถ้าไม่ส่ง category มา', async () => {
      req.params = { boardId: validId };
      req.body = { title: 'New Task', projectId: validId };
      await createTask(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'category is required' });
    });

    it('ควรส่ง 400 ถ้าไม่ส่ง projectId มา', async () => {
      req.params = { boardId: validId };
      req.body = { title: 'New Task', category: 'feature' };
      await createTask(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'projectId is required' });
    });

    it('ควรสร้าง Task สำเร็จพร้อมใช้ค่าเริ่มต้น (default values) กรณีไม่ได้ส่งครบ', async () => {
      req.params = { boardId: validId };
      req.body = { title: 'New Task', category: 'bug', projectId: validId }; // ส่งแค่นี้
      
      const mockTask = { 
        populate: jest.fn().mockResolvedValue({ title: 'New Task', status: 'todo' }) 
      };
      Task.create.mockResolvedValue(mockTask);

      await createTask(req, res);

      // ตรวจสอบว่าระบบเติมค่า default ให้เอง (เช่น description: '', status: 'todo')
      expect(Task.create).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Task',
        description: '',
        status: 'todo',
        assigneeId: null,
        dueDate: null
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // --- PUT /api/tasks/:taskId ---
  describe('editTask()', () => {
    it('ควรส่ง 400 ถ้า taskId ผิด format', async () => {
      req.params = { taskId: 'invalid' };
      await editTask(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรส่ง 404 ถ้าหา Task ที่จะแก้ไม่เจอ', async () => {
      req.params = { taskId: validId };
      Task.findById.mockResolvedValue(null);
      await editTask(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('ควรส่ง 403 (Permission denied) ถ้าคนที่แก้ ไม่ใช่คนสร้าง Task', async () => {
      req.params = { taskId: validId };
      // จำลองว่า Task นี้ ถูกสร้างโดยคนอื่น (other_user)
      Task.findById.mockResolvedValue({ createdBy: 'other_user_id' });
      
      await editTask(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Permission denied' });
    });

    it('ควรส่ง 400 ถ้ายิง API มาแก้ แต่ไม่ได้ส่ง Field ที่อนุญาตมาเลย (เช่น ส่ง field มั่วมา)', async () => {
      req.params = { taskId: validId };
      req.body = { hackerField: 'hack_the_system' }; // Field นี้ไม่อยู่ใน allowed array
      
      // เราเป็นคนสร้างเอง มีสิทธิ์แก้
      Task.findById.mockResolvedValue({ createdBy: myUserId }); 
      
      await editTask(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No valid fields provided' });
    });

    it('ควรแก้ไข Task สำเร็จ ถ้าส่งข้อมูลที่ถูกต้องมา', async () => {
      req.params = { taskId: validId };
      req.body = { title: 'Updated Title', status: 'done' };
      
      Task.findById.mockResolvedValue({ createdBy: myUserId });
      
      const mockUpdated = { _id: validId, title: 'Updated Title' };
      const mockPopulate = jest.fn().mockResolvedValue(mockUpdated);
      Task.findByIdAndUpdate.mockReturnValue({ populate: mockPopulate });

      await editTask(req, res);

      expect(Task.findByIdAndUpdate).toHaveBeenCalledWith(
        validId,
        { $set: { title: 'Updated Title', status: 'done' } },
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Task updated', data: mockUpdated });
    });
  });

  // --- DELETE /api/tasks/:taskId ---
  describe('deleteTask()', () => {
    it('ควรส่ง 400 ถ้า taskId ผิด format', async () => {
      req.params = { taskId: 'invalid' };
      await deleteTask(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรส่ง 404 ถ้าหา Task ที่จะลบไม่เจอ', async () => {
      req.params = { taskId: validId };
      Task.findById.mockResolvedValue(null);
      await deleteTask(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('ควรลบ Task สำเร็จ', async () => {
      req.params = { taskId: validId };
      Task.findById.mockResolvedValue({ _id: validId }); // เจอ Task
      Task.findByIdAndDelete.mockResolvedValue({});

      await deleteTask(req, res);
      expect(Task.findByIdAndDelete).toHaveBeenCalledWith(validId);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Task deleted' });
    });
  });
});