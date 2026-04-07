import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css'; // 复用同一份样式表

export default function LoginPage() {
    const navigate = useNavigate();

    const handleLogin = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        // 登录成功后直接跳到内部系统的上传页
        navigate('/upload');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className="landing-body login-layout">
            <div className="floating-shapes">
                <div className="shape"></div><div className="shape"></div><div className="shape"></div><div className="shape"></div>
            </div>

            <div className="brand-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem', zIndex: 2 }}>
                    <svg style={{ width: 48, height: 48 }} viewBox="0 0 32 32" fill="none">
                        <rect width="32" height="32" rx="8" fill="white"/>
                        <circle cx="16" cy="11" r="4" fill="url(#brandGradient)"/>
                        <path d="M9 23c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="url(#brandGradient)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                        <path d="M24 6l0.5 1.5L26 8l-1.5 0.5L24 10l-0.5-1.5L22 8l1.5-0.5L24 6z" fill="white"/>
                        <path d="M7 8l0.3 0.9L8 9.2l-0.7 0.3L7 10.4l-0.3-0.9L6 9.2l0.7-0.3L7 8z" fill="white"/>
                        <defs>
                            <linearGradient id="brandGradient" x1="0" y1="0" x2="32" y2="32">
                                <stop offset="0%" stopColor="#6366f1"/>
                                <stop offset="100%" stopColor="#8b5cf6"/>
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="brand-name">AI Interview</div>
                </div>
                <h1 className="brand-slogan">用AI重新定义求职面试</h1>
                <p style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', maxWidth: 500, lineHeight: 1.8, zIndex: 2 }}>
                    基于大模型的智能简历分析与AI面试官平台，为你提供个性化的求职准备方案。
                </p>
                <div className="brand-features">
                    <div className="brand-feature-item"><i className="fas fa-file-alt"></i> 智能简历解析</div>
                    <div className="brand-feature-item"><i className="fas fa-comments"></i> AI模拟面试</div>
                    <div className="brand-feature-item"><i className="fas fa-chart-line"></i> 能力提升建议</div>
                    <div className="brand-feature-item"><i className="fas fa-brain"></i> 大模型驱动</div>
                </div>
            </div>

            <div className="login-section">
                <div className="login-card">
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '2rem', color: 'var(--landing-text-dark)', marginBottom: '0.8rem' }}>欢迎回来</h2>
                        <p style={{ color: 'var(--landing-text-light)' }}>登录系统即可使用全部AI功能</p>
                    </div>

                    <form onSubmit={handleLogin} onKeyDown={handleKeyDown}>
                        <div className="form-group">
                            <label>账号</label>
                            <div className="input-wrapper">
                                <i className="fas fa-user"></i>
                                <input type="text" className="form-input" placeholder="请输入您的账号" required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>密码</label>
                            <div className="input-wrapper">
                                <i className="fas fa-lock"></i>
                                <input type="password" className="form-input" placeholder="请输入您的密码" required />
                            </div>
                        </div>

                        <div className="form-options">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" style={{ accentColor: 'var(--landing-primary)' }} /> 记住我
                            </label>
                            <a href="#" style={{ color: 'var(--landing-primary)', textDecoration: 'none', fontWeight: 500 }}>忘记密码？</a>
                        </div>

                        <button type="submit" className="login-btn">登 录</button>
                    </form>

                    <div style={{ textAlign: 'center' }}>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}
                           style={{ color: 'var(--landing-text-light)', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="fas fa-arrow-left"></i> 返回首页
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}