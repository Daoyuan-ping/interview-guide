import request from './request';

export const getUserInfo = (userId: string | number) => {
    return request.get(`/api/user/info?userId=${userId}`);
};

export const uploadAvatar = (userId: string | number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post(`/api/user/avatar?userId=${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

export const updatePassword = (userId: string | number, oldPassword: string, newPassword: string) => {
    const formData = new FormData();
    formData.append('oldPassword', oldPassword);
    formData.append('newPassword', newPassword);
    return request.post(`/api/user/password?userId=${userId}`, formData);
};
export const updateProfile = (data: { userId: string | number, phone?: string, targetPosition?: string, bio?: string }) => {
    return request.post('/api/user/update', data);
};