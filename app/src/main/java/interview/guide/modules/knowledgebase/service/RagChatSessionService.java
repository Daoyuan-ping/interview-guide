package interview.guide.modules.knowledgebase.service;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.infrastructure.mapper.KnowledgeBaseMapper;
import interview.guide.infrastructure.mapper.RagChatMapper;
import interview.guide.modules.knowledgebase.model.KnowledgeBaseEntity;
import interview.guide.modules.knowledgebase.model.KnowledgeBaseListItemDTO;
import interview.guide.modules.knowledgebase.model.RagChatDTO.CreateSessionRequest;
import interview.guide.modules.knowledgebase.model.RagChatDTO.SessionDTO;
import interview.guide.modules.knowledgebase.model.RagChatDTO.SessionDetailDTO;
import interview.guide.modules.knowledgebase.model.RagChatDTO.SessionListItemDTO;
import interview.guide.modules.knowledgebase.model.RagChatMessageEntity;
import interview.guide.modules.knowledgebase.model.RagChatSessionEntity;
import interview.guide.modules.knowledgebase.repository.KnowledgeBaseRepository;
import interview.guide.modules.knowledgebase.repository.RagChatMessageRepository;
import interview.guide.modules.knowledgebase.repository.RagChatSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;

import java.util.HashSet;
import java.util.List;

