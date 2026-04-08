package interview.guide.modules.resume.service;

import interview.guide.common.config.AppConfigProperties;
import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.common.model.AsyncTaskStatus;
import interview.guide.infrastructure.file.FileStorageService;
import interview.guide.infrastructure.file.FileValidationService;
import interview.guide.modules.interview.model.ResumeAnalysisResponse;
import interview.guide.modules.resume.listener.AnalyzeStreamProducer;
import interview.guide.modules.resume.model.ResumeEntity;
import interview.guide.modules.resume.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.util.Map;
import java.util.Optional;
/**
 * 简历上传服务
 * 处理简历上传、解析的业务逻辑
 * AI 分析改为异步处理，通过 Redis Stream 实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeUploadService {

    private final ResumeParseService parseService;
    private final FileStorageService storageService;
    private final ResumePersistenceService persistenceService;
    private final AppConfigProperties appConfig;
    private final FileValidationService fileValidationService;
    private final AnalyzeStreamProducer analyzeStreamProducer;
    private final ResumeRepository resumeRepository;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    // 💡 加入 userId 接收参数
    public Map<String, Object> uploadAndAnalyze(org.springframework.web.multipart.MultipartFile file, Long userId) {
        fileValidationService.validateFile(file, MAX_FILE_SIZE, "简历");

        String fileName = file.getOriginalFilename();
        String contentType = parseService.detectContentType(file);
        validateContentType(contentType);

        // 💡 修改去重逻辑：只在该用户的历史记录中查找是否上传过此文件
        String fileHash = calculateHash(file);
        Optional<ResumeEntity> existingResume = resumeRepository.findByFileHashAndUserId(fileHash, userId);
        if (existingResume.isPresent()) {
            return handleDuplicateResume(existingResume.get());
        }

        String resumeText = parseService.parseResume(file);
        if (resumeText == null || resumeText.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.RESUME_PARSE_FAILED, "无法从文件中提取文本内容");
        }

        String fileKey = storageService.uploadResume(file);
        String fileUrl = storageService.getFileUrl(fileKey);

        // 💡 显式设置 userId 然后入库
        ResumeEntity savedResume = new ResumeEntity();
        savedResume.setUserId(userId);
        savedResume.setFileHash(fileHash);
        savedResume.setOriginalFilename(fileName);
        savedResume.setFileSize(file.getSize());
        savedResume.setContentType(contentType);
        savedResume.setStorageKey(fileKey);
        savedResume.setStorageUrl(fileUrl);
        savedResume.setResumeText(resumeText);
        savedResume.setAnalyzeStatus(AsyncTaskStatus.PENDING);
        savedResume = resumeRepository.save(savedResume);

        analyzeStreamProducer.sendAnalyzeTask(savedResume.getId(), resumeText);

        return Map.of(
                "resume", Map.of(
                        "id", savedResume.getId(),
                        "filename", savedResume.getOriginalFilename(),
                        "analyzeStatus", AsyncTaskStatus.PENDING.name()
                ),
                "storage", Map.of(
                        "fileKey", fileKey,
                        "fileUrl", fileUrl,
                        "resumeId", savedResume.getId()
                ),
                "duplicate", false
        );
    }

    // SHA-256 哈希计算方法
    private String calculateHash(org.springframework.web.multipart.MultipartFile file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(file.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("计算文件哈希失败", e);
        }
    }

    private void validateContentType(String contentType) {
        fileValidationService.validateContentTypeByList(
                contentType, appConfig.getAllowedTypes(), "不支持的文件类型: " + contentType
        );
    }

    private Map<String, Object> handleDuplicateResume(ResumeEntity resume) {
        Optional<ResumeAnalysisResponse> analysisOpt = persistenceService.getLatestAnalysisAsDTO(resume.getId());
        return analysisOpt.map(resumeAnalysisResponse -> Map.of(
                "analysis", resumeAnalysisResponse,
                "storage", Map.of(
                        "fileKey", resume.getStorageKey() != null ? resume.getStorageKey() : "",
                        "fileUrl", resume.getStorageUrl() != null ? resume.getStorageUrl() : "",
                        "resumeId", resume.getId()
                ),
                "duplicate", true
        )).orElseGet(() -> Map.of(
                "resume", Map.of(
                        "id", resume.getId(),
                        "filename", resume.getOriginalFilename(),
                        "analyzeStatus", resume.getAnalyzeStatus() != null ? resume.getAnalyzeStatus().name() : AsyncTaskStatus.PENDING.name()
                ),
                "storage", Map.of(
                        "fileKey", resume.getStorageKey() != null ? resume.getStorageKey() : "",
                        "fileUrl", resume.getStorageUrl() != null ? resume.getStorageUrl() : "",
                        "resumeId", resume.getId()
                ),
                "duplicate", true
        ));
    }

    @Transactional
    public void reanalyze(Long resumeId) {
        ResumeEntity resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESUME_NOT_FOUND, "简历不存在"));
        String resumeText = resume.getResumeText();
        if (resumeText == null || resumeText.trim().isEmpty()) {
            resumeText = parseService.downloadAndParseContent(resume.getStorageKey(), resume.getOriginalFilename());
            if (resumeText == null || resumeText.trim().isEmpty()) {
                throw new BusinessException(ErrorCode.RESUME_PARSE_FAILED, "无法获取简历文本内容");
            }
            resume.setResumeText(resumeText);
        }
        resume.setAnalyzeStatus(AsyncTaskStatus.PENDING);
        resume.setAnalyzeError(null);
        resumeRepository.save(resume);
        analyzeStreamProducer.sendAnalyzeTask(resumeId, resumeText);
    }
}