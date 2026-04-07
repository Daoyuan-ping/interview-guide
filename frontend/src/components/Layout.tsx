import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    Database,
    FileStack,
    MessageSquare,
    Moon,
    Sparkles,
    Sun,
    Upload,
    Users,
    User,
    LogOut,
    Settings,
    PieChart
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import UserProfileModal from './UserProfileModal';
import { getUserInfo } from '../api/user'; // 👈 引入获取用户信息的API

interface NavItem {
    id: string;
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
}

interface NavGroup {
    id: string;
    title: string;
    items: NavItem[];
}

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;
    const { theme, toggleTheme } = useTheme();

    // ----- 个人中心相关的状态和逻辑 -----
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(localStorage.getItem('userAvatar'));

    // 解析用户信息获取 userId 和 username
    const aiUserStr = localStorage.getItem('ai_user');
    const aiUser = aiUserStr ? JSON.parse(aiUserStr) : null;
    const username = aiUser?.username || localStorage.getItem('username') || 'User';

    // 增强版：处理头像的拉取和监听
    useEffect(() => {
        // 1. 每次进入/刷新页面时，主动拉取一次最新头像
        if (aiUser?.userId) {
            getUserInfo(aiUser.userId).then((res: any) => {
                const data = res.data || res;
                if (data && data.avatarUrl) {
                    setAvatarUrl(data.avatarUrl);
                    localStorage.setItem('userAvatar', data.avatarUrl); // 同步到本地缓存
                }
            }).catch(err => console.error("获取右上角头像失败", err));
        }

        // 2. 监听在 UserProfileModal 中上传完头像触发的自定义事件
        const handleAvatarUpdate = () => {
            setAvatarUrl(localStorage.getItem('userAvatar'));
        };
        window.addEventListener('avatarUpdated', handleAvatarUpdate);
        return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    }, [aiUser?.userId]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // ----- 侧边栏导航逻辑 -----
    // 按业务模块组织的导航项
    const navGroups: NavGroup[] = [
        {
            id: 'career',
            title: '简历与面试',
            items: [
                { id: 'upload', path: '/upload', label: '上传简历', icon: Upload, description: 'AI 分析简历' },
                { id: 'resumes', path: '/history', label: '简历库', icon: FileStack, description: '管理所有简历' },
                { id: 'interviews', path: '/interviews', label: '面试记录', icon: Users, description: '查看面试历史' },
                { id: 'dashboard', path: '/dashboard', label: '数据看板', icon: PieChart, description: '能力分析与统计' },
            ],
        },
        {
            id: 'knowledge',
            title: '知识库',
            items: [
                { id: 'kb-manage', path: '/knowledgebase', label: '知识库管理', icon: Database, description: '管理知识文档' },
                { id: 'chat', path: '/knowledgebase/chat', label: '问答助手', icon: MessageSquare, description: '基于知识库问答' },
            ],
        },
    ];

    // 判断当前页面是否匹配导航项
    const isActive = (path: string) => {
        if (path === '/upload') {
            return currentPath === '/upload' || currentPath === '/';
        }
        if (path === '/knowledgebase') {
            return currentPath === '/knowledgebase' || currentPath === '/knowledgebase/upload';
        }
        return currentPath.startsWith(path);
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 relative">

            {/* --- 新增：页面右上角的个人中心下拉菜单 --- */}
            <div className="absolute top-4 right-8 z-50">
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 p-1.5 pr-3 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all"
                    >
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center overflow-hidden border border-primary-200 dark:border-primary-800">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            )}
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{username}</span>
                    </button>

                    {/* 下拉菜单动画层 */}
                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden"
                            >
                                <div className="py-2">
                                    <button
                                        onClick={() => { setIsDropdownOpen(false); setIsProfileModalOpen(true); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                    >
                                        <Settings className="w-4 h-4 text-slate-400" />
                                        个人中心
                                    </button>
                                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        退出登录
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* 左侧边栏 */}
            <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-700 fixed h-screen left-0 top-0 z-40 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <Link to="/upload" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-lg font-bold text-slate-800 dark:text-white tracking-tight block">AI Interview</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">智能面试助手</span>
                        </div>
                    </Link>
                </div>

                {/* 主题切换按钮 */}
                <div className="px-4 pb-2 mt-4">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        {theme === 'dark' ? (
                            <>
                                <Sun className="w-4 h-4"/>
                                <span className="text-sm font-medium">浅色模式</span>
                            </>
                        ) : (
                            <>
                                <Moon className="w-4 h-4"/>
                                <span className="text-sm font-medium">深色模式</span>
                            </>
                        )}
                    </button>
                </div>

                {/* 导航菜单 */}
                <nav className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-6">
                        {navGroups.map((group) => (
                            <div key={group.id}>
                                {/* 分组标题 */}
                                <div className="px-3 mb-2">
                                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    {group.title}
                                  </span>
                                </div>
                                {/* 分组下的导航项 */}
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const active = isActive(item.path);
                                        return (
                                            <Link
                                                key={item.id}
                                                to={item.path}
                                                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                          ${active
                                                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors
                          ${active
                                                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-700 dark:group-hover:text-white'
                                                }`}
                                                >
                                                    <item.icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <span className={`text-sm block ${active ? 'font-semibold' : 'font-medium'}`}>
                                                    {item.label}
                                                  </span>
                                                    {item.description && (
                                                        <span className="text-xs text-slate-400 dark:text-slate-500 truncate block">
                                                          {item.description}
                                                        </span>
                                                    )}
                                                </div>
                                                {active && (
                                                    <ChevronRight className="w-4 h-4 text-primary-400" />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </nav>

                {/* 底部信息 */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="px-3 py-2 bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/30 dark:to-slate-800 rounded-xl">
                        <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">AI 面试助手 v1.0</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Powered by AI</p>
                    </div>
                </div>
            </aside>

            {/* 主内容区（增加了 pt-20 避免内容和右上角的头像重叠） */}
            <main className="flex-1 ml-64 p-10 pt-20 min-h-screen overflow-y-auto">
                <motion.div
                    key={currentPath}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <Outlet />
                </motion.div>
            </main>

            {/* 挂载个人中心弹窗 */}
            <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        </div>
    );
}