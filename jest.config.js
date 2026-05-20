module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,         // เปิดระบบวัด Coverage
  coverageDirectory: 'coverage', // เก็บ report ไว้ในโฟลเดอร์ coverage
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    '!models/**/*.js',
    '!app.js',          // ไม่ต้องนับไฟล์หลัก 
    '!routes/**/*.js'   // Route ปกติไม่มี Logic ไม่ต้องนับ
  ],
  // บังคับให้โปรเจกต์ต้องเทสต์ผ่าน 80%
  coverageThreshold: {
    global: {
      branches: 80,   // if-else ครอบคลุม 80%
      functions: 80,  // ฟังก์ชันถูกเรียก 80%
      lines: 80,      // บรรทัดโค้ดถูกรัน 80%
      statements: 80  // คำสั่งถูกรัน 80%
    }
  }
};