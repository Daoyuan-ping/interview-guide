package interview.guide.modules.knowledgebase.service;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.knowledgebase.model.KnowledgeBaseEntity;
import interview.guide.modules.knowledgebase.model.QueryRequest;
import interview.guide.modules.knowledgebase.model.QueryResponse;
import interview.guide.modules.knowledgebase.repository.KnowledgeBaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;

/**
 * 知识库查询与问答服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeBaseQueryService {

    // 💡 注意：这里去掉了 RagChatSessionService，打破了循环依赖！
    // 如果你有 LlmClient 等其他大模型调用组件，请自行保留在这里
    private final KnowledgeBaseRepository knowledgeBaseRepository;

    /**
     * 校验传入的知识库 ID 是否都属于当前用户，防止越权查询
     */
    private void validateKnowledgeBaseOwnership(List<Long> kbIds, Long userId) {
        if (kbIds == null || kbIds.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "必须提供至少一个知识库ID");
        }

        List<KnowledgeBaseEntity> kbList = knowledgeBaseRepository.findAllById(kbIds);

        if (kbList.size() != kbIds.size()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "部分知识库不存在");
        }

        for (KnowledgeBaseEntity kb : kbList) {
            if (!kb.getUserId().equals(userId)) {
                log.warn("用户越权访问知识库尝试拦截: userId={}, kbId={}", userId, kb.getId());
                throw new BusinessException(ErrorCode.UNAUTHORIZED, "您无权向不属于您的知识库提问");
            }
        }
    }

    /**
     * 同步查询知识库并回答
     */
    public QueryResponse queryKnowledgeBase(QueryRequest request, Long userId) {
        log.info("收到知识库问答请求: userId={}, kbIds={}", userId, request.knowledgeBaseIds());

        // 1. 安全越权拦截
        validateKnowledgeBaseOwnership(request.knowledgeBaseIds(), userId);

        // --- 下面是你原有的 RAG 检索与大模型回答逻辑 ---
        // 2. 将问题进行向量检索
        // String context = vectorSearchService.searchContext(request.knowledgeBaseIds(), request.question());

        // 3. 调用大模型
        // String answer = llmClient.ask(request.question(), context);

        // 占位返回，请保留或替换为你实际的返回构建逻辑
        return new QueryResponse("这是回答的占位符，请接入你实际的大模型逻辑", request.knowledgeBaseIds().get(0), "知识库名称");
    }

    /**
     * 流式查询知识库并回答
     */
    public Flux<String> answerQuestionStream(List<Long> kbIds, String question, Long userId) {
        log.info("收到知识库流式问答请求: userId={}, kbIds={}", userId, kbIds);

        // 1. 安全越权拦截
        validateKnowledgeBaseOwnership(kbIds, userId);

        // --- 下面是你原有的流式 RAG 逻辑 ---
        // String context = vectorSearchService.searchContext(kbIds, question);
        // return llmClient.askStream(question, context);

        // 占位返回，请替换为你实际的 Flux 构建逻辑
        return Flux.just("data: 这是一条来自大模型的流式测试数据。\\n\\n", "data: 恭喜你，前后端链路已彻底打通且数据完全隔离！\\n\\n");
    }
}