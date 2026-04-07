import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Mail, User as UserIcon, Phone, Briefcase, FileText, Calendar } from 'lucide-react';
import { getUserInfo, uploadAvatar, updatePassword, updateProfile } from '../api/user';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface UserInfo {
    username: string;
    email: string;
    avatarUrl?: string;
    phone?: string;
    targetPosition?: string;
    bio?: string;
    createdAt?: string;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const aiUserStr = localStorage.getItem('ai_user');
    const aiUser = aiUserStr ? JSON.parse(aiUserStr) : null;
    const userId = aiUser?.userId;

    useEffect(() => {
        if (isOpen && userId) {
            getUserInfo(userId).then((res: any) => {
                setUserInfo(res.data || res);
            }).catch(err => {
                console.error("获取用户信息失败", err);
            });
        }
    }, [isOpen, userId]);

    if (!isOpen) return null;

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && userId) {
            try {
                const res: any = await uploadAvatar(userId, file);
                const newAvatarUrl = res.data || res;
                setUserInfo(prev => prev ? { ...prev, avatarUrl: newAvatarUrl } : null);

                localStorage.setItem('userAvatar', newAvatarUrl);
                window.dispatchEvent(new Event('avatarUpdated'));
            } catch (error) {
                alert('上传头像失败');
            }
        }
    };

    // 保存基础资料
    const handleProfileSubmit = async () => {
        if (!userId || !userInfo) return;
        setIsSaving(true);
        try {
            await updateProfile({
                userId,
                phone: userInfo.phone,
                targetPosition: userInfo.targetPosition,
                bio: userInfo.bio
            });
            alert('个人资料保存成功');
        } catch (error) {
            alert('保存失败，请重试');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordSubmit = async () => {
        if (passwords.new !== passwords.confirm) return alert('两次输入的新密码不一致');
        if (!userId) return;
        try {
            await updatePassword(userId, passwords.old, passwords.new);
            alert('密码修改成功，请重新登录');
            onClose();
            localStorage.clear();
            window.location.href = '/login';
        } catch (error: any) {
            alert(error.message || '修改失败');
        }
    };

    // 格式化时间
    const formatDate = (dateString?: string) => {
        if (!dateString) return '未知';
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700 shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">个人中心</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 dark:border-slate-700 shrink-0">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'profile' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        基础信息
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'security' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        安全设置
                    </button>
                </div>

                {/* Content (允许滚动) */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {activeTab === 'profile' && userInfo && (
                        <div className="space-y-6">
                            {/* Avatar Upload */}
                            <div className="flex flex-col items-center gap-3">
                                <div
                                    onClick={handleAvatarClick}
                                    className="relative w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center cursor-pointer overflow-hidden group border-4 border-white dark:border-slate-800 shadow-lg"
                                >
                                    {userInfo.avatarUrl ? (
                                        <img src={userInfo.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-10 h-10 text-slate-400" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500">点击更换头像</span>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>

                            {/* Info Form */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">用户名</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input type="text" disabled value={userInfo.username || ''} className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 cursor-not-allowed text-sm" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">加入时间</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input type="text" disabled value={formatDate(userInfo.createdAt)} className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 cursor-not-allowed text-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">邮箱地址 (不可修改)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type="email" disabled value={userInfo.email || ''} className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 cursor-not-allowed text-sm" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">联系电话</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={userInfo.phone || ''}
                                            onChange={e => setUserInfo({...userInfo, phone: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm dark:text-slate-200"
                                            placeholder="请输入手机号"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">目标岗位 / 求职意向</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={userInfo.targetPosition || ''}
                                            onChange={e => setUserInfo({...userInfo, targetPosition: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm dark:text-slate-200"
                                            placeholder="例如：Java后端开发工程师"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">个人简介</label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <textarea
                                            value={userInfo.bio || ''}
                                            onChange={e => setUserInfo({...userInfo, bio: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none min-h-[80px] resize-none text-sm dark:text-slate-200"
                                            placeholder="简单介绍一下你的优势或求职宣言..."
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleProfileSubmit}
                                    disabled={isSaving}
                                    className="w-full py-2.5 mt-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? '保存中...' : '保存修改'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">原密码</label>
                                <input
                                    type="password"
                                    value={passwords.old}
                                    onChange={e => setPasswords({...passwords, old: e.target.value})}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:text-slate-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">新密码</label>
                                <input
                                    type="password"
                                    value={passwords.new}
                                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:text-slate-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">确认新密码</label>
                                <input
                                    type="password"
                                    value={passwords.confirm}
                                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:text-slate-200"
                                />
                            </div>
                            <button
                                onClick={handlePasswordSubmit}
                                className="w-full py-2.5 mt-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                            >
                                确认修改
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}