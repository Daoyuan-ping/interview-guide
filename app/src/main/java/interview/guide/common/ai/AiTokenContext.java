package interview.guide.common.ai;

/**
 * AI Token 线程上下文记录器
 * 用于无侵入式地收集底层 AI 调用消耗的 Token
 */
public class AiTokenContext {
    private static final ThreadLocal<Integer> TOKEN_HOLDER = ThreadLocal.withInitial(() -> 0);

    // 累加 Token
    public static void addTokens(int tokens) {
        TOKEN_HOLDER.set(TOKEN_HOLDER.get() + tokens);
    }

    // 获取并清空当前线程的 Token（业务层保存后调用）
    public static int getAndClear() {
        int tokens = TOKEN_HOLDER.get();
        TOKEN_HOLDER.remove();
        return tokens;
    }

    // 仅清空
    public static void clear() {
        TOKEN_HOLDER.remove();
    }
}