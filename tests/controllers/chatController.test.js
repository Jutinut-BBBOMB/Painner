const { getMessages, sendMessage, getProjectChat } = require('../../controllers/chatController');
const { ProjectChat, Message } = require('../../models');
const mongoose = require('mongoose');

// จำลอง (Mock) Models
jest.mock('../../models', () => ({
  ProjectChat: {
    findOne: jest.fn(),
    create: jest.fn()
  },
  Message: {
    find: jest.fn(),
    create: jest.fn()
  }
}));

const validId = new mongoose.Types.ObjectId().toString();

describe('Chat Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { 
      params: {}, 
      body: {}, 
      user: { userId: 'my_user_id' } 
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- GET /api/chats/:chatId/messages ---
  describe('getMessages()', () => {
    it('ควรส่ง 400 ถ้า chatId ผิด format', async () => {
      req.params = { chatId: 'invalid_id' };
      await getMessages(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid chatId' });
    });

    it('ควรดึงข้อความ 200 ข้อความล่าสุดเรียงตามเวลาได้สำเร็จ', async () => {
      req.params = { chatId: validId };
      const mockMessages = [{ text: 'Hello' }, { text: 'World' }];
      
      // จำลองเชน: .populate().sort().limit()
      const mockLimit = jest.fn().mockResolvedValue(mockMessages);
      const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      
      Message.find.mockReturnValue({ populate: mockPopulate });

      await getMessages(req, res);

      expect(Message.find).toHaveBeenCalledWith({ chatId: validId });
      expect(mockPopulate).toHaveBeenCalledWith('senderId', 'firstName lastName username avatarColor');
      expect(mockSort).toHaveBeenCalledWith({ createdAt: 1 });
      expect(mockLimit).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockMessages });
    });
  });

  // --- POST /api/chats/:chatId/messages ---
  describe('sendMessage()', () => {
    it('ควรส่ง 400 ถ้า chatId ผิด format', async () => {
      req.params = { chatId: 'wrong' };
      await sendMessage(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรส่ง 400 ถ้าไม่ได้ส่งข้อความมา หรือส่งมาแต่ช่องว่าง', async () => {
      req.params = { chatId: validId };
      req.body = { text: '   ' }; // ส่งมาแค่ space
      await sendMessage(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'text is required' });
    });

    it('ควรส่งข้อความสำเร็จและ populate ข้อมูลผู้ส่งกลับมา', async () => {
      req.params = { chatId: validId };
      req.body = { text: '  Hello Team  ' }; // เทสต์ trim()

      const mockPopulatedMsg = { text: 'Hello Team', senderId: { firstName: 'John' } };
      // จำลอง object ที่ถูกสร้างมามีฟังก์ชัน populate ในตัว
      const mockMsg = { populate: jest.fn().mockResolvedValue(mockPopulatedMsg) };
      
      Message.create.mockResolvedValue(mockMsg);

      await sendMessage(req, res);

      expect(Message.create).toHaveBeenCalledWith({
        chatId: validId,
        senderId: 'my_user_id',
        text: 'Hello Team'
      });
      expect(mockMsg.populate).toHaveBeenCalledWith('senderId', 'firstName lastName username avatarColor');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockPopulatedMsg });
    });
  });

  // --- GET /api/projects/:projectId/chats ---
  describe('getProjectChat()', () => {
    it('ควรส่ง 400 ถ้า projectId ผิด format', async () => {
      req.params = { projectId: 'nope' };
      await getProjectChat(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควรคืนค่าห้องแชทที่มีอยู่แล้วได้เลย ถ้าเคยสร้างไว้แล้ว', async () => {
      req.params = { projectId: validId };
      const existingChat = { _id: 'chat_123', projectId: validId };
      
      ProjectChat.findOne.mockResolvedValue(existingChat); // หาเจอ

      await getProjectChat(req, res);

      expect(ProjectChat.findOne).toHaveBeenCalledWith({ projectId: validId });
      expect(ProjectChat.create).not.toHaveBeenCalled(); // ไม่ควรไปเรียกคำสั่งสร้างใหม่
      expect(res.json).toHaveBeenCalledWith({ success: true, data: existingChat });
    });

    it('ควรสร้างห้องแชทใหม่ให้โดยอัตโนมัติ ถ้ายังไม่เคยมีห้องแชท', async () => {
      req.params = { projectId: validId };
      const newChat = { _id: 'new_chat_123', projectId: validId };
      
      ProjectChat.findOne.mockResolvedValue(null); // หาไม่เจอ
      ProjectChat.create.mockResolvedValue(newChat); // สร้างสำเร็จ

      await getProjectChat(req, res);

      expect(ProjectChat.findOne).toHaveBeenCalledWith({ projectId: validId });
      expect(ProjectChat.create).toHaveBeenCalledWith({ projectId: validId });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: newChat });
    });
  });
});