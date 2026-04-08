package interview.guide.modules.user.service;

import interview.guide.infrastructure.file.FileStorageService;
import interview.guide.infrastructure.redis.RedisService;
import interview.guide.modules.admin.model.AdminUserDTO; // 引入管理端DTO
import interview.guide.modules.user.model.AuthDTO.AuthRequest;
import interview.guide.modules.user.model.AuthDTO.AuthResponse;
import interview.guide.modules.user.model.UserEntity;
import interview.guide.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Project:     interview-guide
 * Author:      32107
 * Created on:  2026/4/7 20:31
 */

@Service
@RequiredArgsConstructor
public class UserService {
    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;
    private final RedisService redisService; // 使用你封装的 RedisService

    private String encryptPassword(String password) {
        String salt = "ai-interview-2026-";
        return DigestUtils.md5DigestAsHex((salt + password).getBytes(StandardCharsets.UTF_8));
    }

    public AuthResponse register(AuthRequest request) {
        // 1. 校验邮箱验证码
        String cachedEmailCode = redisService.get("EMAIL_CODE:" + request.email());
        if (cachedEmailCode == null || !cachedEmailCode.equals(request.emailCode())) {
            throw new RuntimeException("邮箱验证码错误或已过期");
        }

        // 2. 校验账号是否冲突
        if (userRepository.existsByUsername(request.username())) {
            throw new RuntimeException("该用户名已被注册");
        }

        // 3. 保存用户
        UserEntity user = new UserEntity();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPassword(encryptPassword(request.password()));
        user.setRole("USER");
        user.setStatus("NORMAL");

        userRepository.save(user);

        // 注册成功后销毁验证码
        redisService.delete("EMAIL_CODE:" + request.email());

        // 4. 生成响应
        String token = UUID.randomUUID().toString().replace("-", "");

        // 💡 新注册用户头像初始为 null
        String defaultAvatarUrl = null;

        return new AuthResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getRole(),
                null // 👈 传入 null，解决找不到变量的问题
        );
    }

    // ================= 前台用户登录 =================
    public AuthResponse login(AuthRequest request) {
        UserEntity user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new RuntimeException("用户名或密码错误"));

        if (!user.getPassword().equals(encryptPassword(request.password()))) {
            throw new RuntimeException("用户名或密码错误");
        }

        // 💡 新增拦截：防止管理员登录前台
     /*   if ("ADMIN".equals(user.getRole())) {
            throw new RuntimeException("管理员账号请前往后台管理系统登录");
        }*/

        if ("BANNED".equals(user.getStatus())) {
            throw new RuntimeException("您的账号已被封禁，请联系管理员");
        }

        // 💡 重点：把文件 Key 转换为可直接访问的 URL
        String fullAvatarUrl = null;
        if (user.getAvatar() != null && !user.getAvatar().isEmpty()) {
            fullAvatarUrl = fileStorageService.getFileUrl(user.getAvatar());
        }

        String token = UUID.randomUUID().toString().replace("-", "");

        // 💡 确保你的 AuthResponse 构造函数支持传 avatarUrl
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getRole(), fullAvatarUrl);
    }

    // ================= 后台管理员登录 =================
    public AuthResponse adminLogin(AuthRequest request) {
        UserEntity user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new RuntimeException("用户名或密码错误"));

        if (!user.getPassword().equals(encryptPassword(request.password()))) {
            throw new RuntimeException("用户名或密码错误");
        }

        // 💡 新增拦截：仅允许管理员登录后台
        if (!"ADMIN".equals(user.getRole())) {
            throw new RuntimeException("非管理员账号，无权访问管理系统");
        }

        if ("BANNED".equals(user.getStatus())) {
            throw new RuntimeException("您的账号已被封禁");
        }

        String fullAvatarUrl = null;
        if (user.getAvatar() != null && !user.getAvatar().isEmpty()) {
            fullAvatarUrl = fileStorageService.getFileUrl(user.getAvatar());
        }

        String token = UUID.randomUUID().toString().replace("-", "");

        return new AuthResponse(token, user.getId(), user.getUsername(), user.getRole(), fullAvatarUrl);
    }

    public Map<String, Object> getUserInfo(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("email", user.getEmail());
        userInfo.put("role", user.getRole());
        userInfo.put("phone", user.getPhone());
        userInfo.put("targetPosition", user.getTargetPosition());
        userInfo.put("bio", user.getBio());
        userInfo.put("createdAt", user.getCreatedAt()); // 返回注册时间

        if (user.getAvatar() != null && !user.getAvatar().isEmpty()) {
            userInfo.put("avatarUrl", fileStorageService.getFileUrl(user.getAvatar()));
        } else {
            userInfo.put("avatarUrl", null);
        }
        return userInfo;
    }

    // 更新基础资料
    public void updateProfile(Long userId, String phone, String targetPosition, String bio) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        user.setPhone(phone);
        user.setTargetPosition(targetPosition);
        user.setBio(bio);
        userRepository.save(user);
    }

    public String updateAvatar(Long userId, MultipartFile file) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        // 删除旧头像(可选优化)
        if (user.getAvatar() != null && !user.getAvatar().isEmpty()) {
            fileStorageService.deleteFile(user.getAvatar()); // 这里假设你把 deleteFile 设为了 public
        }

        String fileKey = fileStorageService.uploadAvatar(file);
        user.setAvatar(fileKey);
        userRepository.save(user);

        return fileStorageService.getFileUrl(fileKey);
    }

    public void updatePassword(Long userId, String oldPassword, String newPassword) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        if (!user.getPassword().equals(encryptPassword(oldPassword))) {
            throw new RuntimeException("原密码不正确");
        }

        user.setPassword(encryptPassword(newPassword));
        userRepository.save(user);
    }

    // 增加重置密码的核心业务逻辑
    public void resetPassword(String email, String emailCode, String newPassword) {
        // 1. 校验邮箱验证码
        String cachedEmailCode = redisService.get("EMAIL_CODE:" + email);
        if (cachedEmailCode == null || !cachedEmailCode.equals(emailCode)) {
            throw new RuntimeException("邮箱验证码错误或已过期");
        }

        // 2. 查找用户是否存在
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("该邮箱尚未注册账号"));

        // 3. 更新密码并保存
        user.setPassword(encryptPassword(newPassword));
        userRepository.save(user);

        // 4. 修改成功后销毁验证码，防止重复使用
        redisService.delete("EMAIL_CODE:" + email);
    }

    // ================= 以下为新增的后台管理功能 =================

    // 获取所有用户统计信息（需要关联 UserRepository 里的 findAllUserStats 接口）
    public List<AdminUserDTO> getAllUsersWithStats() {
        List<AdminUserDTO> users = userRepository.findAllUserStats();
        // 💡 遍历列表，将 key 转换为可访问的完整 URL
        users.forEach(user -> {
            if (user.getAvatarUrl() != null && !user.getAvatarUrl().isEmpty()) {
                user.setAvatarUrl(fileStorageService.getFileUrl(user.getAvatarUrl()));
            }
        });
        return users;
    }

    // 账号管控：修改账号状态 (封禁/解封)
    public void updateUserStatus(Long userId, String status) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        // 💡 新增安全拦截：不允许任何人封禁管理员账号（从而也避免了管理员自杀式封禁）
        if ("ADMIN".equals(user.getRole()) && "BANNED".equals(status)) {
            throw new RuntimeException("系统安全限制：不能封禁管理员账号");
        }

        user.setStatus(status);
        userRepository.save(user);
    }

    // 管理员强制重置用户密码（无需校验原密码）
    public void adminResetPassword(Long userId, String newPassword) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setPassword(encryptPassword(newPassword));
        userRepository.save(user);
    }

    // 角色分配：提拔管理员或降级为普通用户
    public void updateUserRole(Long userId, String role) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setRole(role);
        userRepository.save(user);
    }
}