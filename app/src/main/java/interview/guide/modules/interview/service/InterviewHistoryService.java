package interview.guide.modules.interview.service;

import interview.guide.modules.interview.model.*;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.infrastructure.export.PdfExportService;
import interview.guide.infrastructure.mapper.InterviewMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import interview.guide.modules.interview.repository.InterviewSessionRepository;
import org.springframework.data.domain.Sort; // 待会用来排序
/**
 * 面试历史服务
 * 获取面试会话详情和导出面试报告
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewHistoryService {

    private final InterviewPersistenceService interviewPersistenceService;
    private final PdfExportService pdfExportService;
    private final ObjectMapper objectMapper;
    private final InterviewMapper interviewMapper;
    private final InterviewSessionRepository interviewSessionRepository;
    /**
     * 获取面试会话详情
     */
    public InterviewDetailDTO getInterviewDetail(String sessionId) {
        Optional<InterviewSessionEntity> sessionOpt = interviewPersistenceService.findBySessionId(sessionId);
        if (sessionOpt.isEmpty()) {
            throw new BusinessException(ErrorCode.INTERVIEW_SESSION_NOT_FOUND);
        }

        InterviewSessionEntity session = sessionOpt.get();

        // 解析JSON字段
        List<Object> questions = parseJson(session.getQuestionsJson(), new TypeReference<>() {});
        List<String> strengths = parseJson(session.getStrengthsJson(), new TypeReference<>() {});
        List<String> improvements = parseJson(session.getImprovementsJson(), new TypeReference<>() {});
        List<Object> referenceAnswers = parseJson(session.getReferenceAnswersJson(), new TypeReference<>() {});

        // 解析所有题目（用于构建完整的答案列表）
        List<InterviewQuestionDTO> allQuestions = parseJson(
            session.getQuestionsJson(),
                new TypeReference<>() {
                }
        );

        // 构建答案详情列表（包含所有题目，未回答的也要显示）
        List<InterviewDetailDTO.AnswerDetailDTO> answerList = buildAnswerDetailList(
            allQuestions,
            session.getAnswers()
        );

        // 使用 MapStruct 组装最终 DTO
        return interviewMapper.toDetailDTO(
            session,
            questions,
            strengths,
            improvements,
            referenceAnswers,
            answerList
        );
    }

    /**
     * 构建答案详情列表（包含所有题目）
     * 对于用户已回答的题目使用答案数据，对于未回答的题目构建空答案
     */
    private List<InterviewDetailDTO.AnswerDetailDTO> buildAnswerDetailList(
        List<InterviewQuestionDTO> allQuestions,
        List<InterviewAnswerEntity> answers
    ) {
        if (allQuestions == null || allQuestions.isEmpty()) {
            // 如果没有题目数据，回退到仅显示已回答的题目
            return interviewMapper.toAnswerDetailDTOList(answers, this::extractKeyPoints);
        }

        // 将答案按 questionIndex 索引
        java.util.Map<Integer, InterviewAnswerEntity> answerMap = answers.stream()
            .collect(java.util.stream.Collectors.toMap(
                InterviewAnswerEntity::getQuestionIndex,
                a -> a,
                (a1, a2) -> a1  // 如果有重复，取第一个
            ));

        // 遍历所有题目，构建完整的答案详情列表
        return allQuestions.stream()
            .map(question -> {
                InterviewAnswerEntity answer = answerMap.get(question.questionIndex());
                if (answer != null) {
                    // 用户已回答，使用答案数据
                    return interviewMapper.toAnswerDetailDTO(answer, extractKeyPoints(answer));
                } else {
                    // 用户未回答，构建空答案
                    return new InterviewDetailDTO.AnswerDetailDTO(
                        question.questionIndex(),
                        question.question(),
                        question.category(),
                        null,  // userAnswer
                        question.score() != null ? question.score() : 0,  // score
                        question.feedback(),  // feedback
                        null,  // referenceAnswer
                        null,  // keyPoints
                        null   // answeredAt
                    );
                }
            })
            .toList();
    }

    /**
     * 从 JSON 提取 keyPoints
     */
    private List<String> extractKeyPoints(InterviewAnswerEntity answer) {
        return parseJson(answer.getKeyPointsJson(), new TypeReference<>() {});
    }

    /**
     * 通用 JSON 解析方法
     */
    private <T> T parseJson(String json, TypeReference<T> typeRef) {
        if (json == null) {
            return null;
        }
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (JacksonException e) {
            log.error("解析 JSON 失败", e);
            return null;
        }
    }

    /**
     * 导出面试报告为PDF
     */
    public byte[] exportInterviewPdf(String sessionId) {
        Optional<InterviewSessionEntity> sessionOpt = interviewPersistenceService.findBySessionId(sessionId);
        if (sessionOpt.isEmpty()) {
            throw new BusinessException(ErrorCode.INTERVIEW_SESSION_NOT_FOUND);
        }

        InterviewSessionEntity session = sessionOpt.get();
        try {
            return pdfExportService.exportInterviewReport(session);
        } catch (Exception e) {
            log.error("导出PDF失败: sessionId={}", sessionId, e);
            throw new BusinessException(ErrorCode.EXPORT_PDF_FAILED, "导出PDF失败: " + e.getMessage());
        }
    }

    /**
     * 获取用户的数据看板统计信息 (完全基于大模型真实评价数据)
     */
    public DashboardStatsDTO getDashboardStats(Long userId) {
        // 1. 获取用户所有的历史面试记录 (请确保你的 Repository 里有这个方法)
        List<InterviewSessionEntity> sessions = interviewSessionRepository.findAll(
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        DashboardStatsDTO stats = new DashboardStatsDTO();
        stats.setTotalInterviews(sessions.size());

        // 如果没有面试记录，返回空模板
        if (sessions.isEmpty()) {
            stats.setAvgScore(0);
            stats.setHighestScore(0);
            stats.setTotalQuestions(0);
            stats.setRadarData(Arrays.asList(
                    new DashboardStatsDTO.RadarDimension("基础知识", 0, 100),
                    new DashboardStatsDTO.RadarDimension("算法能力", 0, 100),
                    new DashboardStatsDTO.RadarDimension("系统设计", 0, 100)
            ));
            stats.setRecentInterviews(new ArrayList<>());
            return stats;
        }

        int totalScore = 0;
        int maxScore = 0;
        int totalQuestionsCount = 0;

        List<DashboardStatsDTO.RecentInterview> recentList = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // --- 核心：用于聚合大模型真实的分类打分数据 ---
        Map<String, Integer> categoryTotalScore = new HashMap<>();
        Map<String, Integer> categoryCount = new HashMap<>();

        for (int i = 0; i < sessions.size(); i++) {
            InterviewSessionEntity session = sessions.get(i);
            int sessionScore = session.getOverallScore() != null ? session.getOverallScore() : 0;
            totalScore += sessionScore;
            if (sessionScore > maxScore) {
                maxScore = sessionScore;
            }

            totalQuestionsCount += session.getTotalQuestions() != null ? session.getTotalQuestions() : 0;

            // 提取最近5次面试用于右侧列表展示
            if (i < 5) {
                // 如果你想更完美，可以从 session.getResume() 里拿用户的求职意向作为 Title
                recentList.add(new DashboardStatsDTO.RecentInterview(
                        session.getId(),
                        "AI 模拟面试",
                        sessionScore,
                        session.getCreatedAt().format(formatter)
                ));
            }

            // --- 提取大模型针对每道题的真实分类和打分 ---
            if (session.getQuestionsJson() != null && session.getAnswers() != null) {
                // 解析大模型出题时的题目信息（里面包含 category）
                List<InterviewQuestionDTO> questions = parseJson(session.getQuestionsJson(), new TypeReference<List<InterviewQuestionDTO>>() {});

                if (questions != null) {
                    // 建立 questionIndex -> category 的映射关系
                    Map<Integer, String> indexToCategory = questions.stream()
                            .filter(q -> q.category() != null)
                            .collect(Collectors.toMap(
                                    InterviewQuestionDTO::questionIndex,
                                    InterviewQuestionDTO::category,
                                    (v1, v2) -> v1 // 防御性处理，防止重复key报错
                            ));

                    // 遍历大模型对用户作答的真实评估得分
                    for (InterviewAnswerEntity answer : session.getAnswers()) {
                        if (answer.getScore() != null) {
                            // 拿到这道题大模型给的分类，如果找不到默认归入"综合能力"
                            String category = indexToCategory.getOrDefault(answer.getQuestionIndex(), "综合能力");

                            categoryTotalScore.put(category, categoryTotalScore.getOrDefault(category, 0) + answer.getScore());
                            categoryCount.put(category, categoryCount.getOrDefault(category, 0) + 1);
                        }
                    }
                }
            }
        }

        // 设置总体概览数据
        stats.setAvgScore(totalScore / sessions.size());
        stats.setHighestScore(maxScore);
        stats.setTotalQuestions(totalQuestionsCount);
        stats.setRecentInterviews(recentList);

        // --- 构造动态雷达图数据 ---
        List<DashboardStatsDTO.RadarDimension> radarData = new ArrayList<>();
        if (categoryCount.isEmpty()) {
            radarData = Arrays.asList(
                    new DashboardStatsDTO.RadarDimension("基础知识", 0, 100),
                    new DashboardStatsDTO.RadarDimension("算法能力", 0, 100),
                    new DashboardStatsDTO.RadarDimension("系统设计", 0, 100)
            );
        } else {
            // 计算每个大模型真实分类的平均分
            for (Map.Entry<String, Integer> entry : categoryTotalScore.entrySet()) {
                String category = entry.getKey();
                int count = categoryCount.get(category);
                int avgCategoryScore = entry.getValue() / count;
                radarData.add(new DashboardStatsDTO.RadarDimension(category, avgCategoryScore, 100));
            }

            // Recharts 雷达图为了美观，如果顶点少于3个会变成一条线或不显示，这里做一下保底
            if (radarData.size() < 3) {
                radarData.add(new DashboardStatsDTO.RadarDimension("综合素质", stats.getAvgScore(), 100));
                radarData.add(new DashboardStatsDTO.RadarDimension("逻辑表达", stats.getAvgScore(), 100));
            }
        }
        stats.setRadarData(radarData);

        return stats;
    }
}

