import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Trophy, Brain, MessageSquare, TrendingUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../api/interview';
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const aiUserStr = localStorage.getItem('ai_user');
    const userId = aiUserStr ? JSON.parse(aiUserStr).userId : null;

    useEffect(() => {
        if (userId) {
            getDashboardStats(userId).then((res: any) => {
                setStats(res.data || res);
            }).catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [userId]);

    if (loading) {
        return <div className="flex h-full items-center justify-center text-slate-400">加载数据中...</div>;
    }

    if (!stats) {
        return <div className="flex h-full items-center justify-center text-slate-400">暂无数据</div>;
    }

    // 渲染顶部数据卡片
    const renderStatCard = (title: string, value: string | number, icon: any, colorClass: string, bgClass: string) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4"
        >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${bgClass} ${colorClass}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
            </div>
        </motion.div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">能力数据看板</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">查看你的 AI 面试表现与能力成长轨迹</p>
                </div>
                <Link to="/interviews" className="px-4 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg font-medium hover:bg-primary-100 transition-colors">
                    开始新面试
                </Link>
            </div>

            {/* 顶部四个数据卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {renderStatCard('总面试次数', `${stats.totalInterviews} 次`, <Target className="w-7 h-7" />, 'text-blue-600 dark:text-blue-400', 'bg-blue-50 dark:bg-blue-900/30')}
                {renderStatCard('平均得分', `${stats.avgScore} 分`, <TrendingUp className="w-7 h-7" />, 'text-primary-600 dark:text-primary-400', 'bg-primary-50 dark:bg-primary-900/30')}
                {renderStatCard('最高得分', `${stats.highestScore} 分`, <Trophy className="w-7 h-7" />, 'text-orange-600 dark:text-orange-400', 'bg-orange-50 dark:bg-orange-900/30')}
                {renderStatCard('累计答题', `${stats.totalQuestions} 题`, <Brain className="w-7 h-7" />, 'text-emerald-600 dark:text-emerald-400', 'bg-emerald-50 dark:bg-emerald-900/30')}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左侧：雷达图能力图谱 */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm"
                >
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-primary-500" /> 综合能力雷达图
                    </h3>
                    <div className="h-[350px] w-full">
                        {stats.totalInterviews > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsRadar cx="50%" cy="50%" outerRadius="75%" data={stats.radarData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 13 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                                    <Radar name="我的能力值" dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
                                </RechartsRadar>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                                <p>完成一次 AI 面试后即可生成能力图谱</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* 右侧：最近面试表现列表 */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">最近面试表现</h3>
                        <Link to="/history" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
                            全部 <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="space-y-5">
                        {stats.recentInterviews?.length > 0 ? (
                            stats.recentInterviews.map((item: any) => (
                                <div key={item.id} className="group cursor-pointer">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                                                {item.title}
                                            </p>
                                            <p className="text-xs text-slate-400">{item.date}</p>
                                        </div>
                                        <div className="ml-3 font-bold text-lg text-primary-600">{item.score}</div>
                                    </div>
                                    {/* 自定义简单进度条 */}
                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${item.score >= 80 ? 'bg-emerald-500' : item.score >= 60 ? 'bg-primary-500' : 'bg-orange-500'}`}
                                            style={{ width: `${item.score}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center text-slate-400 text-sm">
                                暂无面试记录
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}