import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { User, Shield, ShieldAlert, Key, Ban, CheckCircle } from 'lucide-react';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = () => {
        setLoading(true);
        adminApi.getUserList()
            .then((res: any) => {

                let actualData = [];

                // 💡 自动拨茧逻辑：无论你的拦截器剥了几层皮，我们都找到那个数组
                if (Array.isArray(res)) {
                    // 情况1：拦截器已经剥到了最里层数组
                    actualData = res;
                } else if (res.data && Array.isArray(res.data)) {
                    // 情况2：res 是 { code: 200, data: [...], success: true }
                    actualData = res.data;
                } else if (res.data?.data && Array.isArray(res.data.data)) {
                    // 情况3：res 是 Axios 原始对象，数组在 res.data.data
                    actualData = res.data.data;
                }

                setUsers(actualData);
            })
            .catch(err => {
                console.error("加载失败:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleToggleStatus = async (user: any) => {
        const newStatus = user.status === 'BANNED' ? 'NORMAL' : 'BANNED';
        if (!window.confirm(`确定要${newStatus === 'BANNED' ? '封禁' : '解封'}用户 ${user.username} 吗？`)) return;

        // Removed adminId here
        await adminApi.updateUserStatus(user.id, newStatus);
        fetchUsers();
    };

    const handleResetPassword = async (user: any) => {
        const newPass = window.prompt(`请输入用户 ${user.username} 的新密码:`, "12345678");
        if (newPass) {
            // Removed adminId here
            await adminApi.resetUserPassword(user.id, newPass);
            alert("密码已重置");
        }
    };

    const handleToggleRole = async (user: any) => {
        const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
        if (!window.confirm(`确定将 ${user.username} 设置为 ${newRole} 吗？`)) return;

        // Removed adminId here
        await adminApi.updateUserRole(user.id, newRole);
        fetchUsers();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">用户权限管理</h2>
                <div className="text-sm text-slate-500">共 {users.length} 名注册用户</div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">用户信息</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">角色</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">注册时间</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">面试次数</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">状态</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-sm">
                                        {user.avatarUrl ? (
                                            <img
                                                src={user.avatarUrl}
                                                alt={user.username}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // 如果图片加载失败（比如 Key 过期），回退到默认图标
                                                    (e.target as HTMLImageElement).src = "";
                                                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-slate-400"><svg ...></svg></div>';
                                                }}
                                            />
                                        ) : (
                                            // 默认头像图标
                                            <User className="w-5 h-5 text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800 dark:text-white">{user.username}</div>
                                        <div className="text-xs text-slate-400">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit ${
                                        user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10' : 'bg-slate-100 text-slate-600 dark:bg-slate-700'
                                    }`}>
                                        {user.role === 'ADMIN' ? <Shield className="w-3 h-3"/> : <User className="w-3 h-3"/>}
                                        {user.role}
                                    </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{user.interviewCount} 次</td>
                            <td className="px-6 py-4">
                                <div className="flex justify-center">
                                    {user.status === 'BANNED' ?
                                        <span className="text-red-500 flex items-center gap-1 text-xs font-bold"><ShieldAlert className="w-3 h-3"/> 已封禁</span> :
                                        <span className="text-emerald-500 flex items-center gap-1 text-xs font-bold"><CheckCircle className="w-3 h-3"/> 正常</span>
                                    }
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleResetPassword(user)} title="重置密码" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Key className="w-4 h-4"/></button>
                                    <button onClick={() => handleToggleRole(user)} title="切换角色" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"><Shield className="w-4 h-4"/></button>
                                    <button onClick={() => handleToggleStatus(user)} title={user.status === 'BANNED' ? '解封' : '封禁'} className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors ${user.status === 'BANNED' ? 'text-emerald-500' : 'text-slate-400 hover:text-red-500'}`}>
                                        {user.status === 'BANNED' ? <CheckCircle className="w-4 h-4"/> : <Ban className="w-4 h-4"/>}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                {loading && <div className="p-10 text-center text-slate-400">加载中...</div>}
                {!loading && users.length === 0 && <div className="p-10 text-center text-slate-400">暂无注册用户</div>}
            </div>
        </div>
    );
}