package interview.guide.modules.user.model;

/**
 * Project:     interview-guide
 * Author:      32107
 * Created on:  2026/4/7 20:27
 */

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 100)
    private String password;

    // 邮箱字段
    @Column(unique = true, nullable = false, length = 100)
    private String email;

    // 角色字段 (USER / ADMIN)
    @Column(nullable = false, length = 20)
    private String role = "USER";

    // 💡 新增：账号状态字段 (NORMAL / BANNED)
    @Column(nullable = false, length = 20)
    private String status = "NORMAL";

    private LocalDateTime createdAt;

    // 💡 建议新增：记录信息最后修改时间
    private LocalDateTime updatedAt;

    @Column(length = 255)
    private String avatar;

    @Column(length = 20)
    private String phone;

    @Column(length = 50)
    private String targetPosition; // 目标岗位

    @Column(length = 500)
    private String bio; // 个人简介

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ================= Getters and Setters =================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    // 💡 新增 status 的 Get/Set
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getTargetPosition() { return targetPosition; }
    public void setTargetPosition(String targetPosition) { this.targetPosition = targetPosition; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
}