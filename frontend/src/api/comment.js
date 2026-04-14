// api/comment.js
import request from '@/utils/request';

export const getComments = (videoId, params = {}) =>
  request.get(`/comment/videos/${videoId}`, { params });

export const postComment = data =>
  request.post('/comment', data);

export const likeComment = commentId =>
  request.post(`/comment/${commentId}/like`);