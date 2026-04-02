# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 项目概述

**InterviewGuide** 是一个集成了简历分析、模拟面试和知识库管理的智能面试辅助平台。系统利用大语言模型（LLM）和向量数据库技术，为求职者和 HR 提供智能化的简历评估和面试练习服务。

## 技术栈

### 后端技术
- **Java 21**: 开发语言
- **Spring Boot 4.0**: 应用框架
- **Spring AI 2.0**: AI 集成框架 (阿里云 DashScope)
- **PostgreSQL 14+**: 关系数据库 + 向量存储 (pgvector)
- **Redis 7**: 缓存 + 消息队列 (Stream)
- **Apache Tika 2.9.2**: 文档解析 (PDF、DOCX、DOC、TXT)
- **iText 8.0.5**: PDF 导出
- **MapStruct 1.6.3**: 对象映射
- **Gradle 8.14**: 构建工具

### 前端技术
- **React 18.3**: UI 框架
- **TypeScript 5.6**: 开发语言
- **Vite 5.4**: 构建工具
- **Tailwind CSS 4.1**: 样式框架
- **Redux**: 状态管理
- **React Router 7.11**: 路由管理

## 项目架构

```
interview-guide/
├── app/                              # 后端应用
│   ├── src/main/java/interview/guide/
│   │   ├── App.java                  # 主启动类
│   │   ├── common/                   # 通用模块
│   │   │   ├── config/               # 配置类
│   │   │   ├── exception/            # 异常处理
│   │   │   └── result/               # 统一响应
│   │   ├── infrastructure/           # 基础设施
│   │   │   ├── export/               # PDF 导出
│   │   │   ├── file/                 # 文件处理
│   │   │   ├── redis/                # Redis 服务
│   │   │   └── storage/              # 对象存储
│   │   └── modules/                  # 业务模块
│   │       ├── interview/            # 面试模块
│   │       ├── knowledgebase/        # 知识库模块
│   │       └── resume/               # 简历模块
│   └── src/main/resources/
│       ├── application.yml           # 应用配置
│       └── prompts/                  # AI 提示词模板
├── frontend/                         # 前端应用
│   ├── src/
│   │   ├── api/                      # API 接口
│   │   ├── components/               # 公共组件
│   │   ├── pages/                    # 页面组件
│   │   ├── types/                    # 类型定义
│   │   └── utils/                    # 工具函数
│   ├── package.json
│   └── vite.config.ts
└── docker/                           # Docker 部署配置
    └── compose files
```

## 架构特点

1. **异步处理流程**: 简历分析、知识库向量化和面试报告生成采用 Redis Stream 异步处理
2. **向量数据库**: 使用 PostgreSQL + pgvector 实现 RAG (检索增强生成) 能力
3. **分批评估**: 对长文本进行分批评估，规避 Token 溢出风险
4. **多格式解析**: 支持 PDF、DOCX、DOC、TXT 等多种简历格式
5. **S3 兼容存储**: 使用 MinIO 作为对象存储 (RustFS)

## 高级特性

1. **智能追问**: 支持配置多轮智能追问
2. **流式响应**: 基于 SSE (Server-Sent Events) 技术实现打字机式流式响应
3. **结构化输出**: 使用 Spring AI 结构化输出功能，确保 AI 生成的 JSON 格式正确
4. **重试机制**: 智能重试失败的 AI 调用，特别是结构化输出解析失败
5. **内容哈希**: 基于内容哈希的重复检测，避免重复处理

## 常用命令

### 后端

1. **启动服务**
```bash
./gradlew bootRun
```
- 后端服务启动于 `http://localhost:8080`
- 端口: 8080

2. **测试**
```bash
./gradlew test
```

3. **生成测试覆盖率报告**
```bash
./gradlew test --coverage
```

4. **构建**
```bash
./gradlew build
```

### 前端

1. **安装依赖**
```bash
cd frontend
pnpm install
```

