import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Database, CheckCircle2, Sparkles } from 'lucide-react';
import { knowledgeBaseApi } from '../api/knowledgebase';
import type { InterviewSession } from '../types/interview';

interface InterviewConfigPanelProps {
    questionCount: number;
    onQuestionCountChange: (count: number) => void;
    // 修改了这里的类型，传出选中的知识库 IDs
    onStart: (knowledgeBaseIds?: number[]) => void;
    isCreating: boolean;
    checkingUnfinished: boolean;
    unfinishedSession: InterviewSession | null;
    onContinueUnfinished: () => void;
    onStartNew: () => void;
    resumeText: string;
    onBack: () => void;
    error?: string;
}

export default function InterviewConfigPanel({
                                                 questionCount,
                                                 onQuestionCountChange,
                                                 onStart,
                                                 isCreating,
                                                 checkingUnfinished,
                                                 unfinishedSession,
                                                 onContinueUnfinished,
                                                 onStartNew,
                                                 resumeText,
                                                 onBack,
                                                 error
                                             }: InterviewConfigPanelProps) {
    const questionCounts = [3, 5, 7, 9, 12];

    // 知识库状态
    const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);
    const [selectedKbIds, setSelectedKbIds] = useState<number[]>([]);

    // 组件加载时获取知识库列表
    useEffect(() => {
        const fetchKbs = async () => {
            try {
                const res = await knowledgeBaseApi.getAllKnowledgeBases(undefined, 'COMPLETED');
                // res 本身就是数组，直接设置进去即可
                setKnowledgeBases(res || []);
            } catch (err) {
                console.error("加载知识库失败", err);
            }
        };
        fetchKbs();
    }, []);

    const toggleKbSelection = (id: number) => {
        setSelectedKbIds(prev =>
            prev.includes(id) ? prev.filter(kbId => kbId !== id) : [...prev, id]
        );
    };

    const handleStart = () => {
        onStart(selectedKbIds.length > 0 ? selectedKbIds : undefined);
    };

    return (
        <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    面试配置
                </h2>

                {/* 未完成面试提示 */}
                <AnimatePresence>
                    {checkingUnfinished && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-400 text-sm text-center"
                        >
                            正在检查是否有未完成的面试...
                        </motion.div>
                    )}

                    {unfinishedSession && !checkingUnfinished && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-200 dark:border-amber-800 rounded-xl"
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-1">检测到未完成的模拟面试</h3>
                                    <p className="text-sm text-amber-700 dark:text-amber-400">
                                        已完成 {unfinishedSession.currentQuestionIndex} / {unfinishedSession.totalQuestions} 题
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <motion.button
                                    onClick={onContinueUnfinished}
                                    className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    继续完成
                                </motion.button>
                                <motion.button
                                    onClick={onStartNew}
                                    className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-700 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 rounded-lg font-medium hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    开始新的
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                            题目数量
                        </label>
                        <div className="grid grid-cols-5 gap-3">
                            {questionCounts.map((count) => (
                                <motion.button
                                    key={count}
                                    onClick={() => onQuestionCountChange(count)}
                                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                                        questionCount === count
                                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {count}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* 定向知识库选择区域 */}
                    {knowledgeBases.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                定向题库特训 <span className="text-xs font-normal text-slate-400">（选填，AI将从选中的库中抽题）</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto scrollbar-custom p-1">
                                {knowledgeBases.map((kb) => {
                                    const isSelected = selectedKbIds.includes(kb.id);
                                    return (
                                        <div
                                            key={kb.id}
                                            onClick={() => toggleKbSelection(kb.id)}
                                            className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                                                isSelected
                                                    ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/20 dark:border-primary-700'
                                                    : 'bg-white border-slate-200 hover:border-primary-200 dark:bg-slate-800 dark:border-slate-600'
                                            }`}
                                        >
                                            <Database className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-primary-500' : 'text-slate-400'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {kb.name}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">简历预览（前500字）</label>
                        <textarea
                            value={resumeText.substring(0, 500) + (resumeText.length > 500 ? '...' : '')}
                            readOnly
                            className="w-full h-24 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-400 text-sm resize-none focus:outline-none"
                        />
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm"
                            >
                                ⚠️ {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex justify-center gap-4">
                        <motion.button
                            onClick={onBack}
                            className="px-6 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            ← 返回
                        </motion.button>
                        <motion.button
                            onClick={handleStart}
                            disabled={isCreating}
                            className="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                            whileHover={{ scale: isCreating ? 1 : 1.02 }}
                            whileTap={{ scale: isCreating ? 1 : 0.98 }}
                        >
                            {isCreating ? '正在生成题目...' : '开始面试 →'}
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}