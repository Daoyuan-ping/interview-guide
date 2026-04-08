import { request } from './request';

// 获取当前登录用户的方法
const getUserId = () => {
  try {
    const userStr = localStorage.getItem('ai_user');
    return userStr ? JSON.parse(userStr).userId : '';
  } catch (e) {
    return '';
  }
};

export type AnalyzeStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type EvaluateStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ResumeListItem { /*...原本属性...*/ }
export interface ResumeStats { /*...原本属性...*/ }
export interface AnalysisItem { /*...原本属性...*/ }
export interface InterviewItem { /*...原本属性...*/ }
export interface AnswerItem { /*...原本属性...*/ }
export interface ResumeDetail { /*...原本属性...*/ }
export interface InterviewDetail extends InterviewItem { /*...原本属性...*/ }

export const historyApi = {
  // 💡 以下请求全部动态追加 userId 作为安全查询参数

  async getResumes(): Promise<any> {
    return request.get(`/api/resumes?userId=${getUserId()}`);
  },

  async getResumeDetail(id: number): Promise<any> {
    return request.get(`/api/resumes/${id}/detail?userId=${getUserId()}`);
  },

  async getInterviewDetail(sessionId: string): Promise<any> {
    return request.get(`/api/interview/sessions/${sessionId}/details`);
  },

  async exportAnalysisPdf(resumeId: number): Promise<Blob> {
    const response = await request.getInstance().get(`/api/resumes/${resumeId}/export?userId=${getUserId()}`, {
      responseType: 'blob',
      skipResultTransform: true,
    } as never);
    return response.data;
  },

  async exportInterviewPdf(sessionId: string): Promise<Blob> {
    const response = await request.getInstance().get(`/api/interview/sessions/${sessionId}/export`, {
      responseType: 'blob',
      skipResultTransform: true,
    } as never);
    return response.data;
  },

  async deleteResume(id: number): Promise<void> {
    return request.delete(`/api/resumes/${id}?userId=${getUserId()}`);
  },

  async deleteInterview(sessionId: string): Promise<void> {
    return request.delete(`/api/interview/sessions/${sessionId}`);
  },

  async getStatistics(): Promise<any> {
    return request.get(`/api/resumes/statistics?userId=${getUserId()}`);
  },

  async reanalyze(id: number): Promise<void> {
    return request.post(`/api/resumes/${id}/reanalyze?userId=${getUserId()}`);
  },
};