// 💡 修改前：import axios from 'axios';
// 💡 修改后：导入你封装好的统一 request，它自带拦截器
import request from './request';

export interface AuthResponse {
    fullAvatarUrl: any;
    token: string;
    userId: number;
    username: string;
    role: string;
}

export interface CaptchaResponse {
    captchaKey: string;
    captchaBase64: string;
}

// ❌ 删掉下面这段原生 axios 创建代码
// const request = axios.create({ timeout: 10000 });

export const authApi = {
    login: async (data: any): Promise<AuthResponse> => {
        // ✅ request.post 内部已经解析了 .data，这里直接 return 即可
        return await request.post('/api/auth/login', data);
    },

    adminLogin: async (data: any): Promise<AuthResponse> => {
        return await request.post('/api/auth/admin-login', data);
    },

    register: async (data: any): Promise<AuthResponse> => {
        return await request.post('/api/auth/register', data);
    },

    getCaptcha: async (): Promise<CaptchaResponse> => {
        return await request.get('/api/verify/captcha');
    },

    sendEmailCode: async (data: { email: string, captchaKey: string, captchaCode: string }) => {
        return await request.post('/api/verify/send-email', data);
    },

    resetPassword: async (data: { email: string, emailCode: string, newPassword: string }) => {
        return await request.post('/api/auth/reset-password', data);
    }
};