2. **开发模式**
```bash
cd frontend
pnpm dev
```
- 前端服务启动于 `http://localhost:5173`
- 端口: 5173

3. **构建生产版本**
```bash
cd frontend
pnpm build
```

### Docker 部署

1. **初始化环境**
```bash
# 复制环境变量配置文件
cp .env.example .env
```

2. **配置环境变量**
```bash
# 编辑 .env 文件
vim .env
# 必填：AI_BAILIAN_API_KEY=your_key_here
```

3. **启动所有服务**
```bash
docker-compose up -d --build
```

4. **查看服务状态**
```bash
docker-compose ps
```

5. **查看后端日志**
```bash
docker-compose logs -f app
```

6. **停止并移除所有服务**
```bash
docker-compose down
```

## 配置文件

### 后端配置

主要配置文件: `app/src/main/resources/application.yml`

关键配置:
- **数据库**: PostgreSQL 配置 (通过 `application.yml` 或环境变量 `POSTGRES_XXX`)
- **AI API**: 阿里云 DashScope API 密钥 (通过 `AI_BAILIAN_API_KEY` 环境变量)
- **AI 模型**: 默认 `qwen-plus`，可配置为 `qwen-max`、`qwen-long` 等
- **面试参数**: `APP_INTERVIEW_FOLLOW_UP_COUNT` (追问数量)、`APP_INTERVIEW_EVALUATION_BATCH_SIZE` (评估分批大小)
- **存储**: MinIO 配置 (通过 `APP_STORAGE_XXX` 环境变量)

### 环境变量

常见环境变量:
- `AI_BAILIAN_API_KEY`: 阿里云 DashScope API 密钥
- `AI_MODEL`: AI 模型名称 (默认: `qwen-plus`)
- `APP_INTERVIEW_FOLLOW_UP_COUNT`: 每个主问题生成追问数量 (默认: `1`)
- `APP_INTERVIEW_EVALUATION_BATCH_SIZE`: 回答评估分批大小 (默认: `8`)
- `POSTGRES_HOST`: PostgreSQL 主机名 (默认: `localhost`)
- `POSTGRES_PORT`: PostgreSQL 端口 (默认: `5432`)
- `POSTGRES_DB`: PostgreSQL 数据库名 (默认: `interview_guide`)
- `POSTGRES_USER`: PostgreSQL 用户名 (默认: `postgres`)
- `POSTGRES_PASSWORD`: PostgreSQL 密码 (默认: `password`)
- `REDIS_HOST`: Redis 主机名 (默认: `localhost`)
- `REDIS_PORT`: Redis 端口 (默认: `1890`)
- `APP_STORAGE_ENDPOINT`: 对象存储 endpoint (默认: `http://localhost:9000`)
- `APP_STORAGE_ACCESS_KEY`: 对象存储访问密钥 (默认: `minioadmin`)
- `APP_STORAGE_SECRET_KEY`: 对象存储秘密密钥 (默认: `minioadmin`)
- `APP_STORAGE_BUCKET`: 对象存储桶名 (默认: `interview-guide`)
- `APP_STORAGE_REGION`: 对象存储区域 (默认: `us-east-1`)

## 代码结构

### 后端模块

1. **`app/src/main/java/interview/guide/App.java`**: 主启动类
2. **`app/src/main/java/interview/guide/common/config/`**: 配置类 (包括 AI 配置、Redis 配置等)
3. **`app/src/main/java/interview/guide/common/exception/`**: 自定义异常
4. **`app/src/main/java/interview/guide/common/result/`**: 通用响应封装
5. **`app/src/main/java/interview/guide/modules/interview/`**: 面试模块 (面试相关业务逻辑)
6. **`app/src/main/java/interview/guide/modules/knowledgebase/`**: 知识库模块 (知识库相关业务逻辑)
7. **`app/src/main/java/interview/guide/modules/resume/`**: 简历模块 (简历相关业务逻辑)
8. **`app/src/main/java/interview/guide/infrastructure/`**: 基础设施 (PDF 导出、文件处理、Redis 服务、对象存储)

