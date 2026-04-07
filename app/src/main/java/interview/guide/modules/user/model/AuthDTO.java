package interview.guide.modules.user.model;

/**
 * Project:     interview-guide
 * Author:      32107
 * Created on:  2026/4/7 20:29
 */


public class AuthDTO {
    public record AuthRequest(
            String username,
            String password,
            String email,          // 邮箱
            String emailCode,      // 邮箱验证码
            String captchaKey,     // 图形验证码标识
            String captchaCode     // 图形验证码值
    ) {}

    public record AuthResponse(String token, Long userId, String username, String role) {}

    public record CaptchaResponse(String captchaKey, String captchaBase64) {}
}