package interview.guide.modules.resume.repository;

import interview.guide.modules.resume.model.ResumeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 简历Repository
 */
@Repository
public interface ResumeRepository extends JpaRepository<ResumeEntity, Long> {

    // 💡 替换：只能查询属于该用户的简历记录
    Optional<ResumeEntity> findByFileHashAndUserId(String fileHash, Long userId);

    // 💡 新增：拉取该用户自己的简历列表
    List<ResumeEntity> findByUserIdOrderByUploadedAtDesc(Long userId);
}
