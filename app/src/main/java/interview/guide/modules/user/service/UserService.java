package interview.guide.modules.user.service;
import interview.guide.infrastructure.file.FileStorageService;
import interview.guide.infrastructure.redis.RedisService;
import interview.guide.modules.user.model.AuthDTO.AuthRequest;
import interview.guide.modules.user.model.AuthDTO.AuthResponse;
import interview.guide.modules.user.model.UserEntity;
import interview.guide.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
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

        userRepository.save(user);

        // 注册成功后销毁验证码，防止重复使用
        redisService.delete("EMAIL_CODE:" + request.email());

        // 简单 Token（后续如果要接入 JWT 等安全框架，可在这里替换）
        String token = UUID.randomUUID().toString().replace("-", "");
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getRole());
    }

    public AuthResponse login(AuthRequest request) {
        UserEntity user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new RuntimeException("用户名或密码错误"));

        if (!user.getPassword().equals(encryptPassword(request.password()))) {
            throw new RuntimeException("用户名或密码错误");
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getRole());
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

    // 新增：更新基础资料
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
}