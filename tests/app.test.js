const request = require('supertest');
const app = require('../app'); // ดึง app.js ของคุณมา

describe('App & Health Check', () => {
  it('GET /health ควรตอบกลับมาเป็น { status: "ok" } (HTTP 200)', async () => {
    // Act: ยิง API ไปที่ /health
    const res = await request(app).get('/health');
    
    // Assert: ตรวจสอบผลลัพธ์
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('ควรตอบ HTTP 404 ถ้ายิงไปหา Route ที่ไม่มีอยู่จริง', async () => {
    // Act: แกล้งยิงไป Route มั่วๆ
    const res = await request(app).get('/api/route-mou-mou');
    
    // Assert: ต้องได้ 404 Not Found
    expect(res.statusCode).toBe(404);
  });
});