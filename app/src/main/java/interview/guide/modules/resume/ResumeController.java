package interview.guide.modules.resume;

import interview.guide.common.annotation.RateLimit;
import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.common.result.Result;
import interview.guide.modules.resume.model.ResumeDetailDTO;
import interview.guide.modules.resume.model.ResumeEntity;
import interview.guide.modules.resume.model.ResumeListItemDTO;
import interview.guide.modules.resume.repository.ResumeRepository;
import interview.guide.modules.resume.service.ResumeDeleteService;
import interview.guide.modules.resume.service.ResumeHistoryService;
import interview.guide.modules.resume.service.ResumeUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
/**
 * 简历控制器
 * Resume Controller for upload and analysis
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeUploadService uploadService;
    private final ResumeDeleteService deleteService;
    private final ResumeHistoryService historyService;
    private final ResumeRepository resumeRepository;

    @PostMapping(value = "/api/resumes/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RateLimit(dimensions = {RateLimit.Dimension.GLOBAL, RateLimit.Dimension.IP}, count = 5)
    public Result<Map<String, Object>> uploadAndAnalyze(@RequestParam("file") MultipartFile file, @RequestParam(required = false) Long userId) {
        if (userId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED, "用户未登录");
        Map<String, Object> result = uploadService.uploadAndAnalyze(file, userId);
        boolean isDuplicate = (Boolean) result.get("duplicate");
        if (isDuplicate) {
            return Result.success("检测到相同简历，已返回历史分析结果", result);
        }
        return Result.success(result);
    }

    @GetMapping("/api/resumes")
    public Result<List<ResumeListItemDTO>> getAllResumes(@RequestParam(required = false) Long userId) {
        if (userId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED, "用户未登录");
        List<ResumeListItemDTO> resumes = historyService.getAllResumes(userId);
        return Result.success(resumes);
    }

    @GetMapping("/api/resumes/{id}/detail")
    public Result<ResumeDetailDTO> getResumeDetail(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        if (userId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED, "用户未登录");
        ResumeDetailDTO detail = historyService.getResumeDetail(id, userId);
        return Result.success(detail);
    }

    @GetMapping("/api/resumes/{id}/export")
    public ResponseEntity<byte[]> exportAnalysisPdf(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        if (userId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED, "用户未登录");
        try {
            var result = historyService.exportAnalysisPdf(id, userId);
            String filename = URLEncoder.encode(result.filename(), StandardCharsets.UTF_8);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + filename)
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(result.pdfBytes());
        } catch (Exception e) {
            log.error("导出PDF失败: resumeId={}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/api/resumes/{id}")
    public Result<Void> deleteResume(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        if (userId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED, "用户未登录");
        // 安全拦截
        ResumeEntity resume = resumeRepository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.RESUME_NOT_FOUND));
        if (!resume.getUserId().equals(userId)) throw new BusinessException(ErrorCode.UNAUTHORIZED, "无权删除此简历");

        deleteService.deleteResume(id);
        return Result.success(null);
    }

    @PostMapping("/api/resumes/{id}/reanalyze")
    @RateLimit(dimensions = {RateLimit.Dimension.GLOBAL, RateLimit.Dimension.IP}, count = 2)
    public Result<Void> reanalyze(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        if (userId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED, "用户未登录");
        ResumeEntity resume = resumeRepository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.RESUME_NOT_FOUND));
        if (!resume.getUserId().equals(userId)) throw new BusinessException(ErrorCode.UNAUTHORIZED, "无权操作");

        uploadService.reanalyze(id);
        return Result.success(null);
    }

    @GetMapping("/api/resumes/health")
    public Result<Map<String, String>> health() {
        return Result.success(Map.of("status", "UP", "service", "AI Interview Platform - Resume Service"));
    }
}