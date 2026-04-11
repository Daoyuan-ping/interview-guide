import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
    Bot, 
    FileText, 
    MessageSquare, 
    TrendingUp, 
    Zap, 
    CheckCircle2, 
    Star, 
    PlayCircle, 
    Upload,
    Cpu,
    Database,
    Layout as LayoutIcon,
    Layers,
    Brain,
    ArrowRight
} from 'lucide-react';

export default function HomePage() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [typedNormal, setTypedNormal] = useState("");
    const [typedHighlight, setTypedHighlight] = useState("");
    const normalText = "用AI重新定义";
    const highlightText = "求职面试";

    // 监听滚动
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 打字机效果
    useEffect(() => {
        let nIdx = 0;
        let hIdx = 0;
        let timeoutId: number;

        const typeHighlight = () => {
            if (hIdx < highlightText.length) {
                setTypedHighlight(highlightText.substring(0, hIdx + 1));
                hIdx++;
                timeoutId = setTimeout(typeHighlight, 150) as unknown as number;
            }
        };

        const typeNormal = () => {
            if (nIdx < normalText.length) {
                setTypedNormal(normalText.substring(0, nIdx + 1));
                nIdx++;
                timeoutId = setTimeout(typeNormal, 150) as unknown as number;
            } else {
                typeHighlight();
            }
        };

        typeNormal();
        return () => clearTimeout(timeoutId);
    }, []);

    const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-600 overflow-x-hidden">
            {/* 背景装饰 */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-purple-100/50 rounded-full blur-[100px]" />
                <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] bg-blue-100/50 rounded-full blur-[110px]" />
            </div>

            {/* 导航栏 */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
                scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
            }`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xl font-bold text-gradient">
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
                            <Bot size={24} />
                        </div>
                        <span>AI Interview</span>
                    </div>

                    <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
                        {['首页', '核心功能', '技术架构'].map((item, idx) => (
                            <li key={item}>
                                <a 
                                    href={`#${['home', 'features', 'tech'][idx]}`}
                                    onClick={(e) => handleScrollTo(e, ['home', 'features', 'tech'][idx])}
                                    className="text-slate-600 hover:text-primary-600 font-medium transition-colors relative group"
                                >
                                    {item}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-300 group-hover:w-full" />
                                </a>
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/login')}
                            className="hidden sm:block text-slate-600 hover:text-primary-600 font-medium transition-colors"
                        >
                            登录
                        </button>
                        <button 
                            onClick={() => navigate('/login')}
                            className="btn-primary rounded-full px-8 py-2.5"
                        >
                            立即体验
                        </button>
                    </div>
                </div>
            </nav>

            {/* 英雄区 */}
            <section id="home" className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="z-10"
                    >
                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6">
                            {typedNormal}
                            <br />
                            <span className="text-gradient bg-gradient-to-r from-primary-600 via-purple-600 to-pink-500">
                                {typedHighlight}
                            </span>
                            <span className="inline-block w-1.5 h-12 bg-primary-600 ml-2 animate-pulse align-middle" />
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
                            基于 Qwen 大语言模型的智能简历分析与 AI 面试官平台，为你提供个性化的求职准备方案，助力春招秋招脱颖而出。
                        </p>

                        <div className="flex flex-wrap gap-4 mb-12">
                            <button 
                                onClick={() => navigate('/login')}
                                className="group btn-primary rounded-2xl px-8 py-4 text-lg"
                            >
                                <Upload size={20} />
                                <span>上传简历</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button 
                                onClick={() => navigate('/login')}
                                className="btn-secondary rounded-2xl px-8 py-4 text-lg"
                            >
                                <PlayCircle size={20} className="text-primary-600" />
                                <span>查看演示</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-slate-900">98%</span>
                                <span className="text-sm text-slate-500">简历通过率提升</span>
                            </div>
                            <div className="w-px h-10 bg-slate-200" />
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-slate-900">5000+</span>
                                <span className="text-sm text-slate-500">模拟面试次数</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="relative z-10 glass-card p-8 rounded-[2.5rem] overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-purple-600" />
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                </div>
                                <div className="px-3 py-1 bg-primary-50 text-primary-600 text-xs font-bold rounded-full">
                                    AI 面试助手
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                                        <Bot size={20} />
                                    </div>
                                    <div className="p-4 bg-primary-50 rounded-2xl rounded-tl-none text-slate-700 text-sm">
                                        正在分析您的简历...
                                    </div>
                                </div>
                                <div className="flex flex-row-reverse gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                                        <FileText size={20} />
                                    </div>
                                    <div className="p-4 bg-white rounded-2xl rounded-tr-none shadow-sm text-slate-700 text-sm border border-slate-100">
                                        简历已上传，正在等待评估结果。
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                                        <Bot size={20} />
                                    </div>
                                    <div className="p-4 bg-primary-50 rounded-2xl rounded-tl-none text-slate-700 text-sm">
                                        <div className="flex items-center gap-2 mb-2 font-bold text-primary-700">
                                            <CheckCircle2 size={16} /> 分析完成
                                        </div>
                                        为您准备了 5 个核心面试问题，是否现在开始模拟？
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 装饰性浮动标签 */}
                        <motion.div 
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-6 -right-6 z-20 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
                        >
                            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                                <Star size={20} fill="currentColor" />
                            </div>
                            <div>
                                <div className="text-sm font-bold">智能评分</div>
                                <div className="text-xs text-slate-500">准确率 99.9%</div>
                            </div>
                        </motion.div>

                        <motion.div 
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute -bottom-6 -left-6 z-20 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
                        >
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                <Zap size={20} fill="currentColor" />
                            </div>
                            <div>
                                <div className="text-sm font-bold">即时反馈</div>
                                <div className="text-xs text-slate-500">毫秒级生成报告</div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* 功能区 */}
            <section id="features" className="py-24 px-6 bg-white relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-5xl font-bold mb-4"
                        >
                            核心功能
                        </motion.h2>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-500 text-lg max-w-2xl mx-auto"
                        >
                            从简历解析到模拟面试，提供全方位的一站式 AI 求职解决方案
                        </motion.p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <FileText size={32} />,
                                title: "智能简历解析",
                                desc: "基于先进的 RAG 技术与向量数据库，深度提取简历关键技能与项目经验，生成专业画像。",
                                color: "indigo"
                            },
                            {
                                icon: <MessageSquare size={32} />,
                                title: "AI 模拟面试",
                                desc: "针对目标岗位生成个性化面试题库，实时多轮交互对话，全方位模拟真实面试场景。",
                                color: "purple"
                            },
                            {
                                icon: <TrendingUp size={32} />,
                                title: "能力提升建议",
                                desc: "结合面试表现与简历现状，智能分析优劣势，量身定制专属的学习路径与进阶方案。",
                                color: "pink"
                            }
                        ].map((feature, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group p-8 glass-card glass-card-hover rounded-3xl"
                            >
                                <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center text-white shadow-lg bg-${feature.color}-600 group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-4 text-slate-900 group-hover:text-primary-600 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 技术架构区 */}
            <section id="tech" className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[150px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[150px]" />
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">技术架构</h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            基于行业主流技术栈构建，确保系统的高性能、高并发与高稳定性
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {[
                            { icon: <Cpu />, name: "Java 21" },
                            { icon: <Layers />, name: "Spring Boot 3" },
                            { icon: <Database />, name: "PostgreSQL" },
                            { icon: <Database />, name: "PGVector" },
                            { icon: <Brain />, name: "Qwen AI" },
                            { icon: <LayoutIcon />, name: "React & Vite" }
                        ].map((tech, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-primary-500/50 transition-all group"
                            >
                                <div className="text-primary-400 group-hover:text-primary-300 group-hover:scale-110 transition-all mb-3">
                                    {React.cloneElement(tech.icon as React.ReactElement, { size: 32 })}
                                </div>
                                <span className="text-sm font-medium text-slate-300">{tech.name}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 页脚 */}
            <footer className="py-12 px-6 bg-slate-950 border-t border-white/5 text-slate-500">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-xl font-bold text-white">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <Bot size={18} />
                        </div>
                        <span>AI Interview</span>
                    </div>
                    <div className="text-sm">
                        © 2026 AI Interview 团队 | 计算机设计大赛参赛项目
                    </div>
                    <div className="flex gap-6 text-sm">
                        <a href="#" className="hover:text-white transition-colors">隐私政策</a>
                        <a href="#" className="hover:text-white transition-colors">使用条款</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
