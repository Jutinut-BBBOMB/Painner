const errorHandler = require('../../middleware/errorHandler');

describe('ErrorHandler Middleware', () => {
  let req, res, next;

  // รีเซ็ตตัวแปรใหม่ทุกครั้งก่อนรันแต่ละเคส
  beforeEach(() => {
    req = {}; // errorHandler ไม่ได้ใช้ req เลยส่งเป็น object ว่างๆ ได้
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ควรจัดการ ValidationError (400) และดึงข้อความ error ออกมาได้ถูกต้อง', () => {
    // Arrange: จำลอง Error แบบ Validation ของ Mongoose
    const err = {
      name: 'ValidationError',
      errors: {
        username: { message: 'Username is required' },
        password: { message: 'Password is too short' }
      }
    };
    
    // Act
    errorHandler(err, req, res, next);
    
    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Username is required, Password is too short'
    });
  });

  it('ควรจัดการ CastError (400) ได้ถูกต้อง', () => {
    const err = { name: 'CastError' };
    
    errorHandler(err, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid ID format'
    });
  });

  it('ควรจัดการ Error ข้อมูลซ้ำ 11000 (409) แบบรู้ชื่อ Field ได้', () => {
    const err = {
      code: 11000,
      keyValue: { email: 'test@example.com' } // สมมติว่า email ซ้ำ
    };
    
    errorHandler(err, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'email already exists'
    });
  });

  it('ควรจัดการ Error 11000 (409) แบบไม่รู้ชื่อ Field ได้ (ใช้ค่าเริ่มต้น)', () => {
    const err = { code: 11000 }; // ไม่มี keyValue ส่งมา
    
    errorHandler(err, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'field already exists'
    });
  });

  it('ควรคืนค่า statusCode และ message ตามที่กำหนดมาให้ใน Custom Error ได้', () => {
    const err = new Error('You do not have permission');
    err.statusCode = 403; // แกล้งใส่ status เป็น 403 Forbidden
    
    errorHandler(err, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'You do not have permission'
    });
  });

  it('ควรคืนค่า 500 Internal Server Error ถ้าระบุ Error ไม่ชัดเจน', () => {
    const err = {}; // โยน object เปล่าๆ เข้าไป (ไม่มี status, ไม่มี message)
    
    errorHandler(err, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal Server Error'
    });
  });
});