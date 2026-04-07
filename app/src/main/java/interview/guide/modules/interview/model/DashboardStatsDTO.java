package interview.guide.modules.interview.model;

/**
 * Project:     interview-guide
 * Author:      32107
 * Created on:  2026/4/8 06:25
 */
import lombok.Data;
import java.util.List;

@Data
public class DashboardStatsDTO {
    private Integer totalInterviews; // 总面试次数
    private Integer avgScore;        // 平均分
    private Integer highestScore;    // 最高分
    private Integer totalQuestions;  // 总答题数

    private List<RadarDimension> radarData; // 雷达图数据
    private List<RecentInterview> recentInterviews; // 最近面试记录

    @Data
    public static class RadarDimension {
        private String subject;
        private Integer score;
        private Integer fullMark;

        public RadarDimension(String subject, Integer score, Integer fullMark) {
            this.subject = subject;
            this.score = score;
            this.fullMark = fullMark;
        }
    }

    @Data
    public static class RecentInterview {
        private Long id;
        private String title;
        private Integer score;
        private String date;

        public RecentInterview(Long id, String title, Integer score, String date) {
            this.id = id;
            this.title = title;
            this.score = score;
            this.date = date;
        }
    }
}