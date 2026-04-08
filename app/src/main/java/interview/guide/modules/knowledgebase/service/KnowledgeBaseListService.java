package interview.guide.modules.knowledgebase.service;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.infrastructure.file.FileStorageService;
import interview.guide.infrastructure.mapper.KnowledgeBaseMapper;
import interview.guide.modules.knowledgebase.model.KnowledgeBaseEntity;
import interview.guide.modules.knowledgebase.model.KnowledgeBaseListItemDTO;
import interview.guide.modules.knowledgebase.model.KnowledgeBaseStatsDTO;
import interview.guide.modules.knowledgebase.model.VectorStatus;
import interview.guide.modules.knowledgebase.repository.KnowledgeBaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 知识库查询服务
 * 负责知识库列表和详情的查询（全面接入 userId 隔离与内存计算）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeBaseListService {

    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final KnowledgeBaseMapper knowledgeBaseMapper;
    private final FileStorageService fileStorageService;

    /**
     * 获取知识库列表（支持状态过滤和排序，加入 userId 隔离）
     */
    public List<KnowledgeBaseListItemDTO> listKnowledgeBases(VectorStatus vectorStatus, String sortBy, Long userId) {
        // 1. 仅获取该用户的数据
        List<KnowledgeBaseEntity> entities = knowledgeBaseRepository.findByUserId(userId);

        // 2. 内存状态过滤
        if (vectorStatus != null) {
            entities = entities.stream()
                    .filter(e -> e.getVectorStatus() == vectorStatus)
                    .collect(Collectors.toList());
        }

        // 3. 内存排序
        entities = sortEntities(entities, sortBy != null && !sortBy.isBlank() ? sortBy : "time");

        return knowledgeBaseMapper.toListItemDTOList(entities);
    }

    /**
     * 根据ID获取知识库详情（加入防越权判定）
     */
    public Optional<KnowledgeBaseListItemDTO> getKnowledgeBase(Long id, Long userId) {
        return knowledgeBaseRepository.findById(id)
                .filter(kb -> kb.getUserId().equals(userId)) // 💡 只有自己的才能查到
                .map(knowledgeBaseMapper::toListItemDTO);
    }

    /**
     * 根据ID获取知识库实体（用于删除等操作，防越权）
     */
    public Optional<KnowledgeBaseEntity> getKnowledgeBaseEntity(Long id, Long userId) {
        return knowledgeBaseRepository.findById(id)
                .filter(kb -> kb.getUserId().equals(userId));
    }

    // ========== 分类管理 ==========

    /**
     * 获取当前用户的所有分类（内存去重聚合，避免 JPA 缺少 Distinct 方法）
     */
    public List<String> getAllCategories(Long userId) {
        return knowledgeBaseRepository.findByUserId(userId).stream()
                .map(KnowledgeBaseEntity::getCategory)
                .filter(category -> category != null && !category.isBlank())
                .distinct()
                .collect(Collectors.toList());
    }

    /**
     * 根据分类获取当前用户的知识库列表（内存过滤）
     */
    public List<KnowledgeBaseListItemDTO> listByCategory(String category, Long userId) {
        List<KnowledgeBaseEntity> entities = knowledgeBaseRepository.findByUserId(userId);

        if (category == null || category.isBlank()) {
            entities = entities.stream()
                    .filter(e -> e.getCategory() == null || e.getCategory().isBlank())
                    .collect(Collectors.toList());
        } else {
            entities = entities.stream()
                    .filter(e -> category.equals(e.getCategory()))
                    .collect(Collectors.toList());
        }

        // 默认按时间倒序
        entities = sortEntities(entities, "time");
        return knowledgeBaseMapper.toListItemDTOList(entities);
    }

    /**
     * 更新知识库分类
     */
    @Transactional
    public void updateCategory(Long id, String category, Long userId) {
        KnowledgeBaseEntity entity = knowledgeBaseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "知识库不存在"));

        // 💡 越权检查
        if (!entity.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "无权修改该知识库分类");
        }

        entity.setCategory(category != null && !category.isBlank() ? category : null);
        knowledgeBaseRepository.save(entity);
        log.info("更新知识库分类: id={}, category={}, userId={}", id, category, userId);
    }

    // ========== 搜索功能 ==========

    /**
     * 按关键词搜索该用户的知识库（内存正则过滤）
     */
    public List<KnowledgeBaseListItemDTO> search(String keyword, Long userId) {
        List<KnowledgeBaseEntity> entities = knowledgeBaseRepository.findByUserId(userId);

        if (keyword != null && !keyword.isBlank()) {
            String lowerKeyword = keyword.trim().toLowerCase();
            entities = entities.stream()
                    .filter(e -> e.getName() != null && e.getName().toLowerCase().contains(lowerKeyword))
                    .collect(Collectors.toList());
        }

        entities = sortEntities(entities, "time");
        return knowledgeBaseMapper.toListItemDTOList(entities);
    }

    // ========== 排序功能 ==========

    /**
     * 在内存中对实体列表排序
     */
    private List<KnowledgeBaseEntity> sortEntities(List<KnowledgeBaseEntity> entities, String sortBy) {
        return switch (sortBy.toLowerCase()) {
            case "size" -> entities.stream()
                    .sorted((a, b) -> Long.compare(
                            b.getFileSize() != null ? b.getFileSize() : 0,
                            a.getFileSize() != null ? a.getFileSize() : 0))
                    .collect(Collectors.toList());
            case "access" -> entities.stream()
                    .sorted((a, b) -> Integer.compare(
                            b.getAccessCount() != null ? b.getAccessCount() : 0,
                            a.getAccessCount() != null ? a.getAccessCount() : 0))
                    .collect(Collectors.toList());
            case "question" -> entities.stream()
                    .sorted((a, b) -> Integer.compare(
                            b.getQuestionCount() != null ? b.getQuestionCount() : 0,
                            a.getQuestionCount() != null ? a.getQuestionCount() : 0))
                    .collect(Collectors.toList());
            default -> entities.stream() // 默认 "time"
                    .sorted((a, b) -> b.getUploadedAt().compareTo(a.getUploadedAt()))
                    .collect(Collectors.toList());
        };
    }

    // ========== 统计功能 ==========

    /**
     * 获取用户的知识库统计信息（纯内存聚合，确保不报 Repository SQL 错误）
     */
    public KnowledgeBaseStatsDTO getStatistics(Long userId) {
        List<KnowledgeBaseEntity> list = knowledgeBaseRepository.findByUserId(userId);

        long totalCount = list.size();

        // 提问次数与访问次数求和
        long totalQuestions = list.stream()
                .mapToLong(k -> k.getQuestionCount() != null ? k.getQuestionCount() : 0)
                .sum();
        long totalAccess = list.stream()
                .mapToLong(k -> k.getAccessCount() != null ? k.getAccessCount() : 0)
                .sum();

        // 状态统计
        long completed = list.stream()
                .filter(k -> k.getVectorStatus() == VectorStatus.COMPLETED)
                .count();
        long processing = list.stream()
                .filter(k -> k.getVectorStatus() == VectorStatus.PROCESSING)
                .count();

        return new KnowledgeBaseStatsDTO(totalCount, totalQuestions, totalAccess, completed, processing);
    }

    // ========== 下载功能 ==========

    /**
     * 下载知识库文件
     */
    public byte[] downloadFile(Long id, Long userId) {
        KnowledgeBaseEntity entity = getEntityForDownload(id, userId);

        String storageKey = entity.getStorageKey();
        if (storageKey == null || storageKey.isBlank()) {
            throw new BusinessException(ErrorCode.STORAGE_DOWNLOAD_FAILED, "文件存储信息不存在");
        }

        log.info("下载知识库文件: id={}, filename={}, userId={}", id, entity.getOriginalFilename(), userId);
        return fileStorageService.downloadFile(storageKey);
    }

    /**
     * 获取知识库文件信息（用于下载，附带越权拦截）
     */
    public KnowledgeBaseEntity getEntityForDownload(Long id, Long userId) {
        KnowledgeBaseEntity entity = knowledgeBaseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.KNOWLEDGE_BASE_NOT_FOUND, "知识库不存在"));

        // 💡 越权检查
        if (!entity.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "无权下载该文件");
        }

        return entity;
    }
}