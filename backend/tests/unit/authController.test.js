const { register, login } = require('../../controllers/authController');
// 修正路径：从 models/user 改为 models/userModel
const UserModel = require('../../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../../models/userModel'); // 这里也要改
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('authController 单元测试', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('注册：用户名已存在应返回 400', async () => {
    req.body = { user_name: 'test', password: '123456' };
    UserModel.findByUserName.mockResolvedValue({ user_name: 'test' });

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});