package interview.guide.modules.resume.service;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.infrastructure.export.PdfExportService;
import interview.guide.infrastructure.mapper.InterviewMapper;
import interview.guide.infrastructure.mapper.ResumeMapper;
import interview.guide.modules.interview.model.ResumeAnalysisResponse;
import interview.guide.modules.interview.service.InterviewPersistenceService;
import interview.guide.modules.resume.model.ResumeAnalysisEntity;
import interview.guide.modules.resume.model.ResumeDetailDTO;
import interview.guide.modules.resume.model.ResumeEntity;
import interview.guide.modules.resume.model.ResumeListItemDTO;
import interview.guide.modules.resume.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Optional;
/**
 * 简历历史服务
 * 简历历史和导出简历分析报告
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeHistoryService {

    private final ResumePersistenceService resumePersistenceService;
    private final InterviewPersistenceService interviewPersistenceService;
    private final PdfExportService pdfExportService;
    private final ObjectMapper objectMapper;
    private final ResumeMapper resumeMapper;
    private final InterviewMapper interviewMapper;

    // 💡 注入 Repository 用于查询特定用户的记录
    private final ResumeRepository resumeRepository;

    // 💡 增加 userId 参数，并使用新的查询
    public List<ResumeListItemDTO> getAllResumes(Long userId) {
        List<ResumeEntity> resumes = resumeRepository.findByUserIdOrderByUploadedAtDesc(userId);

        return resumes.stream().map(resume -> {
            Integer latestScore = null;
            java.time.LocalDateTime lastAnalyzedAt = null;
            Optional<ResumeAnalysisEntity> analysisOpt = resumePersistenceService.getLatestAnalysis(resume.getId());
            if (analysisOpt.isPresent()) {
                ResumeAnalysisEntity analysis = analysisOpt.get();
                latestScore = analysis.getOverallScore();
                lastAnalyzedAt = analysis.getAnalyzedAt();
            }
            int interviewCount = interviewPersistenceService.findByResumeId(resume.getId()).size();

            return new ResumeListItemDTO(
                    resume.getId(), resume.getOriginalFilename(), resume.getFileSize(),
                    resume.getUploadedAt(), resume.getAccessCount(), latestScore,
                    lastAnalyzedAt, interviewCount
            );
        }).toList();
    }

    // 💡 增加 userId 数据安全校验
    public ResumeDetailDTO getResumeDetail(Long id, Long userId) {
        ResumeEntity resume = resumeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESUME_NOT_FOUND));

        // 核心安全越权保护
        if (!resume.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "无权访问此简历数据");
        }

        List<ResumeAnalysisEntity> analyses = resumePersistenceService.findAnalysesByResumeId(id);
        List<ResumeDetailDTO.AnalysisHistoryDTO> analysisHistory = resumeMapper.toAnalysisHistoryDTOList(
                analyses, this::extractStrengths, this::extractSuggestions
        );
        List<Object> interviewHistory = interviewMapper.toInterviewHistoryList(
                interviewPersistenceService.findByResumeId(id)
        );

        return new ResumeDetailDTO(
                resume.getId(), resume.getOriginalFilename(), resume.getFileSize(),
                resume.getContentType(), resume.getStorageUrl(), resume.getUploadedAt(),
                resume.getAccessCount(), resume.getResumeText(), resume.getAnalyzeStatus(),
                resume.getAnalyzeError(), analysisHistory, interviewHistory
        );
    }

    private List<String> extractStrengths(ResumeAnalysisEntity entity) {
        try {
            if (entity.getStrengthsJson() != null) return objectMapper.readValue(entity.getStrengthsJson(), new TypeReference<>() {});
        } catch (JacksonException e) {}
        return List.of();
    }

    private List<Object> extractSuggestions(ResumeAnalysisEntity entity) {
        try {
            if (entity.getSuggestionsJson() != null) return objectMapper.readValue(entity.getSuggestionsJson(), new TypeReference<>() {});
        } catch (JacksonException e) {}
        return List.of();
    }

    // 💡 增加 userId 保护导出
    public ExportResult exportAnalysisPdf(Long resumeId, Long userId) {
        ResumeEntity resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESUME_NOT_FOUND));

        if (!resume.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "无权导出此简历报告");
        }

        Optional<ResumeAnalysisResponse> analysisOpt = resumePersistenceService.getLatestAnalysisAsDTO(resumeId);
        if (analysisOpt.isEmpty()) {
            throw new BusinessException(ErrorCode.RESUME_ANALYSIS_NOT_FOUND);
        }

        try {
            byte[] pdfBytes = pdfExportService.exportResumeAnalysis(resume, analysisOpt.get());
            String filename = "简历分析报告_" + resume.getOriginalFilename() + ".pdf";
            return new ExportResult(pdfBytes, filename);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.EXPORT_PDF_FAILED, "导出PDF失败: " + e.getMessage());
        }
    }
    public record ExportResult(byte[] pdfBytes, String filename) {}
}