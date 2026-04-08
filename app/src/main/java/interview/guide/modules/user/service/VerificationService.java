package interview.guide.modules.user.service;

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

    /**
     * 1. 生成图形验证码
     */
    public CaptchaResponse generateCaptcha() {
        // 创建线段干扰的验证码 (宽120, 高40, 4个字符, 20条干扰线)
        LineCaptcha lineCaptcha = CaptchaUtil.createLineCaptcha(120, 40, 4, 20);
        String code = lineCaptcha.getCode();
        String base64 = lineCaptcha.getImageBase64Data(); // 自带 data:image/png;base64, 前缀
        String key = UUID.randomUUID().toString().replace("-", "");

        // 💡 改进点：存储时统一转为大写，并稍微延长有效期至 10 分钟以防用户操作慢
        redisService.set("CAPTCHA:" + key, code.toUpperCase(), Duration.ofMinutes(10));

        log.info("生成图形验证码成功: key={}, code={}", key, code);
        return new CaptchaResponse(key, base64);
    }

    /**
     * 2. 发送邮箱验证码
     */
    public void sendEmailCode(String email, String captchaKey, String captchaCode) {
        // 💡 改进点：增加参数非空校验
        if (captchaKey == null || captchaCode == null) {
            throw new RuntimeException("图形验证码参数不能为空");
        }

        // 校验图形验证码
        String cachedCaptcha = redisService.get("CAPTCHA:" + captchaKey);

        // 💡 改进点：记录校验日志，方便排查数据对齐问题
        log.info("开始校验图形验证码: key={}, 用户输入={}, Redis记录={}", captchaKey, captchaCode, cachedCaptcha);

        if (cachedCaptcha == null) {
            throw new RuntimeException("图形验证码已过期，请刷新图片");
        }

        // 💡 改进点：校验前去除空格并统一转大写比较
        if (!cachedCaptcha.equals(captchaCode.trim().toUpperCase())) {
            throw new RuntimeException("图形验证码错误");
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
            // 邮件文案提示为 3 分钟
            message.setText("您的注册验证码为：" + emailCode + "，有效期为 3 分钟。如果这不是您的操作，请忽略此邮件。");
            mailSender.send(message);
            log.info("邮箱验证码已发送至: {}", email);
        } catch (Exception e) {
            log.error("邮件发送失败: {}", e.getMessage());
            throw new RuntimeException("邮件发送失败，请检查邮箱地址或稍后再试");
        }

        // 存入 Redis，有效期 3 分钟
        redisService.set("EMAIL_CODE:" + email, emailCode, Duration.ofMinutes(3));
    }
}