const { execute } = require('../../config/database');

class RoomMember {
    // 加入自习室
    static async joinRoom(roomId, userId) {
        const [result] = await execute(
            'INSERT INTO room_member (room_id, user_id) VALUES (?, ?)',
            [roomId, userId]
        );
        return result.insertId;
    }

    // 离开自习室
    static async leaveRoom(roomId, userId) {
        const [result] = await execute(
            'UPDATE room_member SET leave_time = NOW() WHERE room_id = ? AND user_id = ? AND leave_time IS NULL',
            [roomId, userId]
        );
        return result.affectedRows > 0;
    }

    // 获取自习室成员
    static async getRoomMembers(roomId) {
        const [rows] = await execute(`
            SELECT rm.*, u.user_name, u.avatar_url
            FROM room_member rm
            LEFT JOIN user u ON rm.user_id = u.user_id
            WHERE rm.room_id = ? AND rm.leave_time IS NULL
            ORDER BY rm.join_time
        `, [roomId]);
        return rows;
    }
}

module.exports = RoomMember;