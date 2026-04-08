import React, {useState, useEffect, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {authApi} from '../api/auth';
import './Landing.css';

export default function LoginPage() {
    const navigate = useNavigate();

    // 模式切换：登录、注册、忘记密码
    const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
    const isRegister = authMode === 'register';
    const isForgot = authMode === 'forgot';

    // 表单状态
    const [formData, setFormData] = useState({
        username: '', password: '', confirmPassword: '',
        email: '', emailCode: '', captchaCode: ''
    });

    // 字段级错误状态（红字提示）
    const [fieldErrors, setFieldErrors] = useState({
        username: '', password: '', confirmPassword: '',
        email: '', emailCode: '', captchaCode: ''
    });

    // 验证码与全局状态
    const [captchaImg, setCaptchaImg] = useState('');
    const [captchaKey, setCaptchaKey] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');

    const fetchCaptcha = useCallback(async () => {
        try {
            const res = await authApi.getCaptcha();
            setCaptchaImg(res.captchaBase64);
            setCaptchaKey(res.captchaKey);
        } catch (err) {
            console.error("获取验证码失败", err);
        }
    }, []);

    useEffect(() => {
        setGlobalError('');
        setFieldErrors({username: '', password: '', confirmPassword: '', email: '', emailCode: '', captchaCode: ''});
        // 注册和忘记密码都需要图形验证码
        if (isRegister || isForgot) fetchCaptcha();
    }, [authMode, fetchCaptcha]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // 核心校验逻辑
    const validateField = (name: string, value: string) => {
        switch (name) {
            case 'username':
                if (!value && !isForgot) return '请输入账号';
                if (isRegister && !/^[a-zA-Z0-9_-]{4,16}$/.test(value)) return '需为 4-16 位字母/数字/下划线';
                break;
            case 'email':
                if (!value && (isRegister || isForgot)) return '请输入邮箱';
                if ((isRegister || isForgot) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '请输入正确的邮箱格式';
                break;
            case 'password':
                if (!value) return isForgot ? '请输入新密码' : '请输入密码';
                if (isRegister || isForgot) {
                    if (value.length < 8 || value.length > 18) return '密码长度需为 8-18 位';
                    let types = 0;
                    if (/[a-zA-Z]/.test(value)) types++;
                    if (/[0-9]/.test(value)) types++;
                    if (/[^a-zA-Z0-9\s]/.test(value)) types++;
                    if (types < 2) return '需包含数字/字母/符号中至少两种';
                }
                break;
            case 'confirmPassword':
                if ((isRegister || isForgot) && value !== formData.password) return '两次输入的密码不一致';
                break;
            case 'captchaCode':
                if ((isRegister || isForgot) && !value) return '请输入图形验证码';
                break;
            case 'emailCode':
                if ((isRegister || isForgot) && !value) return '请输入邮箱验证码';
                break;
        }
        return '';
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        const error = validateField(name, value);
        setFieldErrors(prev => ({...prev, [name]: error}));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        setGlobalError('');

        if (fieldErrors[name as keyof typeof fieldErrors]) {
            const error = validateField(name, value);
            setFieldErrors(prev => ({...prev, [name]: error}));
        }

        if (name === 'password' && fieldErrors.confirmPassword) {
            if (value === formData.confirmPassword) setFieldErrors(prev => ({...prev, confirmPassword: ''}));
        }
    };

    const handleSendEmailCode = async () => {
        const emailErr = validateField('email', formData.email);
        const captchaErr = validateField('captchaCode', formData.captchaCode);

        if (emailErr || captchaErr) {
            setFieldErrors(prev => ({...prev, email: emailErr, captchaCode: captchaErr}));
            return;
        }

        try {
            await authApi.sendEmailCode({email: formData.email, captchaKey, captchaCode: formData.captchaCode});
            setCountdown(60);
            setGlobalError('');
            alert("验证码已发送至您的邮箱，请查收！");
        } catch (err: any) {
            const errMsg = err.response?.data?.message || err.message || '发送失败';
            setFieldErrors(prev => ({...prev, captchaCode: errMsg}));
            fetchCaptcha();
            setFormData(prev => ({...prev, captchaCode: ''}));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let hasError = false;
        const newFieldErrors = {...fieldErrors};

        // 根据不同模式决定需要校验的字段
        let fieldsToCheck: string[] = [];
        if (authMode === 'login') fieldsToCheck = ['username', 'password'];
        if (authMode === 'register') fieldsToCheck = ['username', 'email', 'captchaCode', 'emailCode', 'password', 'confirmPassword'];
        if (authMode === 'forgot') fieldsToCheck = ['email', 'captchaCode', 'emailCode', 'password', 'confirmPassword'];

        fieldsToCheck.forEach(field => {
            const error = validateField(field, formData[field as keyof typeof formData]);
            newFieldErrors[field as keyof typeof fieldErrors] = error;
            if (error) hasError = true;
        });

        if (hasError) {
            setFieldErrors(newFieldErrors);
            return;
        }

        setLoading(true);
        setGlobalError('');

        try {
            if (authMode === 'register') {
                const res = await authApi.register({...formData, captchaKey});
                localStorage.setItem('ai_token', res.token);
                localStorage.setItem('ai_user', JSON.stringify({
                    userId: res.userId,
                    username: res.username,
                    role: res.role,
                    avatarUrl: res.fullAvatarUrl
                }));
                alert('注册成功，自动登录进入系统！');
                navigate('/upload');
            } else if (authMode === 'forgot') {
                await authApi.resetPassword({
                    email: formData.email,
                    emailCode: formData.emailCode,
                    newPassword: formData.password
                });
                alert('密码重置成功，请使用新密码重新登录！');
                setAuthMode('login'); // 找回密码成功后返回登录页
            } else {
                const res = await authApi.login({username: formData.username, password: formData.password});
                localStorage.setItem('ai_token', res.token);
                localStorage.setItem('ai_user', JSON.stringify({
                    userId: res.userId,
                    username: res.username,
                    role: res.role,
                    avatarUrl: res.fullAvatarUrl
                }));
                // 💡 智能路由逻辑：根据后端返回的角色决定去哪
                if (res.role === 'ADMIN') {
                    navigate('/admin'); // 管理员直接进入控制台大屏
                } else {
                    navigate('/upload'); // 普通用户进入前台
                }
            }
        } catch (err: any) {
            setGlobalError(err.response?.data?.message || err.message || '操作失败，请重试');
            if (isRegister || isForgot) {
                fetchCaptcha();
                setFormData(prev => ({...prev, captchaCode: ''}));
            }
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (name: string, label: string, icon: string, type: string, placeholder: string, extraElement?: React.ReactNode) => {
        const error = fieldErrors[name as keyof typeof fieldErrors];
        return (
            <div className="form-group"
                 style={{marginBottom: error ? '1.8rem' : '1.2rem', transition: 'margin 0.3s ease'}}>
                <label style={{
                    fontSize: '0.9rem',
                    color: '#475569',
                    fontWeight: 600,
                    marginBottom: '0.4rem',
                    display: 'block'
                }}>{label}</label>
                <div style={{display: 'flex', gap: '10px', alignItems: 'flex-start'}}>
                    <div style={{position: 'relative', flex: 1}}>
                        <i className={icon} style={{
                            position: 'absolute',
                            left: '1rem',
                            top: '12px',
                            color: '#94a3b8',
                            transition: 'color 0.3s'
                        }}></i>
                        <input
                            type={type} name={name} value={formData[name as keyof typeof formData]}
                            onChange={handleInputChange} onBlur={handleBlur}
                            className="form-input custom-input" placeholder={placeholder}
                            style={{
                                borderColor: '#e2e8f0',
                                backgroundColor: '#f8fafc',
                                padding: '0.65rem 1rem 0.65rem 2.6rem',
                                borderRadius: '10px',
                                width: '100%',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                fontSize: '0.95rem'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: '0.2rem',
                            marginTop: '4px',
                            color: '#ef4444',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: error ? 1 : 0,
                            transform: error ? 'translateY(0)' : 'translateY(-5px)',
                            pointerEvents: 'none',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            whiteSpace: 'nowrap'
                        }}>
                            {error && <><i className="fas fa-exclamation-circle"></i>{error}</>}
                        </div>
                    </div>
                    {extraElement && <div style={{flexShrink: 0}}>{extraElement}</div>}
                </div>
            </div>
        );
    };

    return (
        <div className="landing-body login-layout" style={{height: '100vh', overflow: 'hidden', display: 'flex'}}>
            <style>{`
                .custom-input:focus { border-color: var(--landing-primary) !important; background-color: white !important; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important; }
                .login-card-modern { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); }
                .brand-section-left { position: relative; flex: 1; background: linear-gradient(135deg, var(--landing-primary), var(--landing-secondary)); display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 4rem; overflow: hidden; z-index: 1; }
                .brand-section-left::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%); animation: rotateBg 30s linear infinite; pointer-events: none; }
                @keyframes rotateBg { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .brand-features-grid { margin-top: 4rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; z-index: 2; width: 100%; max-width: 500px; }
                .brand-feature-item { display: flex; align-items: center; gap: 0.8rem; color: white; font-weight: 500; font-size: 1.05rem; }
                .brand-feature-item i { width: 32px; height: 32px; background: rgba(255, 255, 255, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
            `}</style>

            <div className="floating-shapes">
                <div className="shape"></div>
                <div className="shape"></div>
                <div className="shape"></div>
                <div className="shape"></div>
            </div>

            <div className="brand-section-left">
                {/* 品牌区代码保持不变 */}
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem', zIndex: 2}}>
                    <svg style={{width: '48px', height: '48px', flexShrink: 0}} xmlns="http://www.w3.org/2000/svg"
                         viewBox="0 0 32 32" fill="none">
                        <rect width="32" height="32" rx="8" fill="white"/>
                        <circle cx="16" cy="11" r="4" fill="url(#brandGradient)"/>
                        <path d="M9 23c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="url(#brandGradient)" strokeWidth="2.5"
                              strokeLinecap="round" fill="none"/>
                        <path d="M24 6l0.5 1.5L26 8l-1.5 0.5L24 10l-0.5-1.5L22 8l1.5-0.5L24 6z" fill="white"/>
                        <path d="M7 8l0.3 0.9L8 9.2l-0.7 0.3L7 10.4l-0.3-0.9L6 9.2l0.7-0.3L7 8z" fill="white"/>
                        <defs>
                            <linearGradient id="brandGradient" x1="0" y1="0" x2="32" y2="32">
                                <stop offset="0%" stopColor="#6366f1"/>
                                <stop offset="100%" stopColor="#8b5cf6"/>
                            </linearGradient>
                        </defs>
                    </svg>
                    <div style={{fontSize: '2.5rem', fontWeight: 700, color: 'white'}}>AI Interview</div>
                </div>
                <h1 style={{
                    fontSize: '1.8rem',
                    fontWeight: 600,
                    color: 'white',
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    zIndex: 2,
                    lineHeight: 1.4
                }}>用AI重新定义求职面试</h1>
                <p style={{
                    fontSize: '1.1rem',
                    color: 'rgba(255, 255, 255, 0.85)',
                    textAlign: 'center',
                    maxWidth: '500px',
                    lineHeight: 1.8,
                    zIndex: 2
                }}>基于Qwen大模型的智能简历分析与AI面试官平台，为你提供个性化的求职准备方案，助力计算机设计大赛与春招秋招。</p>
                <div className="brand-features-grid">
                    <div className="brand-feature-item"><i className="fas fa-file-alt"></i> <span>智能简历解析</span>
                    </div>
                    <div className="brand-feature-item"><i className="fas fa-comments"></i> <span>AI模拟面试</span>
                    </div>
                    <div className="brand-feature-item"><i className="fas fa-chart-line"></i> <span>能力提升建议</span>
                    </div>
                    <div className="brand-feature-item"><i className="fas fa-brain"></i> <span>大模型驱动</span></div>
                </div>
            </div>

            <div className="login-section"
                 style={{flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem'}}>
                <div className="login-card login-card-modern" style={{
                    width: '100%',
                    maxWidth: (isRegister || isForgot) ? '780px' : '420px',
                    padding: '2.5rem 3rem', borderRadius: '24px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                    transition: 'max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    <div style={{textAlign: 'center', marginBottom: '1.5rem'}}>
                        <h2 style={{
                            fontSize: '1.8rem',
                            color: 'var(--landing-text-dark)',
                            marginBottom: '0.4rem',
                            fontWeight: 700
                        }}>
                            {authMode === 'login' && '欢迎回来'}
                            {authMode === 'register' && '注册专属账号'}
                            {authMode === 'forgot' && '找回密码'}
                        </h2>
                        <p style={{color: '#64748b', fontSize: '0.9rem'}}>
                            {authMode === 'login' && '登录系统即可使用全部 AI 功能'}
                            {authMode === 'register' && '只需简单几步，即可开启你的 AI 面试之旅'}
                            {authMode === 'forgot' && '验证邮箱后，即可重置您的账号密码'}
                        </p>
                    </div>

                    {globalError && (
                        <div style={{
                            padding: '0.6rem',
                            background: '#fee2e2',
                            color: '#ef4444',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <i className="fas fa-exclamation-circle"></i> {globalError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: (isRegister || isForgot) ? '1fr 1fr' : '1fr',
                            columnGap: '2.5rem'
                        }}>
                            {/* 左侧：账号/邮箱及密码 */}
                            <div>
                                {authMode !== 'forgot' && renderInput('username', '系统账号', 'fas fa-user', 'text', '请输入账号')}
                                {authMode === 'forgot' && renderInput('email', '绑定邮箱', 'fas fa-envelope', 'email', '请输入绑定的邮箱')}

                                {renderInput('password', isForgot ? '新密码' : '登录密码', 'fas fa-lock', 'password', isForgot ? '请输入新密码' : '请输入密码')}
                                {(isRegister || isForgot) && renderInput('confirmPassword', '确认密码', 'fas fa-check-circle', 'password', '请再次确认密码')}
                            </div>

                            {/* 右侧：验证安全列（仅注册和忘记密码显示） */}
                            {(isRegister || isForgot) && (
                                <div>
                                    {authMode === 'register' && renderInput('email', '安全邮箱', 'fas fa-envelope', 'email', '请输入邮箱')}
                                    {renderInput('captchaCode', '图形验证', 'fas fa-shield-alt', 'text', '右侧验证码',
                                        captchaImg ? (
                                            <img src={captchaImg} alt="验证码" onClick={fetchCaptcha}
                                                 style={{
                                                     height: '42px',
                                                     width: '120px',
                                                     borderRadius: '8px',
                                                     cursor: 'pointer',
                                                     border: '1px solid #e2e8f0',
                                                     objectFit: 'contain',
                                                     background: '#fff'
                                                 }}
                                                 title="点击刷新验证码"/>
                                        ) : (
                                            <div style={{
                                                height: '42px',
                                                width: '120px',
                                                background: '#f1f5f9',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <i className="fas fa-spinner fa-spin text-slate-400"></i>
                                            </div>
                                        )
                                    )}
                                    {renderInput('emailCode', '邮箱验证', 'fas fa-key', 'text', '6位验证码',
                                        <button type="button" onClick={handleSendEmailCode} disabled={countdown > 0}
                                                style={{
                                                    height: '42px',
                                                    width: '120px',
                                                    background: countdown > 0 ? '#e2e8f0' : 'var(--landing-primary)',
                                                    color: countdown > 0 ? '#64748b' : 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontWeight: 600,
                                                    cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.3s',
                                                    fontSize: '0.85rem'
                                                }}>
                                            {countdown > 0 ? `${countdown}s` : '获取验证码'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {authMode === 'login' && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1.5rem',
                                marginTop: '-0.2rem'
                            }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    color: '#475569',
                                    fontSize: '0.85rem'
                                }}>
                                    <input type="checkbox" style={{
                                        accentColor: 'var(--landing-primary)',
                                        width: '14px',
                                        height: '14px'
                                    }}/> 保持登录
                                </label>
                                <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    setAuthMode('forgot');
                                    setGlobalError('');
                                    setFieldErrors({
                                        username: '',
                                        password: '',
                                        confirmPassword: '',
                                        email: '',
                                        emailCode: '',
                                        captchaCode: ''
                                    });
                                    setFormData({
                                        username: '',
                                        password: '',
                                        confirmPassword: '',
                                        email: '',
                                        emailCode: '',
                                        captchaCode: ''
                                    });
                                }} style={{
                                    color: 'var(--landing-primary)',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.85rem'
                                }}>忘记密码？</a>
                            </div>
                        )}

                        <button type="submit" disabled={loading} style={{
                            width: '100%',
                            padding: '0.9rem',
                            background: 'linear-gradient(135deg, var(--landing-primary), var(--landing-secondary))',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '1.05rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            boxShadow: '0 8px 15px rgba(79, 70, 229, 0.2)',
                            opacity: loading ? 0.7 : 1,
                            marginTop: '0.5rem'
                        }}>
                            {loading ?
                                <i className="fas fa-spinner fa-spin"></i> : (authMode === 'login' ? '安全登录' : (authMode === 'register' ? '立 即 注 册' : '确 认 重 置'))}
                        </button>

                        <div style={{textAlign: 'center', marginTop: '1.2rem', color: '#64748b', fontSize: '0.9rem'}}>
                            {authMode === 'login' ? '还没有账号？' : '已有账号？'}
                            <a href="#" onClick={(e) => {
                                e.preventDefault();
                                setAuthMode(authMode === 'login' ? 'register' : 'login');
                                setGlobalError('');
                                setFieldErrors({
                                    username: '',
                                    password: '',
                                    confirmPassword: '',
                                    email: '',
                                    emailCode: '',
                                    captchaCode: ''
                                });
                                setFormData({
                                    username: '',
                                    password: '',
                                    confirmPassword: '',
                                    email: '',
                                    emailCode: '',
                                    captchaCode: ''
                                });
                            }} style={{
                                color: 'var(--landing-primary)',
                                fontWeight: 700,
                                marginLeft: '6px',
                                textDecoration: 'none'
                            }}>
                                {authMode === 'login' ? '免费注册' : '返回登录'}
                            </a>
                        </div>
                    </form>

                    <div style={{
                        textAlign: 'center',
                        marginTop: '1.5rem',
                        borderTop: '1px solid #e2e8f0',
                        paddingTop: '1.2rem'
                    }}>
                        <a href="#" onClick={(e) => {
                            e.preventDefault();
                            navigate('/');
                        }}
                           style={{
                               color: '#94a3b8',
                               textDecoration: 'none',
                               fontWeight: 500,
                               display: 'inline-flex',
                               alignItems: 'center',
                               gap: '0.5rem',
                               fontSize: '0.9rem'
                           }}>
                            <i className="fas fa-arrow-left"></i> 返回首页
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}