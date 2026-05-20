const jwt = require('jsonwebtoken');
// 1. แก้การ Import ให้ถูกต้อง (เอาวงเล็บปีกกา {} ออก)
const authenticate = require('../../middleware/authenticate'); 

// 2. จำลองไลบรารี jsonwebtoken เพื่อให้เราควบคุมผลลัพธ์ของมันได้
jest.mock('jsonwebtoken');

describe('Auth Middleware (authenticate.js)', () => {
  let req, res, next;

  // 3. รีเซ็ต Request, Response และ Next ใหม่ทุกครั้งก่อนเริ่มแต่ละเคส
  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  // ล้างค่าที่จำลองไว้หลังจากเทสต์เสร็จ
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ควรส่ง 401 ถ้าไม่มี header authorization', () => {
    authenticate(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Authorization token missing' });
  });

  it('ควรส่ง 401 ถ้ามี header แต่ไม่ได้นำหน้าด้วย Bearer ', () => {
    req.headers['authorization'] = 'Basic somerandomtoken';
    authenticate(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Authorization token missing' });
  });

  it('ควรเรียก next() และแนบข้อมูลลง req.user ถ้า Token ถูกต้อง', () => {
    req.headers['authorization'] = 'Bearer valid_token_here';
    
    // จำลองให้ jwt.verify คืนค่าข้อมูล User กลับมาสำเร็จ
    const mockDecodedData = { userId: '12345', role: 'member' };
    jwt.verify.mockReturnValue(mockDecodedData); 

    authenticate(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid_token_here', process.env.JWT_SECRET);
    expect(req.user).toEqual(mockDecodedData);
    expect(next).toHaveBeenCalledTimes(1); // เช็คว่าสั่งไปต่อ (next) จริง
  });

  it('ควรส่ง 401 ถ้า Token หมดอายุ (TokenExpiredError)', () => {
    req.headers['authorization'] = 'Bearer expired_token';
    
    // จำลอง Error แบบ Token หมดอายุ
    const error = new Error('jwt expired');
    error.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => { throw error; }); 

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Token has expired' });
  });

  it('ควรส่ง 401 ถ้า Token ผิดรูปแบบหรือไม่ถูกต้อง (Invalid token)', () => {
    req.headers['authorization'] = 'Bearer invalid_token';
    
    // จำลอง Error แบบอื่นๆ (เช่น ถอดรหัสไม่ได้, โดนปลอมแปลง)
    const error = new Error('invalid signature');
    error.name = 'JsonWebTokenError';
    jwt.verify.mockImplementation(() => { throw error; });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid token' });
  });
});