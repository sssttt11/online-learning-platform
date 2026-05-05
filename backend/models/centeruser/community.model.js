import { pool } from '../config/database.js';

class CommunityModel {
  // ========== 学习组队相关 ==========
  
  // 获取所有组队列表
  static async findAllTeams() {
    const [rows] = await pool.query(
      `SELECT 
        st.team_id,
        st.team_name,
        st.description,
        st.created_by_user_id,
        u.user_name as creator_name,
        (SELECT COUNT(*) FROM t_team_member WHERE team_id = st.team_id) as member_count,
        (SELECT COUNT(*) FROM t_team_task WHERE team_id = st.team_id AND is_completed = 0) as pending_tasks
      FROM t_study_team st
      LEFT JOIN t_user u ON st.created_by_user_id = u.user_id
      ORDER BY st.team_id DESC`
    );
    return rows;
  }

  // 获取用户参与的组队
  static async findUserTeams(userId) {
    const [rows] = await pool.query(
      `SELECT 
        st.team_id,
        st.team_name,
        st.description,
        st.created_by_user_id,
        u.user_name as creator_name,
        tm.join_time,
        (SELECT COUNT(*) FROM t_team_member WHERE team_id = st.team_id) as member_count
      FROM t_team_member tm
      JOIN t_study_team st ON tm.team_id = st.team_id
      LEFT JOIN t_user u ON st.created_by_user_id = u.user_id
      WHERE tm.user_id = ?
      ORDER BY tm.join_time DESC`,
      [userId]
    );
    return rows;
  }

  // 获取组队详情（包含成员和任务）
  static async findTeamById(teamId) {
    const [team] = await pool.query(
      `SELECT 
        st.*,
        u.user_name as creator_name
      FROM t_study_team st
      LEFT JOIN t_user u ON st.created_by_user_id = u.user_id
      WHERE st.team_id = ?`,
      [teamId]
    );

    if (team.length === 0) return null;

    // 获取成员列表
    const [members] = await pool.query(
      `SELECT 
        tm.user_id,
        u.user_name,
        u.avatar,
        tm.join_time
      FROM t_team_member tm
      JOIN t_user u ON tm.user_id = u.user_id
      WHERE tm.team_id = ?
      ORDER BY tm.join_time`,
      [teamId]
    );

    // 获取任务列表
    const [tasks] = await pool.query(
      `SELECT 
        tt.*,
        u.user_name as assigned_user_name,
        u2.user_name as confirmer_name
      FROM t_team_task tt
      LEFT JOIN t_user u ON tt.assigned_user_id = u.user_id
      LEFT JOIN t_user u2 ON tt.confirmed_by_partner_id = u2.user_id
      WHERE tt.team_id = ?
      ORDER BY tt.is_completed ASC, tt.due_date ASC`,
      [teamId]
    );

    return {
      ...team[0],
      members,
      tasks
    };
  }

  // ========== 自习室相关 ==========
  
  // 获取所有自习室列表
  static async findAllRooms() {
    const [rows] = await pool.query(
      `SELECT 
        sr.room_id,
        sr.room_name,
        sr.description,
        sr.rules,
        (SELECT COUNT(*) FROM t_room_member WHERE room_id = sr.room_id) as total_members,
        (SELECT COUNT(*) FROM t_room_member WHERE room_id = sr.room_id AND is_online = 1) as online_members
      FROM t_study_room sr
      ORDER BY online_members DESC, total_members DESC`
    );
    return rows;
  }

  // 获取用户加入的自习室
  static async findUserRooms(userId) {
    const [rows] = await pool.query(
      `SELECT 
        sr.room_id,
        sr.room_name,
        sr.description,
        rm.is_online,
        (SELECT COUNT(*) FROM t_room_member WHERE room_id = sr.room_id) as total_members,
        (SELECT COUNT(*) FROM t_room_member WHERE room_id = sr.room_id AND is_online = 1) as online_members
      FROM t_room_member rm
      JOIN t_study_room sr ON rm.room_id = sr.room_id
      WHERE rm.user_id = ?
      ORDER BY sr.room_id`,
      [userId]
    );
    return rows;
  }

  // 获取自习室详情
  static async findRoomById(roomId) {
    const [room] = await pool.query(
      'SELECT * FROM t_study_room WHERE room_id = ?',
      [roomId]
    );

    if (room.length === 0) return null;

    // 获取成员列表
    const [members] = await pool.query(
      `SELECT 
        rm.user_id,
        u.user_name,
        u.avatar,
        rm.is_online
      FROM t_room_member rm
      JOIN t_user u ON rm.user_id = u.user_id
      WHERE rm.room_id = ?
      ORDER BY rm.is_online DESC, u.user_name`,
      [roomId]
    );

    // 获取留言列表（最近50条）
    const [comments] = await pool.query(
      `SELECT 
        rc.comment_id,
        rc.user_id,
        u.user_name,
        u.avatar,
        rc.comment_content,
        rc.create_time
      FROM t_room_comment rc
      JOIN t_user u ON rc.user_id = u.user_id
      WHERE rc.room_id = ?
      ORDER BY rc.create_time DESC
      LIMIT 50`,
      [roomId]
    );

    return {
      ...room[0],
      members,
      recent_comments: comments,
      stats: {
        total_members: members.length,
        online_members: members.filter(m => m.is_online === 1).length,
        comments_count: comments.length
      }
    };
  }

  // 加入自习室
  static async joinRoom(userId, roomId) {
    try {
      await pool.query(
        'INSERT INTO t_room_member (user_id, room_id, is_online) VALUES (?, ?, 1)',
        [userId, roomId]
      );
      return true;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('已经加入该自习室');
      }
      throw error;
    }
  }

  // 离开自习室
  static async leaveRoom(userId, roomId) {
    const [result] = await pool.query(
      'DELETE FROM t_room_member WHERE user_id = ? AND room_id = ?',
      [userId, roomId]
    );
    return result.affectedRows > 0;
  }

  // 更新在线状态
  static async updateOnlineStatus(userId, roomId, isOnline) {
    const [result] = await pool.query(
      'UPDATE t_room_member SET is_online = ? WHERE user_id = ? AND room_id = ?',
      [isOnline ? 1 : 0, userId, roomId]
    );
    return result.affectedRows > 0;
  }

  // 加入组队
  static async joinTeam(userId, teamId) {
    try {
      await pool.query(
        'INSERT INTO t_team_member (user_id, team_id) VALUES (?, ?)',
        [userId, teamId]
      );
      return true;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('已经加入该组队');
      }
      throw error;
    }
  }

  // 离开组队
  static async leaveTeam(userId, teamId) {
    const [result] = await pool.query(
      'DELETE FROM t_team_member WHERE user_id = ? AND team_id = ?',
      [userId, teamId]
    );
    return result.affectedRows > 0;
  }

  // 发表自习室留言
  static async addRoomComment(userId, roomId, content) {
    const [result] = await pool.query(
      'INSERT INTO t_room_comment (user_id, room_id, comment_content) VALUES (?, ?, ?)',
      [userId, roomId, content]
    );
    return result.insertId;
  }

  // 删除留言
  static async deleteRoomComment(commentId, userId) {
    const [result] = await pool.query(
      'DELETE FROM t_room_comment WHERE comment_id = ? AND user_id = ?',
      [commentId, userId]
    );
    return result.affectedRows > 0;
  }
}

export default CommunityModel;