/**
 * RAG 聊天会话服务
 * 提供RAG聊天会话的创建、获取、更新、删除等操作（全面接入用户隔离）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RagChatSessionService {

    private final RagChatSessionRepository sessionRepository;
    private final RagChatMessageRepository messageRepository;
    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final KnowledgeBaseQueryService queryService;
    private final RagChatMapper ragChatMapper;
    private final KnowledgeBaseMapper knowledgeBaseMapper;

    /**
     * 创建新会话
     */
    @Transactional
    public SessionDTO createSession(CreateSessionRequest request, Long userId) {
        List<KnowledgeBaseEntity> knowledgeBases = knowledgeBaseRepository
                .findAllById(request.knowledgeBaseIds());

        if (knowledgeBases.size() != request.knowledgeBaseIds().size()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "部分知识库不存在");
        }

        // 💡 知识库越权校验
        for (KnowledgeBaseEntity kb : knowledgeBases) {
            if (!kb.getUserId().equals(userId)) {
                throw new BusinessException(ErrorCode.UNAUTHORIZED, "无法使用不属于您的知识库创建会话");
            }
        }

        RagChatSessionEntity session = new RagChatSessionEntity();
        session.setUserId(userId); // 💡 绑定该会话给当前用户
        session.setTitle(request.title() != null && !request.title().isBlank()
                ? request.title()
                : generateTitle(knowledgeBases));
        session.setKnowledgeBases(new HashSet<>(knowledgeBases));

        session = sessionRepository.save(session);
        log.info("创建 RAG 聊天会话: id={}, title={}, userId={}", session.getId(), session.getTitle(), userId);

        return ragChatMapper.toSessionDTO(session);
    }

    /**
     * 获取当前用户的会话列表 (使用内存过滤防 Repository 报错)
     */
    public List<SessionListItemDTO> listSessions(Long userId) {
        return sessionRepository.findAllOrderByPinnedAndUpdatedAtDesc()
                .stream()
                .filter(session -> userId.equals(session.getUserId())) // 💡 仅保留当前用户的会话
                .map(ragChatMapper::toSessionListItemDTO)
                .toList();
    }

    /**
     * 获取会话详情（包含消息）
     */
    public SessionDetailDTO getSessionDetail(Long sessionId, Long userId) {
        RagChatSessionEntity session = sessionRepository
                .findByIdWithKnowledgeBases(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "会话不存在"));

        if (!session.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "无权访问此会话");
        }

        List<RagChatMessageEntity> messages = messageRepository
                .findBySessionIdOrderByMessageOrderAsc(sessionId);

        List<KnowledgeBaseListItemDTO> kbDTOs = knowledgeBaseMapper.toListItemDTOList(
                new java.util.ArrayList<>(session.getKnowledgeBases())
        );

        return ragChatMapper.toSessionDetailDTO(session, messages, kbDTOs);
    }

    /**
     * 准备流式消息
     */
    @Transactional
    public Long prepareStreamMessage(Long sessionId, String question, Long userId) {
        RagChatSessionEntity session = sessionRepository.findByIdWithKnowledgeBases(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "会话不存在"));

        if (!session.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "无权操作此会话");
        }

        int nextOrder = session.getMessageCount();

        RagChatMessageEntity userMessage = new RagChatMessageEntity();
        userMessage.setSession(session);
        userMessage.setType(RagChatMessageEntity.MessageType.USER);
        userMessage.setContent(question);
        userMessage.setMessageOrder(nextOrder);
        userMessage.setCompleted(true);
        messageRepository.save(userMessage);

        RagChatMessageEntity assistantMessage = new RagChatMessageEntity();
        assistantMessage.setSession(session);
        assistantMessage.setType(RagChatMessageEntity.MessageType.ASSISTANT);
        assistantMessage.setContent("");
        assistantMessage.setMessageOrder(nextOrder + 1);
        assistantMessage.setCompleted(false);
        assistantMessage = messageRepository.save(assistantMessage);

        session.setMessageCount(nextOrder + 2);
        sessionRepository.save(session);

        return assistantMessage.getId();
    }

    @Transactional
    public void completeStreamMessage(Long messageId, String content) {
        RagChatMessageEntity message = messageRepository.findById(messageId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "消息不存在"));
        message.setContent(content);
        message.setCompleted(true);
        messageRepository.save(message);
    }

    /**
     * 获取流式回答
     * 💡 修复了报错，正确传入 3 个参数
     */
    public Flux<String> getStreamAnswer(Long sessionId, String question, Long userId) {
        RagChatSessionEntity session = sessionRepository.findByIdWithKnowledgeBases(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "会话不存在"));

        if (!session.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "无权操作此会话");
        }

        List<Long> kbIds = session.getKnowledgeBaseIds();

        // 💡 修复点：传入 userId
        return queryService.answerQuestionStream(kbIds, question, userId);
    }

    @Transactional
    public void updateSessionTitle(Long sessionId, String title, Long userId) {
        RagChatSessionEntity session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "会话不存在"));
        if (!session.getUserId().equals(userId)) throw new BusinessException(ErrorCode.UNAUTHORIZED, "无权操作");

        session.setTitle(title);
        sessionRepository.save(session);
    }

    @Transactional
    public void togglePin(Long sessionId, Long userId) {
        RagChatSessionEntity session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "会话不存在"));
        if (!session.getUserId().equals(userId)) throw new BusinessException(ErrorCode.UNAUTHORIZED, "无权操作");

        Boolean currentPinned = session.getIsPinned() != null ? session.getIsPinned() : false;
        session.setIsPinned(!currentPinned);
        sessionRepository.save(session);
    }

    @Transactional
    public void updateSessionKnowledgeBases(Long sessionId, List<Long> knowledgeBaseIds, Long userId) {
        RagChatSessionEntity session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "会话不存在"));
        if (!session.getUserId().equals(userId)) throw new BusinessException(ErrorCode.UNAUTHORIZED, "无权操作");

        List<KnowledgeBaseEntity> knowledgeBases = knowledgeBaseRepository.findAllById(knowledgeBaseIds);
        for (KnowledgeBaseEntity kb : knowledgeBases) {
            if (!kb.getUserId().equals(userId)) throw new BusinessException(ErrorCode.UNAUTHORIZED, "部分知识库不属于您");
        }

        session.setKnowledgeBases(new HashSet<>(knowledgeBases));
        sessionRepository.save(session);
    }

    @Transactional
    public void deleteSession(Long sessionId, Long userId) {
        RagChatSessionEntity session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "会话不存在"));
        if (!session.getUserId().equals(userId)) throw new BusinessException(ErrorCode.UNAUTHORIZED, "无权删除");

        sessionRepository.deleteById(sessionId);
    }

    private String generateTitle(List<KnowledgeBaseEntity> knowledgeBases) {
        if (knowledgeBases.isEmpty()) return "新对话";
        if (knowledgeBases.size() == 1) return knowledgeBases.getFirst().getName();
        return knowledgeBases.size() + " 个知识库对话";
    }
}