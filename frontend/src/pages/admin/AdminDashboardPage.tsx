import { useEffect, useState } from 'react';
import { Users, FileText, Cpu, Activity, Server, Database, Zap, HardDrive } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminApi } from '../../api/admin';
import { useTheme } from '../../hooks/useTheme';

export default function AdminDashboardPage() {
    // 状态管理
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { theme } = useTheme();

    useEffect(() => {
        adminApi.getDashboardStats().then((res: any) => {
            setStats(res.data || res);
        }).catch(err => {
            console.error("获取大屏数据失败", err);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    const StatCard = ({ title, value, subText, icon, colorClass }: any) => (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.1)] transition-shadow duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClass}`}>
                    {icon}
                </div>
                {subText && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                        {subText}
                    </span>
                )}
            </div>
            <div>
                <h4 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-1 tracking-tight">{value}</h4>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            </div>
        </div>
    );

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center text-slate-500 font-medium">正在实时聚合系统数据...</div>;
    }

    if (!stats) return null;

    const formatTokens = (tokens: number) => {
        if (tokens >= 10000) return (tokens / 10000).toFixed(1) + ' 万';
        return tokens.toString();
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* 顶部四个数据卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="总注册用户"
                    value={stats.totalUsers}
                    subText={`昨日新增 +${stats.yesterdayNewUsers}`}
                    icon={<Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                    colorClass="bg-blue-50 dark:bg-blue-500/20"
                />
                <StatCard
                    title="累计生成简历 / 面试"
                    value={`${stats.totalResumes} / ${stats.totalInterviews}`}
                    icon={<FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                    colorClass="bg-indigo-50 dark:bg-indigo-500/20"
                />
                <StatCard
                    title="模型 Token 消耗"
                    value={formatTokens(stats.estimatedTokens)}
                    subText={`预估成本 ¥${stats.estimatedCost}`}
                    icon={<Cpu className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
                    colorClass="bg-purple-50 dark:bg-purple-500/20"
                />
                <StatCard
                    title="今日活跃请求"
                    value={stats.todayActive}
                    subText="实时计算"
                    icon={<Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
                    colorClass="bg-orange-50 dark:bg-orange-500/20"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 左侧：活跃趋势折线图 */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-7 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">平台近 7 日活跃趋势</h3>
                    </div>
                    <div className="h-[360px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorInterview" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke={theme === 'dark' ? '#475569' : '#94a3b8'} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke={theme === 'dark' ? '#475569' : '#94a3b8'} fontSize={12} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                        color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                                    }}
                                    itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="面试次数" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorInterview)" activeDot={{ r: 6, strokeWidth: 0 }} />
                                <Area type="monotone" dataKey="活跃用户" stroke="#10b981" strokeWidth={3} fillOpacity={0.1} fill="url(#colorInterview)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 右侧：纯真实数据面板 */}
                <div className="flex flex-col gap-6">

                    {/* 上部：基础设施监控 */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center justify-between">
                            <span className="flex items-center gap-2"><Server className="w-5 h-5 text-indigo-500"/> 基础设施监控</span>
                            <span className="flex h-2.5 w-2.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                        </h3>
                        <div className="space-y-3">
                            {stats.infraStatus?.map((infra: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-800 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${infra.bg} ${infra.color}`}>
                                            {infra.name === 'PostgreSQL' ? <Database className="w-4 h-4" /> :
                                                infra.name.includes('Redis') ? <Zap className="w-4 h-4" /> :
                                                    <HardDrive className="w-4 h-4" />}
                                        </div>
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{infra.name}</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {infra.status}
                                        </div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">{infra.metric}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 下部：系统真实业务动态 (隐私脱敏) */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex-1 overflow-hidden flex flex-col">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">实时业务动态</h3>
                        <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar">
                            {stats.systemLogs.map((log: any, i: number) => (
                                <div key={i} className="flex items-start gap-3.5 relative group">
                                    <div className={`w-2.5 h-2.5 mt-1.5 rounded-full flex-shrink-0 z-10 outline outline-4 outline-white dark:outline-slate-800 ${log.type === 'sys' ? 'bg-orange-500' : 'bg-indigo-500'}`}></div>
                                    {/* 连接线 */}
                                    {i !== stats.systemLogs.length - 1 && <div className="absolute left-[4px] top-[14px] bottom-[-24px] w-px bg-slate-100 dark:bg-slate-700"></div>}

                                    <div className="pb-1">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug">{log.msg}</p>
                                        <p className="text-xs text-slate-400 mt-1">{log.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}