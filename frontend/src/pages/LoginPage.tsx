import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, 
    Lock, 
    Mail, 
    ShieldCheck, 
    Key, 
    Eye, 
    EyeOff, 
    ArrowLeft, 
    Loader2, 
    CheckCircle2, 
    AlertCircle,
    Bot,
    ExternalLink,
    ChevronRight,
    Settings
} from 'lucide-react';
import { authApi } from '../api/auth';

type AuthMode = 'login' | 'register' | 'forgot';

export default function LoginPage() {
    const navigate = useNavigate();

    // 状态管理
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [isAdminLogin, setIsAdminLogin] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);

    // 表单数据
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        emailCode: '',
        captchaCode: ''
    });

    // 校验错误
    const [errors, setErrors] = useState<Record<string, string>>({});

    // 验证码
    const [captchaImg, setCaptchaImg] = useState('');
    const [captchaKey, setCaptchaKey] = useState('');
    const [countdown, setCountdown] = useState(0);

    // 密码强度计算
    const passwordStrength = useMemo(() => {
        const pass = formData.password;
        if (!pass) return 0;
        let score = 0;
        if (pass.length >= 8) score += 25;
        if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 25;
        if (/[0-9]/.test(pass)) score += 25;
        if (/[^a-zA-Z0-9]/.test(pass)) score += 25;
        return score;
    }, [formData.password]);

    const getStrengthLabel = (score: number) => {
        if (score <= 25) return { label: '弱', color: 'bg-red-500' };
        if (score <= 50) return { label: '中', color: 'bg-amber-500' };
        if (score <= 75) return { label: '强', color: 'bg-emerald-500' };
        return { label: '极强', color: 'bg-indigo-500' };
    };

    // 获取图形验证码
    const fetchCaptcha = useCallback(async () => {
        try {
            const res = await authApi.getCaptcha();
            setCaptchaImg(res.captchaBase64);
            setCaptchaKey(res.captchaKey);
        } catch (err) {
            console.error("获取验证码失败", err);
        }
    }, []);

    // 初始化与切换模式
    useEffect(() => {
        setGlobalError('');
        setErrors({});
        if (authMode !== 'login') fetchCaptcha();
    }, [authMode, fetchCaptcha]);

    // 倒计时逻辑
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // 实时校验逻辑
    const validateField = (name: string, value: string) => {
        let error = '';
        switch (name) {
            case 'username':
                if (!value && authMode !== 'forgot') error = '请输入用户名';
                else if (authMode === 'register' && !/^[a-zA-Z0-9_-]{4,16}$/.test(value)) 
                    error = '4-16 位字母/数字/下划线';
                break;
            case 'email':
                if (!value) error = '请输入邮箱';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = '邮箱格式不正确';
                break;
            case 'password':
                if (!value) error = '请输入密码';
                else if (authMode !== 'login') {
                    if (value.length < 8) error = '密码至少 8 位';
                    else if (passwordStrength < 50) error = '密码强度不足';
                }
                break;
            case 'confirmPassword':
                if (value !== formData.password) error = '两次密码不一致';
                break;
            case 'captchaCode':
                if (!value) error = '请输入图形验证码';
                break;
            case 'emailCode':
                if (!value) error = '请输入 6 位验证码';
                break;
        }
        return error;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setGlobalError('');
        
        // 实时校验
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    // 发送邮箱验证码
    const handleSendEmailCode = async () => {
        const emailErr = validateField('email', formData.email);
        const captchaErr = validateField('captchaCode', formData.captchaCode);

        if (emailErr || captchaErr) {
            setErrors(prev => ({ ...prev, email: emailErr, captchaCode: captchaErr }));
            return;
        }

        try {
            await authApi.sendEmailCode({
                email: formData.email,
                captchaKey: captchaKey,
                captchaCode: formData.captchaCode.trim()
            });
            setCountdown(60);
            setGlobalError('');
        } catch (err: any) {
            setErrors(prev => ({ ...prev, captchaCode: err.response?.data?.message || '发送失败' }));
            fetchCaptcha();
        }
    };

    // 提交表单
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 最终校验
        const newErrors: Record<string, string> = {};
        const fields = authMode === 'login' 
            ? ['username', 'password'] 
            : authMode === 'register' 
                ? ['username', 'email', 'captchaCode', 'emailCode', 'password', 'confirmPassword']
                : ['email', 'captchaCode', 'emailCode', 'password', 'confirmPassword'];

        fields.forEach(f => {
            const err = validateField(f, (formData as any)[f]);
            if (err) newErrors[f] = err;
        });

        if (authMode === 'register' && !agreeTerms) {
            setGlobalError('请先阅读并同意用户协议与隐私政策');
            return;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            let res;
            if (authMode === 'register') {
                res = await authApi.register({ ...formData, captchaKey });
                alert('注册成功！');
            } else if (authMode === 'forgot') {
                await authApi.resetPassword({
                    email: formData.email,
                    emailCode: formData.emailCode,
                    newPassword: formData.password
                });
                alert('密码重置成功');
                setAuthMode('login');
                return;
            } else {
                res = isAdminLogin 
                    ? await authApi.adminLogin({ username: formData.username, password: formData.password })
                    : await authApi.login({ username: formData.username, password: formData.password });
            }

            if (res) {
                localStorage.setItem('ai_token', res.token);
                localStorage.setItem('ai_user', JSON.stringify({
                    userId: res.userId,
                    username: res.username,
                    role: res.role,
                    avatarUrl: res.fullAvatarUrl
                }));
                navigate(isAdminLogin && res.role === 'ADMIN' ? '/admin' : '/upload');
            }
        } catch (err: any) {
            setGlobalError(err.response?.data?.message || '操作失败，请重试');
            if (authMode !== 'login') fetchCaptcha();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans">
            {/* 左侧品牌区 (Desktop only) */}
            <div className="hidden lg:flex flex-1 relative bg-primary-600 overflow-hidden items-center justify-center p-12 text-white">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[100px]" />
                </div>
                
                <div className="relative z-10 max-w-lg text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-6"
                    >
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-primary-600 shadow-2xl">
                            <Bot size={48} />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">AI Interview</h1>
                        <p className="text-xl text-primary-100 leading-relaxed">
                            用 AI 重新定义求职面试，提供专业的简历分析与智能模拟对话。
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 mt-8 w-full text-left">
                            {[
                                { icon: <CheckCircle2 size={18} />, text: '智能简历分析' },
                                { icon: <CheckCircle2 size={18} />, text: 'AI 模拟面试' },
                                { icon: <CheckCircle2 size={18} />, text: '能力提升建议' },
                                { icon: <CheckCircle2 size={18} />, text: '大模型驱动' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 bg-white/10 px-4 py-3 rounded-xl backdrop-blur-sm">
                                    {item.icon}
                                    <span className="font-medium text-sm">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* 右侧表单区 */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative">
                {/* 背景装饰 */}
                <div className="lg:hidden absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full blur-[80px]" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100 rounded-full blur-[80px]" />
                </div>

                <motion.div 
                    layout
                    className={`w-full ${authMode === 'login' ? 'max-w-md' : 'max-w-2xl'} glass-card p-8 sm:p-10`}
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="lg:hidden flex justify-center mb-6">
                            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
                                <Bot size={24} />
                            </div>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                            {authMode === 'login' ? '欢迎回来' : authMode === 'register' ? '创建账号' : '找回密码'}
                        </h2>
                        <p className="text-slate-500">
                            {authMode === 'login' ? '开启您的 AI 智能面试之旅' : '只需简单几步即可完成注册'}
                        </p>
                    </div>

                    {/* Global Error */}
                    <AnimatePresence>
                        {globalError && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm mb-6 overflow-hidden"
                            >
                                <AlertCircle size={18} className="shrink-0" />
                                <span>{globalError}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className={`grid gap-5 ${authMode !== 'login' ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
                            {/* Left Column (or Only Column) */}
                            <div className="space-y-5">
                                {authMode !== 'forgot' && (
                                    <InputGroup 
                                        label="用户名"
                                        name="username"
                                        icon={<User size={18} />}
                                        value={formData.username}
                                        error={errors.username}
                                        onChange={handleInputChange}
                                        placeholder="请输入用户名"
                                        required
                                    />
                                )}
                                
                                {authMode === 'forgot' && (
                                    <InputGroup 
                                        label="绑定邮箱"
                                        name="email"
                                        type="email"
                                        icon={<Mail size={18} />}
                                        value={formData.email}
                                        error={errors.email}
                                        onChange={handleInputChange}
                                        placeholder="请输入注册邮箱"
                                        required
                                    />
                                )}

                                <div className="space-y-2">
                                    <InputGroup 
                                        label={authMode === 'forgot' ? "新密码" : "密码"}
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        icon={<Lock size={18} />}
                                        value={formData.password}
                                        error={errors.password}
                                        onChange={handleInputChange}
                                        placeholder="请输入密码"
                                        required
                                        rightElement={
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="text-slate-400 hover:text-primary-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        }
                                    />
                                    {authMode !== 'login' && formData.password && (
                                        <div className="space-y-1.5 px-1">
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                <span>强度: {getStrengthLabel(passwordStrength).label}</span>
                                            </div>
                                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${passwordStrength}%` }}
                                                    className={`h-full ${getStrengthLabel(passwordStrength).color}`}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {(authMode !== 'login') && (
                                    <InputGroup 
                                        label="确认密码"
                                        name="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        icon={<ShieldCheck size={18} />}
                                        value={formData.confirmPassword}
                                        error={errors.confirmPassword}
                                        onChange={handleInputChange}
                                        placeholder="请再次输入密码"
                                        required
                                    />
                                )}
                            </div>

                            {/* Right Column (For Register/Forgot) */}
                            {authMode !== 'login' && (
                                <div className="space-y-5">
                                    {authMode === 'register' && (
                                        <InputGroup 
                                            label="邮箱地址"
                                            name="email"
                                            type="email"
                                            icon={<Mail size={18} />}
                                            value={formData.email}
                                            error={errors.email}
                                            onChange={handleInputChange}
                                            placeholder="请输入邮箱"
                                            required
                                        />
                                    )}

                                    <div className="grid grid-cols-1 gap-5">
                                        <InputGroup 
                                            label="图形验证"
                                            name="captchaCode"
                                            icon={<ShieldCheck size={18} />}
                                            value={formData.captchaCode}
                                            error={errors.captchaCode}
                                            onChange={handleInputChange}
                                            placeholder="请输入验证码"
                                            required
                                            rightElement={
                                                captchaImg ? (
                                                    <img 
                                                        src={captchaImg} 
                                                        alt="Captcha" 
                                                        onClick={fetchCaptcha}
                                                        className="h-8 w-24 object-contain cursor-pointer rounded hover:opacity-80 transition-opacity"
                                                        title="点击刷新"
                                                    />
                                                ) : <Loader2 className="animate-spin text-primary-600" size={18} />
                                            }
                                        />
                                        
                                        <InputGroup 
                                            label="邮箱验证码"
                                            name="emailCode"
                                            icon={<Key size={18} />}
                                            value={formData.emailCode}
                                            error={errors.emailCode}
                                            onChange={handleInputChange}
                                            placeholder="6 位验证码"
                                            required
                                            rightElement={
                                                <button 
                                                    type="button"
                                                    onClick={handleSendEmailCode}
                                                    disabled={countdown > 0}
                                                    className="text-xs font-bold text-primary-600 hover:text-primary-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                                                >
                                                    {countdown > 0 ? `${countdown}s 后重试` : '获取验证码'}
                                                </button>
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Extra Options */}
                        {authMode === 'login' && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input 
                                                type="checkbox" 
                                                checked={rememberMe}
                                                onChange={() => setRememberMe(!rememberMe)}
                                                className="peer appearance-none w-5 h-5 border-2 border-slate-200 rounded-md checked:bg-primary-600 checked:border-primary-600 transition-all cursor-pointer"
                                            />
                                            <CheckCircle2 size={14} className="absolute left-0.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                        </div>
                                        <span className="text-sm text-slate-600 font-medium group-hover:text-primary-600 transition-colors">记住我</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input 
                                                type="checkbox" 
                                                checked={isAdminLogin}
                                                onChange={() => setIsAdminLogin(!isAdminLogin)}
                                                className="peer appearance-none w-5 h-5 border-2 border-slate-200 rounded-md checked:bg-primary-600 checked:border-primary-600 transition-all cursor-pointer"
                                            />
                                            <Settings size={14} className="absolute left-0.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                        </div>
                                        <span className="text-sm text-slate-600 font-medium group-hover:text-primary-600 transition-colors">管理员登录</span>
                                    </label>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setAuthMode('forgot')}
                                    className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors text-left"
                                >
                                    忘记密码？
                                </button>
                            </div>
                        )}

                        {authMode === 'register' && (
                            <div className="py-2">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center mt-0.5">
                                        <input 
                                            type="checkbox" 
                                            checked={agreeTerms}
                                            onChange={() => setAgreeTerms(!agreeTerms)}
                                            className="peer appearance-none w-5 h-5 border-2 border-slate-200 rounded-md checked:bg-primary-600 checked:border-primary-600 transition-all cursor-pointer"
                                        />
                                        <CheckCircle2 size={14} className="absolute left-0.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                    </div>
                                    <span className="text-sm text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">
                                        我已阅读并同意 
                                        <a href="#" className="text-primary-600 font-bold mx-1 hover:underline inline-flex items-center gap-0.5">
                                            用户协议 <ExternalLink size={12} />
                                        </a> 
                                        与 
                                        <a href="#" className="text-primary-600 font-bold mx-1 hover:underline inline-flex items-center gap-0.5">
                                            隐私政策 <ExternalLink size={12} />
                                        </a>
                                    </span>
                                </label>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-4 text-lg font-bold rounded-2xl flex items-center justify-center gap-3 mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : (
                                <>
                                    <span>
                                        {authMode === 'login' ? '登 录' : authMode === 'register' ? '注 册' : '重置密码'}
                                    </span>
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="mt-10 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-500">
                            {authMode === 'login' ? (
                                <>
                                    <span>还没有账号？</span>
                                    <button 
                                        onClick={() => setAuthMode('register')}
                                        className="font-bold text-primary-600 hover:text-primary-700 transition-colors"
                                    >
                                        立即注册
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={() => setAuthMode('login')}
                                    className="flex items-center gap-2 font-bold text-primary-600 hover:text-primary-700 transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                    <span>返回登录</span>
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Footer Copyright */}
                <div className="mt-12 text-slate-400 text-xs sm:text-sm text-center">
                    © 2026 AI Interview 团队 | 计算机设计大赛参赛项目
                </div>
            </div>
        </div>
    );
}

// 辅助组件：输入框组
function InputGroup({ 
    label, 
    name, 
    type = 'text', 
    icon, 
    value, 
    error, 
    onChange, 
    placeholder, 
    required,
    rightElement
}: {
    label: string;
    name: string;
    type?: string;
    icon: React.ReactNode;
    value: string;
    error?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    required?: boolean;
    rightElement?: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5 w-full">
            <label className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-1">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-primary-600'}`}>
                    {icon}
                </div>
                <input 
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`modern-input pl-11 pr-12 ${error ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : ''}`}
                />
                {rightElement && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                        {rightElement}
                    </div>
                )}
            </div>
            <AnimatePresence>
                {error && (
                    <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-[11px] font-bold text-red-500 ml-1 flex items-center gap-1"
                    >
                        <AlertCircle size={12} />
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