### 前端模块

1. **`frontend/src/api/`**: API 接口定义
2. **`frontend/src/components/`**: 公共组件
3. **`frontend/src/pages/`**: 页面组件
4. **`frontend/src/types/`**: TypeScript 类型定义
5. **`frontend/src/utils/`**: 工具函数

## 开发建议

1. **IDE 配置**:
   - 推荐使用 IntelliJ IDEA 2024+ 或 VS Code
   - 配置 Java 21 JDK 和 Node.js 18+
   - 前端建议配置 Vite 支持

2. **数据库连接**:
   - 首次启动建议设置 `jpa.hibernate.ddl-auto: create`
   - 后续设置 `jpa.hibernate.ddl-auto: update`
   - 生产环境建议设置 `jpa.hibernate.ddl-auto: validate` 或 `none`

3. **测试建议**:
   - 优先运行相关业务模块的测试
   - 使用 `./gradlew test` 运行所有测试
   - 使用 `./gradlew test --tests "*InterviewServiceTest"` 运行特定测试

4. **异步处理**:
   - Redis Stream 异步任务处理
   - 消费者处理简历分析、知识库向量化等任务
   - 状态流转: `PENDING` → `PROCESSING` → `COMPLETED` / `FAILED`

5. **AI 集成**:
   - 使用 Spring AI `BeanOutputConverter` 确保输出格式
   - 处理 AI API 错误: 超时、失败、内容安全等
   - 结构化输出重试机制 (配置: `APP_AI_STRUCTURED_MAX_ATTEMPTS`)

## 常见问题

1. **数据库表创建失败**
   - 检查 `jpa.hibernate.ddl-auto` 配置
   - 开发环境用 `create`，生产环境用 `update` 或 `validate`

2. **知识库向量化失败**
   - 检查 MinIO 连接
   - 确认 `initialize-schema` 配置
   - 查看后端日志

3. **简历分析失败**
   - 检查 AI API 密钥 (阿里云 DashScope)
   - 检查 Redis Stream 是否正常消费

4. **PDF 导出失败**
   - 检查字体文件 (`app/src/main/resources/fonts/ZhuqueFangsong-Regular.ttf`)
   - 确认 iText 依赖

## 调试技巧

1. **日志配置**: 在 `application.yml` 中调整 `logging.level` 配置
   - 例如: `logging.level.com.interview.guide=DEBUG`

2. **API 调试**: 使用 Postman 或 curl 测试 API 端点
   - 主要 API 端点: `http://localhost:8080/api/v1`
   - 文档: Swagger UI (`http://localhost:8080/swagger-ui.html`)

3. **Redis 调试**: 使用 Redis CLI 或浏览器访问 Redis 端口
   - 查看 Stream 消息: `XREAD STREAM resume_analyzer > 0`

4. **数据库调试**: 使用 PostgreSQL 连接工具 (如 pgAdmin) 查看数据

## 性能优化

1. **Redis 缓存**:
   - 缓存热门知识库内容
   - 使用 Redis 分布式锁控制并发
   - 设置合理的过期时间

2. **分批评估**:
   - 根据 `batch-size` 配置优化评估效率
   - 避免一次性处理超长文本

3. **异步处理**:
   - 利用 Redis Stream 实现高并发处理
   - 设置合理的消费者并发数

4. **向量索引**:
   - 配置 HNSW 索引参数
   - 调整距离类型和维度
   - 定期维护索引

## 安全考虑

1. **API 限流**:
   - 配置速率限制 (默认: `APP_RAG_RATE_LIMIT`)
   - 防止滥用

2. **数据验证**:
   - 后端 API 输入验证 (使用 Spring Validation)
   - 前端表单验证

3. **敏感信息**:
   - 不要将 API 密钥硬编码
   - 使用环境变量或配置管理

