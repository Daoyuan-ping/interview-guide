import request from './request';

// 获取本地存储的 adminId
const getAdminId = () => {
    const user = localStorage.getItem('ai_user');
    return user ? JSON.parse(user).userId : null;
};

export const adminApi = {
    // 💡 自动从本地拿 ID 拼接到 URL 后面
    getDashboardStats: () => {
        return request.get(`/api/admin/dashboard/stats?adminId=${getAdminId()}`);
    },

    getUserList: () => {
        return request.get(`/api/admin/users/list?adminId=${getAdminId()}`);
    },

    updateUserStatus: (userId: number | string, status: string) => {
        return request.post(`/api/admin/users/${userId}/status?adminId=${getAdminId()}&status=${status}`);
    },

    resetUserPassword: (userId: number | string, newPassword: string) => {
        return request.post(`/api/admin/users/${userId}/password?adminId=${getAdminId()}&newPassword=${newPassword}`);
    },

    updateUserRole: (userId: number | string, role: string) => {
        return request.post(`/api/admin/users/${userId}/role?adminId=${getAdminId()}&role=${role}`);
    }
};