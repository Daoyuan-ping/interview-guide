package interview.guide.modules.user.service;

/**
 * Project:     interview-guide
 * Author:      32107
 * Created on:  2026/4/7 21:05
 */


import cn.hutool.captcha.CaptchaUtil;
import cn.hutool.captcha.LineCaptcha;
import cn.hutool.core.util.RandomUtil;
import interview.guide.infrastructure.redis.RedisService;
import interview.guide.modules.user.model.AuthDTO.CaptchaResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationService {

    private final RedisService redisService;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // 1. 生成图形验证码
    public CaptchaResponse generateCaptcha() {
        // 创建线段干扰的验证码 (宽120, 高40, 4个字符, 20条干扰线)
        LineCaptcha lineCaptcha = CaptchaUtil.createLineCaptcha(120, 40, 4, 20);
        String code = lineCaptcha.getCode();
        String base64 = lineCaptcha.getImageBase64Data(); // 自带 data:image/png;base64, 前缀
        String key = UUID.randomUUID().toString().replace("-", "");

        // 图形验证码存入 Redis，有效期 5 分钟
        redisService.set("CAPTCHA:" + key, code, Duration.ofMinutes(5));

        log.debug("生成图形验证码: key={}, code={}", key, code);
        return new CaptchaResponse(key, base64);
    }

    // 2. 发送邮箱验证码
    public void sendEmailCode(String email, String captchaKey, String captchaCode) {
        // 校验图形验证码
        String cachedCaptcha = redisService.get("CAPTCHA:" + captchaKey);
        if (cachedCaptcha == null || !cachedCaptcha.equalsIgnoreCase(captchaCode)) {
            throw new RuntimeException("图形验证码错误或已过期");
        }

        // 图形验证码用完即毁
        redisService.delete("CAPTCHA:" + captchaKey);

        // 生成 6 位随机数字验证码
        String emailCode = RandomUtil.randomNumbers(6);

        // 发送邮件
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject("【AI Interview】账号注册验证码");
            // 👇 修改点 1：邮件文案提示为 3 分钟
            message.setText("您的注册验证码为：" + emailCode + "，有效期为 3 分钟。如果这不是您的操作，请忽略此邮件。");
            mailSender.send(message);
            log.info("邮箱验证码已发送至: {}", email);
        } catch (Exception e) {
            log.error("邮件发送失败", e);
            throw new RuntimeException("邮件发送失败，请检查邮箱地址或稍后再试");
        }

        // 👇 修改点 2：存入 Redis，有效期改为 3 分钟
        redisService.set("EMAIL_CODE:" + email, emailCode, Duration.ofMinutes(3));
    }
}