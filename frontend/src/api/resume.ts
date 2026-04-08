import { request } from './request';
import type { UploadResponse } from '../types/resume';

export const resumeApi = {
  /**
   * 上传简历并获取分析结果 (附带用户ID以实现数据隔离)
   */
  async uploadAndAnalyze(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // 💡 获取当前登录用户ID
    const userStr = localStorage.getItem('ai_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.userId) {
          formData.append('userId', String(user.userId));
        }
      } catch (e) {
        console.error('解析用户数据失败', e);
      }
    }

    return request.upload<UploadResponse>('/api/resumes/upload', formData);
  },

  async healthCheck(): Promise<{ status: string; service: string }> {
    return request.get('/api/resumes/health');
  },
};