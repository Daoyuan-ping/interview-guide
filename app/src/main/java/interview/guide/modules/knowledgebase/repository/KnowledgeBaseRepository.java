package interview.guide.modules.knowledgebase.repository;

import interview.guide.modules.knowledgebase.model.KnowledgeBaseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KnowledgeBaseRepository extends JpaRepository<KnowledgeBaseEntity, Long> {

    // 💡 1. 用户级去重查询
    Optional<KnowledgeBaseEntity> findByFileHashAndUserId(String fileHash, Long userId);

    // 💡 2. 获取该用户的全部知识库
    List<KnowledgeBaseEntity> findByUserId(Long userId);

    // 💡 3. 获取该用户的知识库数量
    long countByUserId(Long userId);

    // 💡 4. 关键词搜索该用户的知识库
    List<KnowledgeBaseEntity> findByUserIdAndNameContainingIgnoreCase(Long userId, String keyword);

    // 💡 5. 按分类查询该用户的知识库
    List<KnowledgeBaseEntity> findByUserIdAndCategory(Long userId, String category);

    // 💡 6. 获取该用户用过的所有分类（去重）
    @Query("SELECT DISTINCT k.category FROM KnowledgeBaseEntity k WHERE k.userId = :userId AND k.category IS NOT NULL")
    List<String> findDistinctCategoriesByUserId(@Param("userId") Long userId);
    // 💡 补充批量更新计数的方法，并加上 userId 隔离保护
    @Modifying
    @Query("UPDATE KnowledgeBaseEntity k SET k.questionCount = COALESCE(k.questionCount, 0) + 1, k.lastAccessedAt = CURRENT_TIMESTAMP WHERE k.id IN :ids AND k.userId = :userId")
    int incrementQuestionCountBatch(@org.springframework.data.repository.query.Param("ids") List<Long> ids,
                                    @org.springframework.data.repository.query.Param("userId") Long userId);
}