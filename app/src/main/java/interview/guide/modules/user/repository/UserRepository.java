package interview.guide.modules.user.repository;

/**
 * Project:     interview-guide
 * Author:      32107
 * Created on:  2026/4/7 20:29
 */


import interview.guide.modules.user.model.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByUsername(String username);
    boolean existsByUsername(String username);
    Optional<UserEntity> findByEmail(String email);
}
