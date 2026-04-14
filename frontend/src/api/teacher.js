// 教师API接口
const API_BASE = 'http://localhost:4000';

// 获取教师统计数据
export const apiTeacherStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/teacher/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch (error) {
    console.error('获取教师统计失败:', error);
    return { success: false, data: {} };
  }
};


// 获取教师课程列表
export const apiTeacherCourses = async (status = '') => {
  try {
    const token = localStorage.getItem('token');
    const url = status ? `${API_BASE}/api/teacher/courses?status=${status}` : `${API_BASE}/api/teacher/courses`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch (error) {
    console.error('获取教师课程失败:', error);
    return { success: false, data: [] };
  }
};


// 获取课程学生列表
export const apiTeacherStudents = async (courseId) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/teacher/courses/${courseId}/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch (error) {
    console.error('获取课程学生失败:', error);
    return { success: false, data: [] };
  }
};

// 创建新课程
export const apiCreateCourse = async (courseData) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/teacher/courses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(courseData)
    });
    return await res.json();
  } catch (error) {
    console.error('创建课程失败:', error);
    return { success: false, message: '创建失败' };
  }
};

// 更新课程
export const apiUpdateCourse = async (courseId, courseData) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/teacher/courses/${courseId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(courseData)
    });
    return await res.json();
  } catch (error) {
    console.error('更新课程失败:', error);
    return { success: false, message: '更新失败' };
  }
};

// 删除课程
export const apiDeleteCourse = async (courseId) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/teacher/courses/${courseId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch (error) {
    console.error('删除课程失败:', error);
    return { success: false, message: '删除失败' };
  }
};

// 获取学生知识掌握分布数据（环状图）
export const apiMasteryDistribution = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/teacher/analytics/mastery-distribution`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch (error) {
    console.error('获取知识掌握分布失败:', error);
    return { success: false, data: [] };
  }
};

// 获取知识点词云数据
export const apiKnowledgeWordCloud = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/teacher/analytics/knowledge-wordcloud`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch (error) {
    console.error('获取词云数据失败:', error);
    return { success: false, data: [] };
  }
};

// 获取学习趋势数据
export const apiLearningTrend = async (type = 'overall', courseId = null) => {
  try {
    const token = localStorage.getItem('token');
    
    // 构建查询参数
    let url = `${API_BASE}/api/teacher/analytics/learning-trend?type=${type}`;
    if (courseId) {
      url += `&course_id=${courseId}`;
    }
    
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch (error) {
    console.error('获取学习趋势数据失败:', error);
    return { success: false, data: {} };
  }
};

// 获取趋势概览
export const apiTrendOverview = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/teacher/analytics/trend-overview`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await res.json();
    console.log('📈 趋势概览响应:', data);
    
    return data;
  } catch (error) {
    console.error('获取趋势概览失败:', error);
    return { success: false, data: {} };
  }
};
