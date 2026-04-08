package interview.guide.modules.admin.controller;

import interview.guide.common.result.Result;
import interview.guide.modules.admin.model.AdminUserDTO;
import interview.guide.modules.interview.model.InterviewSessionEntity;
import interview.guide.modules.interview.repository.InterviewSessionRepository;
import interview.guide.modules.resume.repository.ResumeAnalysisRepository;
import interview.guide.modules.resume.repository.ResumeRepository;
import interview.guide.modules.user.model.UserEntity;
import interview.guide.modules.user.repository.UserRepository;
import interview.guide.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Project:     interview-guide
 * Author:      32107
 * Created on:  2026/4/8 07:34
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final InterviewSessionRepository sessionRepository;
    private final ResumeRepository resumeRepository;
    private final JdbcTemplate jdbcTemplate;
    private final RedisConnectionFactory redisConnectionFactory;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    // ================= 系统大屏端点 =================

    @GetMapping("/dashboard/stats")
    public Result<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // 1. 全局基础统计 (完全真实)
        long totalUsers = userRepository.count();
        long totalInterviews = sessionRepository.count();

        // 💡 修复1：使用真实的简历表记录数，而不是算出来的假数据
        long totalResumes = resumeRepository.count();

        // 2. 昨日新增用户 (真实)
        LocalDateTime startOfYesterday = LocalDate.now().minusDays(1).atStartOfDay();
        LocalDateTime endOfYesterday = LocalDate.now().minusDays(1).atTime(LocalTime.MAX);
        long yesterdayNewUsers = userRepository.countByCreatedAtBetween(startOfYesterday, endOfYesterday);


        // 3. Token 消耗与成本预估 (合并面试和简历分析的 Token)
        Long interviewTokens = sessionRepository.sumTotalUsedTokens();
        Long resumeTokens = resumeAnalysisRepository.sumTotalUsedTokens();

        long totalInterviewTokens = interviewTokens != null ? interviewTokens : 0L;
        long totalResumeTokens = resumeTokens != null ? resumeTokens : 0L;

        // 总消耗 = 面试消耗 + 简历分析消耗
        long estimatedTokens = totalInterviewTokens + totalResumeTokens;

        // 💡 修改点：接入真实的 DeepSeek 白菜价 (假设 100万 Token = 0.3 元)
        // 计算公式： (总 Token 数 / 1000000) * 0.3
        double estimatedCost = (estimatedTokens / 1000.0) * 0.03;

        stats.put("totalUsers", totalUsers);
        stats.put("yesterdayNewUsers", yesterdayNewUsers);
        stats.put("totalInterviews", totalInterviews);
        stats.put("totalResumes", totalResumes);
        stats.put("estimatedTokens", estimatedTokens);
        stats.put("estimatedCost", String.format("%.2f", estimatedCost));

        // 3. 生成近 7 天活跃度图表真实数据
        List<Map<String, Object>> chartData = new ArrayList<>();
        LocalDateTime sevenDaysAgo = LocalDate.now().minusDays(6).atStartOfDay();
        List<InterviewSessionEntity> recentSessions = sessionRepository.findByCreatedAtAfter(sevenDaysAgo);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM-dd");

        for (int i = 6; i >= 0; i--) {
            LocalDate targetDate = LocalDate.now().minusDays(i);
            String dateStr = targetDate.format(formatter);

            // 当天的真实面试次数
            long dailyInterviews = recentSessions.stream()
                    .filter(s -> s.getCreatedAt().toLocalDate().equals(targetDate))
                    .count();

            // 💡 修复3：获取当天的真实活跃用户数（根据当天参与过面试的独立 userId 数量来算，去重）
            long dailyActiveUsers = recentSessions.stream()
                    .filter(s -> s.getCreatedAt().toLocalDate().equals(targetDate))
                    .map(InterviewSessionEntity::getUserId) // 假设会话里有 userId
                    .distinct() // 去重，一个人面试多次只算一个活跃用户
                    .count();

            // 如果没有人面试，我们去查一下当天有没有新注册的用户，也算活跃
            if (dailyActiveUsers == 0) {
                long newReg = userRepository.countByCreatedAtBetween(targetDate.atStartOfDay(), targetDate.atTime(LocalTime.MAX));
                dailyActiveUsers = newReg;
            }

            Map<String, Object> dayData = new HashMap<>();
            dayData.put("name", dateStr);
            dayData.put("面试次数", dailyInterviews);
            dayData.put("活跃用户", dailyActiveUsers);
            chartData.add(dayData);
        }

        stats.put("chartData", chartData);

        // 今天的真实活跃用户
        long todayActive = recentSessions.stream()
                .filter(s -> s.getCreatedAt().toLocalDate().equals(LocalDate.now()))
                .map(InterviewSessionEntity::getUserId)
                .distinct()
                .count();
        stats.put("todayActive", todayActive);

        // ================= 💡 修复4：基础设施监控 (真实探测) =================
        List<Map<String, Object>> infraStatus = new ArrayList<>();

        // 探测 PostgreSQL
        try {
            jdbcTemplate.execute("SELECT 1"); // 真实发送一条探活 SQL
            infraStatus.add(Map.of("name", "PostgreSQL", "status", "运行中", "metric", "连接正常", "color", "text-blue-500", "bg", "bg-blue-100 dark:bg-blue-500/20"));
        } catch (Exception e) {
            infraStatus.add(Map.of("name", "PostgreSQL", "status", "连接异常", "metric", "无法访问", "color", "text-red-500", "bg", "bg-red-100 dark:bg-red-500/20"));
        }

        // 探测 Redis
        try {
            redisConnectionFactory.getConnection().ping(); // 真实发送 PING 命令
            infraStatus.add(Map.of("name", "Redis 缓存", "status", "状态良好", "metric", "响应正常", "color", "text-red-500", "bg", "bg-red-100 dark:bg-red-500/20"));
        } catch (Exception e) {
            infraStatus.add(Map.of("name", "Redis 缓存", "status", "连接异常", "metric", "无法访问", "color", "text-slate-500", "bg", "bg-slate-100 dark:bg-slate-800"));
        }

        stats.put("infraStatus", infraStatus);

        // ================= 实时系统动态 (隐私脱敏) =================
        // 这个你原来的代码已经是基于真实数据（recentSessions）动态生成的了，这部分不需要改。
        List<Map<String, Object>> systemLogs = new ArrayList<>();
        recentSessions.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(5)
                .forEach(session -> {
                    Map<String, Object> log = new HashMap<>();
                    boolean isToday = session.getCreatedAt().toLocalDate().equals(LocalDate.now());
                    DateTimeFormatter timeFormatter = isToday ? DateTimeFormatter.ofPattern("HH:mm") : DateTimeFormatter.ofPattern("MM-dd HH:mm");
                    log.put("time", session.getCreatedAt().format(timeFormatter));

                    String username = "未知用户";
                    if (session.getUserId() != null) {
                        username = userRepository.findById(session.getUserId())
                                .map(UserEntity::getUsername)
                                .orElse("未知用户");
                    }
                    String maskedName = maskUsername(username);

                    String shortId = session.getSessionId() != null && session.getSessionId().length() >= 6
                            ? session.getSessionId().substring(0, 6)
                            : "****";
                    log.put("msg", "用户 " + maskedName + " 发起了一场 AI 面试 (会话: " + shortId + ")");
                    log.put("type", "interview");
                    systemLogs.add(log);
                });

        if (systemLogs.isEmpty()) {
            Map<String, Object> defaultLog = new HashMap<>();
            defaultLog.put("time", LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
            defaultLog.put("msg", "系统运行良好，暂无面试动态");
            defaultLog.put("type", "sys");
            systemLogs.add(defaultLog);
        }
        stats.put("systemLogs", systemLogs);

        return Result.success(stats);
    }

    /**
     * 💡 用户名脱敏工具方法 (例如：zhangsan -> z***n)
     */
    private String maskUsername(String username) {
        if (username == null || username.trim().isEmpty() || "未知用户".equals(username)) {
            return username;
        }
        if (username.length() == 1) {
            return username + "***";
        }
        if (username.length() == 2) {
            return username.charAt(0) + "***";
        }
        return username.charAt(0) + "***" + username.charAt(username.length() - 1);
    }

    // ================= 用户管理端点 =================

    @GetMapping("/users/list")
    public Result<List<AdminUserDTO>> listUsers() {
        return Result.success(userService.getAllUsersWithStats());
    }

    @PostMapping("/users/{userId}/status")
    public Result<Void> updateStatus(@PathVariable Long userId, @RequestParam String status) {
        userService.updateUserStatus(userId, status);
        return Result.success(null);
    }

    @PostMapping("/users/{userId}/password")
    public Result<Void> resetPassword(@PathVariable Long userId, @RequestParam String newPassword) {
        userService.adminResetPassword(userId, newPassword);
        return Result.success(null);
    }

    @PostMapping("/users/{userId}/role")
    public Result<Void> updateRole(@PathVariable Long userId, @RequestParam String role) {
        userService.updateUserRole(userId, role);
        return Result.success(null);
    }
}