4. **文件上传**:
   - 限制文件大小 (默认: 50MB)
   - 检查文件类型
   - 防止恶意文件

## 扩展开发

1. **新增 API**:
   - 在 `api/` 目录下创建新的接口定义
   - 在 `modules/` 目录下添加业务逻辑
   - 添加新的 DTO/VO 类型

2. **新增功能模块**:
   - 创建新的模块目录 (如 `chat/`)
   - 添加配置
   - 编写测试

3. **UI 改进**:
   - 在 `pages/` 或 `components/` 下添加新组件
   - 使用 TypeScript 类型定义
   - 编写单元测试

4. **集成第三方服务**:
   - 添加新的依赖
   - 实现适配器模式
   - 配置 API 密钥

## 贡献代码

1. **提交问题**:
   - 在 GitHub 仓库提交 issue
   - 描述问题并提供复现步骤

2. **提交 PR**:
   - 分支: `main` 或 `feature/*`
   - 清晰的提交消息
   - 代码规范一致

3. **测试覆盖**:
   - 新增功能需添加测试
   - 修改现有功能需验证测试
   - 保持测试覆盖率

## 文档

1. **后端 API**:
   - 位于 `Swagger UI` (`http://localhost:8080/swagger-ui.html`)
   - 文档位于 `app/src/main/resources/static/swagger.json`

2. **提示词模板**:
   - 位于 `app/src/main/resources/prompt/`
   - 用于 AI 生成

3. **设计文档**:
   - 架构图: `README.md` 中的 SVG 图
   - API 设计: 各模块的 `Controller` 和 `Service` 代码

## 调试环境

1. **本地开发**:
   - 前后端服务分别启动
   - Docker 部署用于生产/测试

2. **Docker**:
   - 使用 `docker-compose.yml` 部署
   - 配置环境变量
   - 查看日志

3. **生产环境**:
   - 推荐使用 Docker 部署
   - 监控服务状态
   - 定期备份数据

## 项目里程碑

1. **核心功能**:
   - 简历上传、分析、导出
   - 简历库管理
   - 模拟面试
   - 知识库上传、向量化、查询

2. **高级功能**:
   - 智能追问 (待完成)
   - 知识库统计信息
   - 告警系统 (待完成)
   - 等等

## 版本管理

- 使用 Git (GitFlow 工作流)
- 版本号: `0.0.1-SNAPSHOT`
- 发布: 使用 `./gradlew release` (需配置)
- 版本控制: Git tags

## 部署

1. **Docker 部署**:
   ```bash
   docker-compose up -d
   ```

2. **手动部署**:
   - 准备环境 (JDK、Node.js、PostgreSQL、Redis、MinIO)
   - 配置环境变量
   - 启动服务

3. **CI/CD**:
   - 使用 GitHub Actions
   - 配置工作流 (build, test, deploy)

## 维护

1. **日志监控**:
   - 查看后端日志
   - 前端日志 (browser console)
   - Redis/PostgreSQL 日志

2. **性能监控**:
   - 前端: Google Analytics, Custom Metrics
   - 后端: Spring Boot Actuator, APM 工具
   - 数据库: 慢查询日志

3. **数据备份**:
   - PostgreSQL: 备份脚本
   - MinIO: 备份到 S3
   - 定期执行

4. **安全更新**:
   - 检查依赖漏洞
   - 更新过期依赖
   - 定期安全扫描

## 未来计划

1. **AI 模型升级**: 集成更先进的模型
2. **性能优化**: 提高响应速度
3. **功能扩展**: 添加更多面试场景
4. **用户体验**: 改进 UI/UX
5. **API 文档**: 生成完整文档
6. **监控系统**: 增加监控指标

## 支持

- 论坛: 项目 README 中的链接
- GitHub Issues: 问题跟踪
- 贡献者: 克服所有技术挑战

---

**更新日期**: 2026-03-27