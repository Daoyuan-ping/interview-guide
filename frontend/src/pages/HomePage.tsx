import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css'; // 引入上面创建的样式

export default function HomePage() {
    const navigate = useNavigate();
    const [normalText] = useState("用AI重新定义");
    const [highlightText] = useState("求职面试");
    const [typedNormal, setTypedNormal] = useState("");
    const [typedHighlight, setTypedHighlight] = useState("");

    // 打字机效果
    useEffect(() => {
        let nIdx = 0;
        let hIdx = 0;
        let timeoutId: number;

        const typeHighlight = () => {
            if (hIdx < highlightText.length) {
                setTypedHighlight(highlightText.substring(0, hIdx + 1));
                hIdx++;
                timeoutId = setTimeout(typeHighlight, 200) as unknown as number;
            }
        };

        const typeNormal = () => {
            if (nIdx < normalText.length) {
                setTypedNormal(normalText.substring(0, nIdx + 1));
                nIdx++;
                timeoutId = setTimeout(typeNormal, 200) as unknown as number;
            } else {
                typeHighlight();
            }
        };

        typeNormal();
        return () => clearTimeout(timeoutId);
    }, [normalText, highlightText]);

    // 滚动进入动画
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="landing-body">
            {/* 导航栏 */}
            <nav className="landing-nav">
                <div className="landing-logo">
                    <svg style={{ width: 24, height: 24 }} viewBox="0 0 32 32" fill="none">
                        <rect width="32" height="32" rx="8" fill="url(#gradient)"/>
                        <circle cx="16" cy="11" r="4" fill="white"/>
                        <path d="M9 23c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M24 6l0.5 1.5L26 8l-1.5 0.5L24 10l-0.5-1.5L22 8l1.5-0.5L24 6z" fill="#fbbf24"/>
                        <path d="M7 8l0.3 0.9L8 9.2l-0.7 0.3L7 10.4l-0.3-0.9L6 9.2l0.7-0.3L7 8z" fill="#fbbf24"/>
                        <defs>
                            <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
                                <stop offset="0%" stopColor="#6366f1"/>
                                <stop offset="100%" stopColor="#8b5cf6"/>
                            </linearGradient>
                        </defs>
                    </svg>
                    AI Interview
                </div>
                <ul className="landing-nav-links">
                    <li><a href="#home" onClick={(e) => handleScroll(e, 'home')}>首页</a></li>
                    <li><a href="#features" onClick={(e) => handleScroll(e, 'features')}>核心功能</a></li>
                    <li><a href="#tech" onClick={(e) => handleScroll(e, 'tech')}>技术栈</a></li>
                </ul>
                <button className="cta-btn" onClick={() => navigate('/login')}>立即体验</button>
            </nav>

            {/* 英雄区 */}
            <section className="hero-section" id="home">
                <div className="floating-shapes">
                    <div className="shape"></div><div className="shape"></div><div className="shape"></div><div className="shape"></div>
                </div>

                <div className="hero-content">
                    <h1>
                        {typedNormal}
                        <span className="highlight">{typedHighlight}</span>
                        <span className="typing-cursor"></span>
                    </h1>
                    <p>基于Qwen大模型的智能简历分析与AI面试官平台，为你提供个性化的求职准备方案，助力春招秋招。</p>

                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-number">98%</div>
                            <div className="stat-label">简历通过率提升</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">5000+</div>
                            <div className="stat-label">模拟面试次数</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="cta-btn" onClick={() => navigate('/login')}>
                            <i className="fas fa-upload"></i> 上传简历
                        </button>
                        <button className="secondary-btn" onClick={() => navigate('/login')}>
                            <i className="fas fa-play-circle"></i> 查看演示
                        </button>
                    </div>
                </div>

                <div className="hero-image">
                    <div style={{ perspective: 1000, position: 'relative' }}>
                        <div className="mockup-card">
                            <i className="fas fa-robot" style={{ fontSize: '4rem', marginBottom: '1rem' }}></i>
                            <div style={{ zIndex: 2, textAlign: 'center' }}>
                                AI面试模拟中
                                <div style={{ fontSize: '1rem', opacity: 0.9, marginTop: '0.5rem', fontWeight: 400 }}>
                                    <i className="fas fa-spinner fa-spin"></i> 正在生成个性化面试题...
                                </div>
                            </div>
                        </div>
                        <div className="floating-tag">
                            <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i> 简历分析完成
                        </div>
                        <div className="floating-tag">
                            <i className="fas fa-bolt" style={{ color: '#f59e0b' }}></i> 3秒生成报告
                        </div>
                        <div className="floating-tag">
                            <i className="fas fa-star" style={{ color: '#ec4899' }}></i> 智能评分
                        </div>
                    </div>
                </div>
            </section>

            {/* 功能区 */}
            <section className="features-section" id="features">
                <h2 className="section-title">核心功能</h2>
                <p className="section-subtitle">从简历解析到模拟面试，一站式AI求职解决方案</p>
                <div className="features-grid">
                    <div className="feature-card fade-in">
                        <div className="feature-icon"><i className="fas fa-file-alt"></i></div>
                        <h3>智能简历解析</h3>
                        <p>基于向量数据库，深度分析简历内容，提取关键技能与项目经验，生成专业评估报告。</p>
                    </div>
                    <div className="feature-card fade-in">
                        <div className="feature-icon"><i className="fas fa-comments"></i></div>
                        <h3>AI模拟面试</h3>
                        <p>接入大模型，根据目标岗位生成个性化面试题，实时语音交互，提供专业点评。</p>
                    </div>
                    <div className="feature-card fade-in">
                        <div className="feature-icon"><i className="fas fa-chart-line"></i></div>
                        <h3>能力提升建议</h3>
                        <p>结合大模型分析，生成针对性的学习路径与技能提升方案，。</p>
                    </div>
                </div>
            </section>

            {/* 技术栈区 */}
            <section className="tech-stack" id="tech">
                <h2 className="section-title">技术架构</h2>
                <p className="section-subtitle">基于主流技术栈构建，稳定高效</p>
                <div className="tech-grid">
                    <div className="tech-item fade-in"><i className="fab fa-java"></i><span>Java 21</span></div>
                    <div className="tech-item fade-in"><i className="fas fa-leaf"></i><span>Spring Boot 3</span></div>
                    <div className="tech-item fade-in"><i className="fas fa-database"></i><span>PostgreSQL</span></div>
                    <div className="tech-item fade-in"><i className="fas fa-vector-square"></i><span>PGVector</span></div>
                    <div className="tech-item fade-in"><i className="fas fa-brain"></i><span>AI 大模型</span></div>
                    <div className="tech-item fade-in"><i className="fab fa-react"></i><span>React & Vite</span></div>
                </div>
            </section>

            <footer style={{ background: 'var(--landing-dark)', color: '#94a3b8', padding: '3rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p>© 2026 AI Interview团队 | 计算机设计大赛参赛项目</p>
            </footer>
        </div>
    );
}