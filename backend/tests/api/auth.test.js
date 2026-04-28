const request = require('supertest');
const app = require('../../server');

// 关键：完整 Mock userModel 的所有方法
jest.mock('../../models/userModel', () => ({
  findByUserName: jest.fn(),
  createUser: jest.fn()
}));

// 导入 Mock 后的模型
const UserModel = require('../../models/userModel');

describe('认证接口测试', () => {
  beforeEach(() => {
    // 每次测试前清空所有 Mock 调用记录
    jest.clearAllMocks();
  });

  test('POST /api/auth/register 注册成功', async () => {
    // 1. 给 Mock 方法设置返回值
    UserModel.findByUserName.mockResolvedValue(null);
    UserModel.createUser.mockResolvedValue({
      id: 1,
      user_name: 'testuser',
      role: 'student'
    });

    // 2. 发送请求
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        user_name: 'testuser',
        password: '123456',
        role: 'student'
      });

    // 3. 断言结果
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(UserModel.findByUserName).toHaveBeenCalledWith('testuser');
    expect(UserModel.createUser).toHaveBeenCalled();
  });

  test('POST /api/auth/register 缺少参数返回 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: '123456' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});