package interview.guide.modules.user.repository;

/**
 * Project:     interview-guide
 * Author:      32107
 * Created on:  2026/4/7 20:29
 */


import interview.guide.modules.admin.model.AdminUserDTO;
import interview.guide.modules.user.model.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByUsername(String username);
    boolean existsByUsername(String username);
    Optional<UserEntity> findByEmail(String email);
    // 增加查询方法
    @Query("SELECT new interview.guide.modules.admin.model.AdminUserDTO(" +
            "u.id, u.username, u.email, u.role, u.status, u.createdAt, COUNT(s.id), u.avatar) " + // 👈 增加 u.avatar
            "FROM UserEntity u LEFT JOIN InterviewSessionEntity s ON u.id = s.userId " +
            "GROUP BY u.id")
    List<AdminUserDTO> findAllUserStats();
    // 在 UserRepository 接口中补充：
    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
}
