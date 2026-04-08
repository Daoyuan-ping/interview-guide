package interview.guide.modules.admin.controller;

/**
 * Project:     interview-guide
 * Author:      32107
 * Created on:  2026/4/8 07:34
 */

import interview.guide.common.result.Result;
import interview.guide.modules.admin.model.AdminUserDTO;
import interview.guide.modules.interview.model.InterviewSessionEntity;
import interview.guide.modules.interview.repository.InterviewSessionRepository;
import interview.guide.modules.user.repository.UserRepository;
import interview.guide.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
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
    // ================= 系统大屏端点 =================

    @GetMapping("/dashboard/stats")
    public Result<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // 1. 全局基础统计
        long totalUsers = userRepository.count();
        long totalInterviews = sessionRepository.count(); // 如果报错请在类顶部注入 sessionRepository

        // 假设如果没有单独的简历表，总简历数可以约等于用户数*1.5（或者你注入简历表的 count）
        long totalResumes = totalUsers + (totalInterviews / 2);

        // 2. 昨日新增用户
        LocalDateTime startOfYesterday = LocalDate.now().minusDays(1).atStartOfDay();
        LocalDateTime endOfYesterday = LocalDate.now().minusDays(1).atTime(LocalTime.MAX);
        long yesterdayNewUsers = userRepository.countByCreatedAtBetween(startOfYesterday, endOfYesterday);

        // 3. Token 消耗与成本预估 (真实场景下应该把每次调用大模型的 token 存入数据库再 SUM)
        // 这里提供一个基于真实面试场次的估算算法（每场面试大约交互5回合，消耗约 1500 Tokens）
        long estimatedTokens = totalInterviews * 1500;
        // 假设 Qwen/DeepSeek 的 API 价格大约为 0.01元 / 1000 Token
        double estimatedCost = (estimatedTokens / 1000.0) * 0.01;

        stats.put("totalUsers", totalUsers);
        stats.put("yesterdayNewUsers", yesterdayNewUsers);
        stats.put("totalInterviews", totalInterviews);
        stats.put("totalResumes", totalResumes);
        stats.put("estimatedTokens", estimatedTokens);
        stats.put("estimatedCost", String.format("%.2f", estimatedCost)); // 保留两位小数

        // 4. 生成近 7 天活跃度图表真实数据
        List<Map<String, Object>> chartData = new ArrayList<>();
        LocalDateTime sevenDaysAgo = LocalDate.now().minusDays(6).atStartOfDay();

        // 查出最近7天的所有面试记录
        List<InterviewSessionEntity> recentSessions = sessionRepository.findByCreatedAtAfter(sevenDaysAgo);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM-dd");

        // 按天聚合数据
        for (int i = 6; i >= 0; i--) {
            LocalDate targetDate = LocalDate.now().minusDays(i);
            String dateStr = targetDate.format(formatter);

            // 统计这天的面试次数
            long dailyInterviews = recentSessions.stream()
                    .filter(s -> s.getCreatedAt().toLocalDate().equals(targetDate))
                    .count();

            // 模拟一个活跃用户基数（真实情况可以去查用户登录日志表）
            long dailyActiveUsers = dailyInterviews > 0 ? dailyInterviews + (totalUsers / 10) : (totalUsers / 20);

            Map<String, Object> dayData = new HashMap<>();
            dayData.put("name", dateStr); // 例如 "04-08"
            dayData.put("面试次数", dailyInterviews);
            dayData.put("活跃用户", dailyActiveUsers);
            chartData.add(dayData);
        }

        stats.put("chartData", chartData);

        // 5. 今日系统并发（模拟实时数据，因为 Http 是无状态的，真实并发需要查 Redis 里的在线 Token 数）
        stats.put("todayActive", recentSessions.stream().filter(s -> s.getCreatedAt().toLocalDate().equals(LocalDate.now())).count() + 1);

        return Result.success(stats);
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