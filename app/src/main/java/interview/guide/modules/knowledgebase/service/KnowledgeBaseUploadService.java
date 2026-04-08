package interview.guide.modules.knowledgebase.service;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.infrastructure.file.FileHashService;
import interview.guide.infrastructure.file.FileStorageService;
import interview.guide.infrastructure.file.FileValidationService;
import interview.guide.modules.knowledgebase.listener.VectorizeStreamProducer;
import interview.guide.modules.knowledgebase.model.KnowledgeBaseEntity;
import interview.guide.modules.knowledgebase.model.VectorStatus;
import interview.guide.modules.knowledgebase.repository.KnowledgeBaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeBaseUploadService {

    private final KnowledgeBaseParseService parseService;
    private final KnowledgeBasePersistenceService persistenceService;
    private final FileStorageService storageService;
    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final FileValidationService fileValidationService;
    private final FileHashService fileHashService;
    private final VectorizeStreamProducer vectorizeStreamProducer;

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    // 💡 增加 userId 参数
    public Map<String, Object> uploadKnowledgeBase(MultipartFile file, String name, String category, Long userId) {
        fileValidationService.validateFile(file, MAX_FILE_SIZE, "知识库");

        String fileName = file.getOriginalFilename();
        String contentType = parseService.detectContentType(file);
        validateContentType(contentType, fileName);

        // 💡 基于该用户隔离去重
        String fileHash = fileHashService.calculateHash(file);
        Optional<KnowledgeBaseEntity> existingKb = knowledgeBaseRepository.findByFileHashAndUserId(fileHash, userId);
        if (existingKb.isPresent()) {
            return persistenceService.handleDuplicateKnowledgeBase(existingKb.get(), fileHash);
        }

        String content = parseService.parseContent(file);
        if (content == null || content.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "无法提取文本内容");
        }

        String fileKey = storageService.uploadKnowledgeBase(file);
        String fileUrl = storageService.getFileUrl(fileKey);

        // 💡 传入 userId 持久化
        KnowledgeBaseEntity savedKb = persistenceService.saveKnowledgeBase(file, name, category, fileKey, fileUrl, fileHash, userId);
        vectorizeStreamProducer.sendVectorizeTask(savedKb.getId(), content);

        return Map.of(
                "knowledgeBase", Map.of(
                        "id", savedKb.getId(),
                        "name", savedKb.getName(),
                        "category", savedKb.getCategory() != null ? savedKb.getCategory() : "",
                        "fileSize", savedKb.getFileSize(),
                        "vectorStatus", VectorStatus.PENDING.name()
                ),
                "storage", Map.of("fileKey", fileKey, "fileUrl", fileUrl),
                "duplicate", false
        );
    }

    private void validateContentType(String contentType, String fileName) {
        fileValidationService.validateContentType(
                contentType, fileName, fileValidationService::isKnowledgeBaseMimeType,
                fileValidationService::isMarkdownExtension, "不支持的文件类型"
        );
    }

    public void revectorize(Long kbId, Long userId) {
        KnowledgeBaseEntity kb = knowledgeBaseRepository.findById(kbId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "知识库不存在"));

        if (!kb.getUserId().equals(userId)) throw new BusinessException(ErrorCode.UNAUTHORIZED, "无权操作");

        String content = parseService.downloadAndParseContent(kb.getStorageKey(), kb.getOriginalFilename());
        persistenceService.updateVectorStatusToPending(kbId);
        vectorizeStreamProducer.sendVectorizeTask(kbId, content);
    }
}