import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Users,

    LogOut,
    Moon,
    Sun,
    ShieldCheck,
    // TerminalSquare,
    } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const currentPath = location.pathname;

    // 💡 状态管理：存储用户名和头像 URL
    const [username, setUsername] = useState('Admin');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // 权限校验与信息加载
    useEffect(() => {
        const aiUserStr = localStorage.getItem('ai_user');

        if (!aiUserStr) {
            navigate('/login');
            return;
        }
        const aiUser = JSON.parse(aiUserStr);

        // 权限校验
        if (aiUser.role !== 'ADMIN') {
            alert('无权访问：非管理员账号');
            navigate('/');
            return;
        }

        // 💡 加载用户信息
        setUsername(aiUser.username || 'Admin');

        // 💡 处理头像：
        // 1. 如果你在 UserService 登录接口里已经把文件 Key 转成了完整 URL 存到了 localStorage，直接用
        // 2. 如果 localStorage 存的是 Key，你可能需要在 Layout 里调用一下获取配置的接口来拼接 URL。
        // 这里假设 localStorage 存的是可以直接访问的完整 URL (在登录/注册时处理好最方便)
        if (aiUser.avatarUrl) {
            setAvatarUrl(aiUser.avatarUrl);
        } else if (aiUser.avatar) {
            // 兜底：如果属性名叫 avatar
            setAvatarUrl(aiUser.avatar);
        }

    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const adminNavs = [
        { id: 'dashboard', path: '/admin', label: '系统大屏', icon: LayoutDashboard },
        { id: 'users', path: '/admin/users', label: '用户管理', icon: Users },

    ];

    return (
        <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-900 relative font-sans">
            {/* 侧边栏 */}
            <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200/70 dark:border-slate-800 fixed h-screen left-0 top-0 z-40 flex flex-col shadow-sm">
                {/* Logo */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-lg font-bold text-slate-800 dark:text-white tracking-tight block">Admin OS</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">智能管理中枢</span>
                    </div>
                </div>

                {/* 导航 */}
                <nav className="flex-1 p-4 overflow-y-auto space-y-1 mt-2">
                    {adminNavs.map((item) => {
                        const active = currentPath === item.path || (item.path !== '/admin' && currentPath.startsWith(item.path));
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                    ${active
                                    ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-semibold'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white font-medium'
                                }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* 底部按钮 */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm font-medium"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        {theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        退出管理端
                    </button>
                </div>
            </aside>

            {/* 主内容区 */}
            <main className="flex-1 ml-64 min-h-screen flex flex-col">
                {/* 顶部 Header */}
                <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-30">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                        {adminNavs.find(n => n.path === currentPath || (n.path !== '/admin' && currentPath.startsWith(n.path)))?.label || '控制台'}
                    </h2>
                    <div className="flex items-center gap-5">
                      {/*  <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            系统运行良好
                        </div>*/}
                       {/* <div className="h-5 w-px bg-slate-200 dark:bg-slate-700"></div>*/}

                        {/* 💡 右上角用户信息区域 */}
                        <div className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">

                            {/* 💡 头像/占位符展示逻辑 */}
                            <div className="w-9 h-9 rounded-full overflow-hidden shadow-md border-2 border-white dark:border-slate-700 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={username}
                                        className="w-full h-full object-cover"
                                        onError={() => setAvatarUrl(null)} // 如果加载失败，回退到文字
                                    />
                                ) : (
                                    // 💡 回退方案：首字母占位
                                    <span className="font-bold text-lg">
                                        {username.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {username}
                        </div>
                    </div>
                </header>

                {/* 子页面渲染 */}
                <div className="p-8 flex-1 overflow-y-auto">
                    <motion.div
                        key={currentPath}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Outlet />
                    </motion.div>
                </div>
            </main>
        </div>
    );
}