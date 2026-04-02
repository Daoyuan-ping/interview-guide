import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import type { InterviewQuestion, InterviewSession } from '../types/interview';
import { Send, User, Mic, MicOff, AlertCircle } from 'lucide-react'; // 新增了 Mic, MicOff, AlertCircle

interface Message {
  type: 'interviewer' | 'user';
  content: string;
  category?: string;
  questionIndex?: number;
}

interface InterviewChatPanelProps {
  session: InterviewSession;
  currentQuestion: InterviewQuestion | null;
  messages: Message[];
  answer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  onCompleteEarly: () => void;
  isSubmitting: boolean;
  showCompleteConfirm: boolean;
  onShowCompleteConfirm: (show: boolean) => void;
}

/**
 * 面试聊天面板组件 (支持语音输入)
 */
export default function InterviewChatPanel({
                                             session,
                                             currentQuestion,
                                             messages,
                                             answer,
                                             onAnswerChange,
                                             onSubmit,
                                             isSubmitting,
                                             onShowCompleteConfirm
                                           }: InterviewChatPanelProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // --- 语音识别相关状态与 Ref ---
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const answerBeforeRecordRef = useRef(""); // 记录开始录音前的文本，方便无缝追加
  // 使用 ref 保存最新的 onAnswerChange，避免在 useEffect 中引起频繁重绑
  const onAnswerChangeRef = useRef(onAnswerChange);

  useEffect(() => {
    onAnswerChangeRef.current = onAnswerChange;
  }, [onAnswerChange]);

  // 初始化 Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;     // 持续监听，直到手动停止
    recognition.interimResults = true; // 返回临时结果，实现“边说边上屏”效果
    recognition.lang = 'zh-CN';        // 设置为中文识别

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }

      // 将新识别的内容追加到原有内容之后
      const prevAnswer = answerBeforeRecordRef.current;
      const separator = prevAnswer && !prevAnswer.endsWith(' ') && !prevAnswer.endsWith('，') && !prevAnswer.endsWith('。') ? ' ' : '';

      onAnswerChangeRef.current(prevAnswer + separator + currentTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("语音识别错误:", event.error);
      if (event.error !== 'no-speech') {
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      // 浏览器可能会自动中断，这里确保状态同步
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      // 开始录音前，把当前文本框的内容存起来
      answerBeforeRecordRef.current = answer;
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("启动录音失败", e);
      }
    }
  }, [isRecording, answer]);

  // ------------------------------

  const progress = useMemo(() => {
    if (!session || !currentQuestion) return 0;
    return ((currentQuestion.questionIndex + 1) / session.totalQuestions) * 100;
  }, [session, currentQuestion]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      onSubmit();
    }
  };

  return (
      <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto">
        {/* 进度条 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-4 shadow-sm dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            题目 {currentQuestion ? currentQuestion.questionIndex + 1 : 0} / {session.totalQuestions}
          </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
            {Math.round(progress)}%
          </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* 聊天区域 */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-slate-900/50 overflow-hidden flex flex-col min-h-0 border border-slate-100 dark:border-slate-700">
          <Virtuoso
              ref={virtuosoRef}
              data={messages}
              initialTopMostItemIndex={messages.length - 1}
              followOutput="smooth"
              className="flex-1"
              itemContent={(_index, msg) => (
                  <div className="pb-4 px-6 first:pt-6">
                    <MessageBubble message={msg} />
                  </div>
              )}
          />

          {/* 浏览器不支持语音的提示 */}
          {!isSpeechSupported && (
              <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2 border-t border-amber-100 dark:border-amber-800/50">
                <AlertCircle className="w-4 h-4" />
                您的浏览器当前不支持语音输入功能（推荐使用 Chrome 或 Edge 浏览器）。
              </div>
          )}

          {/* 输入区域 */}
          <div className="border-t border-slate-200 dark:border-slate-600 p-4 bg-slate-50 dark:bg-slate-700/50">
            <div className="flex gap-3">
            <textarea
                value={answer}
                onChange={(e) => onAnswerChange(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={isRecording ? "正在聆听中，请讲话..." : "输入你的回答... (Ctrl/Cmd + Enter 提交)"}
                className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent resize-none bg-white dark:bg-slate-800 transition-all ${
                    isRecording
                        ? 'border-emerald-400 ring-2 ring-emerald-400/20 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-300 dark:border-slate-500 focus:ring-primary-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500'
                }`}
                rows={3}
                disabled={isSubmitting}
            />
              <div className="flex flex-col gap-2 min-w-[120px]">

                {/* 语音按钮 */}
                {isSpeechSupported && (
                    <motion.button
                        onClick={toggleRecording}
                        disabled={isSubmitting}
                        className={`px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                            isRecording
                                ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
                        }`}
                        whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      {isRecording ? '停止录音' : '语音输入'}
                    </motion.button>
                )}

                {/* 提交按钮 */}
                <motion.button
                    onClick={onSubmit}
                    disabled={!answer.trim() || isSubmitting}
                    className="px-4 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    whileHover={{ scale: isSubmitting || !answer.trim() ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting || !answer.trim() ? 1 : 0.98 }}
                >
                  {isSubmitting ? (
                      <>
                        <motion.div
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        提交中
                      </>
                  ) : (
                      <>
                        <Send className="w-4 h-4" />
                        提交
                      </>
                  )}
                </motion.button>

                {/* 提前交卷按钮 */}
                <button
                    onClick={() => onShowCompleteConfirm(true)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  提前交卷
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

// 消息气泡组件 (保持原样)
function MessageBubble({ message }: { message: Message }) {
  if (message.type === 'interviewer') {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3"
        >
          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-primary-600 dark:text-primary-400"/>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">面试官</span>
              {message.category && (
                  <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs rounded-full">
                {message.category}
              </span>
              )}
            </div>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-tl-none p-4 text-slate-800 dark:text-slate-200 leading-relaxed">
              {message.content}
            </div>
          </div>
        </motion.div>
    );
  }

  return (
      <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-3 justify-end"
      >
        <div className="flex-1 max-w-[80%]">
          <div className="bg-primary-500 text-white rounded-2xl rounded-tr-none p-4 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" viewBox="0 0 24 24" fill="none">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </motion.div>
  );
}