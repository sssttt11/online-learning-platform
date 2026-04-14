import request from '@/utils/request'

// 获取小组详情（含成员）
export function getTeamDetail(teamId, currentUserId) {
  return request({
    url: `/community/teams/${teamId}`,  // ❌ 移除 /api
    method: 'get',
    params: { current_user_id: currentUserId }
  })
}

// 获取小组今日学习数据
export function getTeamDailyStudyData(teamId) {
  return request({
    url: `/community/teams/${teamId}/daily-study`,  // ❌ 移除 /api
    method: 'get'
  })
}

// 获取用户今日学习详情
export function getUserDailyStudyDetail(teamId, userId) {
  return request({
    url: `/community/teams/${teamId}/users/${userId}/daily-study`,  // ❌ 移除 /api
    method: 'get'
  })
}

// 获取小组成员
export function getTeamMembers(teamId) {
  return request({
    url: `/community/teams/${teamId}`,  // ❌ 移除 /api
    method: 'get'
  })
}

// 最简单方案：使用已存在的路由，而不是任务路由
export function getTeamTasks(teamId) {
  return request({
    url: `/community/teams/${teamId}/task-completion`,  // ✅ 使用已存在的路由
    method: 'get'
  })
}

// 创建小组任务
export function createTeamTask(teamId, data) {
  return request({
    url: `/community/tasks/teams/${teamId}/tasks`,  // 改为 /community/tasks/teams/
    method: 'post',
    data
  })
}

// 获取小组任务完成数据
export function getTeamTaskCompletionData(teamId) {
  return request({
    url: `/community/teams/${teamId}/task-completion`,  // ❌ 移除 /api
    method: 'get'
  })
}

// 获取团队任务统计
export function getTeamTasksStatistics(teamId) {
  return request({
    url: `/community/teams/${teamId}/tasks-statistics`,  // ❌ 移除 /api
    method: 'get'
  })
}

// 更新任务完成状态
export function updateTaskCompletionStatus(taskId, data) {
  return request({
    url: `/community/tasks/tasks/${taskId}/completion-status`,  // ❌ 移除 /api
    method: 'patch',
    data
  })
}

// 快速完成任务
export function quickCompleteTask(taskId, data) {
  return request({
    url: `/community/tasks/tasks/${taskId}/quick-complete`,  // ❌ 移除 /api
    method: 'post',
    data
  })
}

// 更新小组任务信息
export function updateTeamTask(taskId, data) {
  return request({
    url: `/community/tasks/${taskId}`,  // ❌ 移除 /api
    method: 'put',
    data
  })
}

// 删除小组任务
export function deleteTeamTask(taskId) {
  return request({
    url: `/community/tasks/${taskId}`,  // ❌ 移除 /api
    method: 'delete'
  })
}

// 更新任务状态
export function updateTeamTaskStatus(taskId, status) {
  return request({
    url: `/community/tasks/${taskId}/status`,  // ❌ 移除 /api
    method: 'patch',
    data: { status }
  })
}

// 获取小组留言
export function getTeamComments(teamId) {
  return request({
    url: `/community/teams/${teamId}/comments`,  // ❌ 移除 /api
    method: 'get'
  })
}

// 创建小组留言
export function createTeamComment(teamId, data) {
  return request({
    url: `/community/teams/${teamId}/comments`,  // ❌ 移除 /api
    method: 'post',
    data
  })
}

// 加入小组
export function joinTeam(teamId, userId) {
  return request({
    url: `/community/teams/${teamId}/join`,  // ❌ 移除 /api
    method: 'post',
    data: { user_id: userId }
  })
}

// 退出小组
export function leaveTeam(teamId, userId) {
  return request({
    url: `/community/teams/${teamId}/leave`,  // ❌ 移除 /api
    method: 'delete',
    data: { user_id: userId }
  })
}

// 加入请求相关
export function getJoinRequests(teamId) {
  return request({
    url: `/community/teams/${teamId}/join-requests`,  // ❌ 移除 /api
    method: 'get'
  })
}

export function approveJoinRequest(requestId) {
  return request({
    url: `/community/teams/join-requests/${requestId}/approve`,  // ❌ 移除 /api
    method: 'post'
  })
}

export function rejectJoinRequest(requestId) {
  return request({
    url: `/community/teams/join-requests/${requestId}/reject`,  // ❌ 移除 /api
    method: 'post'
  })
}