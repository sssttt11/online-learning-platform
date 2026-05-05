const request = require('supertest');
const app = require('../../server');

// 完全按你的代码 Mock
jest.mock('../../models/Course', () => ({
  getById: jest.fn(),
  getAll: jest.fn(),
  getStats: jest.fn(),
  getFavoriteStatus: jest.fn(),
  setFavoriteStatus: jest.fn(),
  search: jest.fn(),
  getCourseReviews: jest.fn(),
  getRelatedCourses: jest.fn(),
  submitCourseReview: jest.fn()
}));

jest.mock('../../models/Chapter', () => ({
  getByCourseId: jest.fn(),
  getVideos: jest.fn()
}));

const Course = require('../../models/Course');
const Chapter = require('../../models/Chapter');

describe('课程接口 API 测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. 获取所有课程
  test('GET /api/courses → 获取所有课程', async () => {
    Course.getAll.mockResolvedValue([
      { course_id: 1, course_name: '测试课程' }
    ]);

    const res = await request(app).get('/api/courses');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  // 2. 获取单个课程详情
  test('GET /api/courses/:courseId → 获取课程详情', async () => {
    Course.getById.mockResolvedValue({
      course_id: 1,
      course_name: '测试课程'
    });

    const res = await request(app).get('/api/courses/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.course_id).toBe(1);
  });

  // 3. 课程不存在 → 404
  test('GET /api/courses/:id → 课程不存在返回 404', async () => {
    Course.getById.mockResolvedValue(null);

    const res = await request(app).get('/api/courses/999');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // 4. 获取课程章节
  test('GET /api/courses/:courseId/chapters → 获取章节', async () => {
    Chapter.getByCourseId.mockResolvedValue([
      { chapter_id: 1, chapter_title: '第一章' }
    ]);
    Chapter.getVideos.mockResolvedValue([]);

    const res = await request(app).get('/api/courses/1/chapters');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // 5. 搜索课程
  test('GET /api/courses/search?q=测试 → 搜索课程', async () => {
    Course.search.mockResolvedValue([
      { course_id: 1, course_name: '测试课程' }
    ]);

    const res = await request(app).get('/api/courses/search?q=测试');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});