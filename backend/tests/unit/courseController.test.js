const CourseController = require('../../controllers/courseController');
const Course = require('../../models/Course');
const Chapter = require('../../models/Chapter');

// Mock 模型
jest.mock('../../models/Course');
jest.mock('../../models/Chapter');

describe('CourseController 单元测试', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: { userId: 1 }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------
  // 1. 获取所有课程
  // ------------------------------
  test('getAllCourses → 成功返回课程列表', async () => {
    Course.getAll.mockResolvedValue([{ course_id: 1 }]);

    await CourseController.getAllCourses(req, res);

    expect(res.status).not.toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  // ------------------------------
  // 2. 获取课程详情（存在）
  // ------------------------------
  test('getCourse → 课程存在，返回成功', async () => {
    req.params.courseId = 1;
    Course.getById.mockResolvedValue({ course_id: 1 });

    await CourseController.getCourse(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  // ------------------------------
  // 3. 获取课程详情（不存在）
  // ------------------------------
  test('getCourse → 课程不存在，返回 404', async () => {
    req.params.courseId = 999;
    Course.getById.mockResolvedValue(null);

    await CourseController.getCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  // ------------------------------
  // 4. 获取章节
  // ------------------------------
  test('getChapters → 返回章节列表', async () => {
    req.params.courseId = 1;
    Chapter.getByCourseId.mockResolvedValue([{ chapter_id: 1 }]);
    Chapter.getVideos.mockResolvedValue([]);

    await CourseController.getChapters(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  // ------------------------------
  // 5. 搜索课程
  // ------------------------------
  test('searchCourses → 关键词搜索成功', async () => {
    req.query.q = '测试';
    Course.search.mockResolvedValue([{ course_id: 1 }]);

    await CourseController.searchCourses(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});