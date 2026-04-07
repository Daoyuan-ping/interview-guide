import axios from 'axios';

export interface AuthResponse {
    token: string;
    userId: number;
    username: string;
    role: string;
}

export interface CaptchaResponse {
    captchaKey: string;
    captchaBase64: string;
}

// 推荐创建一个 axios 实例，这样你以后可以在这里统一配置 Token 拦截器
const request = axios.create({
    timeout: 10000,
});

export const authApi = {
    login: async (data: any): Promise<AuthResponse> => {
        const res = await request.post('/api/auth/login', data);
        return res.data; // 🚨 必须加上 .data 才能拿到后端真正返回的 JSON 对象
    },

    register: async (data: any): Promise<AuthResponse> => {
        const res = await request.post('/api/auth/register', data);
        return res.data; // 🚨 必须加上 .data
    },

    getCaptcha: async (): Promise<CaptchaResponse> => {
        const res = await request.get('/api/verify/captcha');
        return res.data; // 🚨 必须加上 .data
    },

    sendEmailCode: async (data: { email: string, captchaKey: string, captchaCode: string }) => {
        const res = await request.post('/api/verify/send-email', data);
        return res.data;
    }
};