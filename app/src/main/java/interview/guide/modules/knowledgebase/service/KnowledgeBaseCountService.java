package interview.guide.modules.knowledgebase.service;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.knowledgebase.model.KnowledgeBaseEntity;
import interview.guide.modules.knowledgebase.repository.KnowledgeBaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 知识库计数服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeBaseCountService {

    private final KnowledgeBaseRepository knowledgeBaseRepository;

    /**
     * 批量更新知识库提问计数（使用单条 SQL 批量更新）
     * 每个知识库的 questionCount +1，表示该知识库参与回答的次数
     *
     * @param knowledgeBaseIds 知识库ID列表
     * @param userId 当前用户ID (💡 新增安全隔离参数)
     */
    @Transactional(rollbackFor = Exception.class)
    public void updateQuestionCounts(List<Long> knowledgeBaseIds, Long userId) {
        if (knowledgeBaseIds == null || knowledgeBaseIds.isEmpty()) {
            return;
        }

        // 去重
        List<Long> uniqueIds = knowledgeBaseIds.stream().distinct().toList();

        // 💡 直接使用带有 userId 的单条 SQL 批量更新，既高效又安全
        int updated = knowledgeBaseRepository.incrementQuestionCountBatch(uniqueIds, userId);

        // 校验是否所有传入的 ID 都属于该用户并被更新
        if (updated != uniqueIds.size()) {
            log.warn("部分知识库不存在或无权访问: requested={}, updated={}, userId={}", uniqueIds.size(), updated, userId);
            // 视业务情况决定是否抛出异常
            // throw new BusinessException(ErrorCode.UNAUTHORIZED, "包含不存在或无权访问的知识库");
        }

        log.debug("批量更新知识库提问计数: ids={}, userId={}, updated={}", uniqueIds, userId, updated);
    }
}