package interview.guide.modules.knowledgebase.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 知识库实体
 * 💡 修改：加入 userId 并修改去重索引为用户级去重
 */
@Entity
@Table(name = "knowledge_bases", indexes = {
        // 💡 核心修改：从全局文件哈希去重，改为 "用户ID + 文件哈希" 联合去重
        @Index(name = "idx_kb_user_hash", columnList = "user_id, fileHash", unique = true),
        @Index(name = "idx_kb_category", columnList = "category")
})
public class KnowledgeBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 💡 新增：所属用户 ID
    @Column(name = "user_id", nullable = false)
    private Long userId;

    // 文件内容的SHA-256哈希值 (去掉了全局 unique = true)
    @Column(nullable = false, length = 64)
    private String fileHash;

    @Column(nullable = false)
    private String name;

    @Column(length = 100)
    private String category;

    @Column(nullable = false)
    private String originalFilename;

    private Long fileSize;
    private String contentType;

    @Column(length = 500)
    private String storageKey;

    @Column(length = 1000)
    private String storageUrl;

    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    private LocalDateTime lastAccessedAt;
    private Integer accessCount = 0;
    private Integer questionCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private VectorStatus vectorStatus = VectorStatus.PENDING;

    @Column(length = 500)
    private String vectorError;

    private Integer chunkCount = 0;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
        lastAccessedAt = LocalDateTime.now();
        accessCount = 1;
    }

    // 💡 新增的 Getter / Setter
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    // 原有的 Getters and Setters...
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFileHash() { return fileHash; }
    public void setFileHash(String fileHash) { this.fileHash = fileHash; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public String getStorageKey() { return storageKey; }
    public void setStorageKey(String storageKey) { this.storageKey = storageKey; }
    public String getStorageUrl() { return storageUrl; }
    public void setStorageUrl(String storageUrl) { this.storageUrl = storageUrl; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
    public LocalDateTime getLastAccessedAt() { return lastAccessedAt; }
    public void setLastAccessedAt(LocalDateTime lastAccessedAt) { this.lastAccessedAt = lastAccessedAt; }
    public Integer getAccessCount() { return accessCount; }
    public void setAccessCount(Integer accessCount) { this.accessCount = accessCount; }
    public Integer getQuestionCount() { return questionCount; }
    public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }
    public void incrementAccessCount() { this.accessCount++; this.lastAccessedAt = LocalDateTime.now(); }
    public void incrementQuestionCount() { this.questionCount++; this.lastAccessedAt = LocalDateTime.now(); }
    public VectorStatus getVectorStatus() { return vectorStatus; }
    public void setVectorStatus(VectorStatus vectorStatus) { this.vectorStatus = vectorStatus; }
    public String getVectorError() { return vectorError; }
    public void setVectorError(String vectorError) { this.vectorError = vectorError; }
    public Integer getChunkCount() { return chunkCount; }
    public void setChunkCount(Integer chunkCount) { this.chunkCount = chunkCount; }
}