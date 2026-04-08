package interview.guide.modules.admin.model;

/**
 * Project:     interview-guide
 * Author:      32107
 * Created on:  2026/4/8 07:42
 */
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;


@Data
@AllArgsConstructor // 👈 必须有这个，用于 JPA 实例化
@NoArgsConstructor
public class AdminUserDTO {
    private Long id;
    private String username;
    private String email;
    private String role;
    private String status;
    private LocalDateTime createdAt;
    private Long interviewCount; // 👈 确保类型是 Long，对应 COUNT()
    private String avatarUrl;
}