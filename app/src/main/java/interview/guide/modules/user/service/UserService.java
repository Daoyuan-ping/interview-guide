package interview.guide.modules.user.service;

import interview.guide.common.exception.BusinessException; // 💡 新增导入
import interview.guide.common.exception.ErrorCode;         // 💡 新增导入
import interview.guide.infrastructure.file.FileStorageService;
import interview.guide.infrastructure.redis.RedisService;
import interview.guide.modules.admin.model.AdminUserDTO;
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
    private final RedisService redisService;

    private String encryptPassword(String password) {
        String salt = "ai-interview-2026-";
        return DigestUtils.md5DigestAsHex((salt + password).getBytes(StandardCharsets.UTF_8));
    }

    public AuthResponse register(AuthRequest request) {
        // 1. 校验邮箱验证码
        String cachedEmailCode = redisService.get("EMAIL_CODE:" + request.email());
        if (cachedEmailCode == null || !cachedEmailCode.equals(request.emailCode())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "邮箱验证码错误或已过期"); // 💡 修改点
        }

        // 2. 校验账号是否冲突
        if (userRepository.existsByUsername(request.username())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "该用户名已被注册"); // 💡 修改点
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

        return new AuthResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getRole(),
                null
        );
    }

    // ================= 前台用户登录 =================
    public AuthResponse login(AuthRequest request) {
        UserEntity user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "用户名或密码错误")); // 💡 修改点

        if (!user.getPassword().equals(encryptPassword(request.password()))) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "用户名或密码错误"); // 💡 修改点
        }

        if ("BANNED".equals(user.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "您的账号已被封禁，请联系管理员"); // 💡 修改点
        }

        String fullAvatarUrl = null;
        if (user.getAvatar() != null && !user.getAvatar().isEmpty()) {
            fullAvatarUrl = fileStorageService.getFileUrl(user.getAvatar());
        }

        String token = UUID.randomUUID().toString().replace("-", "");

        return new AuthResponse(token, user.getId(), user.getUsername(), user.getRole(), fullAvatarUrl);
    }

    // ================= 后台管理员登录 =================
    public AuthResponse adminLogin(AuthRequest request) {
        UserEntity user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "用户名或密码错误")); // 💡 修改点

        if (!user.getPassword().equals(encryptPassword(request.password()))) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "用户名或密码错误"); // 💡 修改点
        }

        // 💡 新增拦截：仅允许管理员登录后台
        if (!"ADMIN".equals(user.getRole())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "非管理员账号，无权访问管理系统"); // 💡 修改点
        }

        if ("BANNED".equals(user.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "您的账号已被封禁"); // 💡 修改点
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
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "用户不存在")); // 💡 修改点

        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("email", user.getEmail());
        userInfo.put("role", user.getRole());
        userInfo.put("phone", user.getPhone());
        userInfo.put("targetPosition", user.getTargetPosition());
        userInfo.put("bio", user.getBio());
        userInfo.put("createdAt", user.getCreatedAt());

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
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "用户不存在")); // 💡 修改点

        user.setPhone(phone);
        user.setTargetPosition(targetPosition);
        user.setBio(bio);
        userRepository.save(user);
    }

    public String updateAvatar(Long userId, MultipartFile file) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "用户不存在")); // 💡 修改点

        if (user.getAvatar() != null && !user.getAvatar().isEmpty()) {
            fileStorageService.deleteFile(user.getAvatar());
        }

        String fileKey = fileStorageService.uploadAvatar(file);
        user.setAvatar(fileKey);
        userRepository.save(user);

        return fileStorageService.getFileUrl(fileKey);
    }

    public void updatePassword(Long userId, String oldPassword, String newPassword) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "用户不存在")); // 💡 修改点

        if (!user.getPassword().equals(encryptPassword(oldPassword))) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "原密码不正确"); // 💡 修改点
        }

        user.setPassword(encryptPassword(newPassword));
        userRepository.save(user);
    }

    // 增加重置密码的核心业务逻辑
    public void resetPassword(String email, String emailCode, String newPassword) {
        // 1. 校验邮箱验证码
        String cachedEmailCode = redisService.get("EMAIL_CODE:" + email);
        if (cachedEmailCode == null || !cachedEmailCode.equals(emailCode)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "邮箱验证码错误或已过期"); // 💡 修改点
        }

        // 2. 查找用户是否存在
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "该邮箱尚未注册账号")); // 💡 修改点

        // 3. 更新密码并保存
        user.setPassword(encryptPassword(newPassword));
        userRepository.save(user);

        // 4. 修改成功后销毁验证码，防止重复使用
        redisService.delete("EMAIL_CODE:" + email);
    }

    // ================= 以下为新增的后台管理功能 =================

    // 获取所有用户统计信息
    public List<AdminUserDTO> getAllUsersWithStats() {
        List<AdminUserDTO> users = userRepository.findAllUserStats();
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
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "用户不存在")); // 💡 修改点

        if ("ADMIN".equals(user.getRole()) && "BANNED".equals(status)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "系统安全限制：不能封禁管理员账号"); // 💡 修改点
        }

        user.setStatus(status);
        userRepository.save(user);
    }

    // 管理员强制重置用户密码
    public void adminResetPassword(Long userId, String newPassword) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "用户不存在")); // 💡 修改点
        user.setPassword(encryptPassword(newPassword));
        userRepository.save(user);
    }

    // 角色分配
    public void updateUserRole(Long userId, String role) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "用户不存在")); // 💡 修改点
        user.setRole(role);
        userRepository.save(user);
    }
}