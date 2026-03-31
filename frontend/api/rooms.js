import request from '@/utils/request'

export function getRoomDetail(roomId, currentUserId) {
  return request({
    url: `/community/rooms/${roomId}`,  // 去掉 /api
    method: 'get',
    params: { current_user_id: currentUserId }
  })
}

export function getRoomMembers(roomId) {
  return request({
    url: `/community/rooms/${roomId}/members`,  // 去掉 /api
    method: 'get'
  })
}

export function getRoomStats(roomId, currentUserId) {
  return request({
    url: `/community/rooms/${roomId}/stats`,  // 去掉 /api
    method: 'get',
    params: { current_user_id: currentUserId }
  })
}

// 获取自习室任务统计
export function getRoomTaskStatistics(roomId, userId) {
  return request({
    url: `/community/rooms/${roomId}/task-statistics`,
    method: 'get',
    params: { user_id: userId }
  })
}

// 更新任务完成时间
export function updateTaskCompletionTime(taskId, data) {
  return request({
    url: `/community/rooms/tasks/${taskId}/completion-time`,
    method: 'patch',
    data
  })
}

// 快速完成任务（30分钟）
export function quickCompleteTask(taskId, data) {
  return request({
    url: `/community/rooms/tasks/${taskId}/quick-complete`,
    method: 'post',
    data
  })
}

// 更新任务完成状态（用于打勾切换）
export function updateTaskCompletionStatus(taskId, data) {
  return request({
    url: `/community/rooms/tasks/${taskId}/completion-status`,
    method: 'patch',
    data
  })
}

export function getRoomTasks(roomId, params) {
  return request({
    url: `/community/rooms/${roomId}/tasks`,  // 去掉 /api
    method: 'get',
    params
  })
}

export function getRoomLeaderboard(roomId) {
  return request({
    url: `/community/rooms/${roomId}/leaderboard`,  // 去掉 /api
    method: 'get'
  })
}

export function joinRoom(roomId, userId) {
  return request({
    url: `/community/rooms/${roomId}/join`,  // 去掉 /api
    method: 'post',
    data: { user_id: userId }
  })
}

export function leaveRoom(roomId, userId) {
  return request({
    url: `/community/rooms/${roomId}/leave`,  // 去掉 /api
    method: 'delete',
    data: { user_id: userId }
  })
}

export function getRoomMessages(roomId) {
  return request({
    url: `/community/rooms/${roomId}/messages`,  // 去掉 /api
    method: 'get'
  })
}

export function createRoomMessage(roomId, data) {
  return request({
    url: `/community/rooms/${roomId}/messages`,  // 改为一致，去掉 /api
    method: 'post',
    data
  })
}

export function getUserStudyTasks(roomId, userId, range = 'today') {
  return request({
    url: `/community/rooms/${roomId}/tasks/user`,  // 去掉 /api
    method: 'get',
    params: { user_id: userId, range }
  })
}

export function updateStudyTaskStatus(taskId, status, userId) {
  return request({
    url: `/community/rooms/tasks/${taskId}/status`,  // 去掉 /api
    method: 'patch',
    data: { status, user_id: userId }
  })
}

export function getStudyStats(roomId, userId) {
  return request({
    url: `/community/rooms/${roomId}/stats`,  // 去掉 /api
    method: 'get',
    params: { current_user_id: userId }
  })
}

export function getTaskHistory(roomId, userId) {
  return request({
    url: `/community/rooms/${roomId}/task-history`,  // 去掉 /api
    method: 'get',
    params: { user_id: userId }
  })
}

export function createStudyTask(roomId, data) {
  return request({
    url: `/community/rooms/${roomId}/tasks`,  // 去掉 /api
    method: 'post',
    data
  })
}

export function setRoomAdmin(roomId, data) {
  return request({
    url: `/community/rooms/${roomId}/admins`,  // 去掉 /api
    method: 'post',
    data
  })
}

export function updateRoomRules(roomId, data) {
  return request({
    url: `/community/rooms/${roomId}/rules`,  // 去掉 /api
    method: 'put',
    data
  })
}

export function uploadRoomAvatar(roomId, file, userId) {
  const formData = new FormData()
  formData.append('avatar', file)
  if (userId) {
    formData.append('user_id', userId)
  }
  return request({
    url: `/community/rooms/${roomId}/avatar`,  // 去掉 /api
    method: 'post',
    data: formData
  })
}