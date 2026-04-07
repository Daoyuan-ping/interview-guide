package interview.guide.modules.user.controller;

import interview.guide.modules.user.model.AuthDTO.CaptchaResponse;
import interview.guide.modules.user.service.VerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Slf4j
@CrossOrigin("*")
@RestController
@RequestMapping("/api/verify")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    @GetMapping("/captcha")
    public CaptchaResponse getCaptcha() {
        try {
            return verificationService.generateCaptcha();
        } catch (Throwable e) {
            // 🚨 强制打印最底层的致命错误，无视任何拦截器！
            System.err.println("========== 图形验证码接口崩溃了 ==========");
            e.printStackTrace();
            System.err.println("=========================================");
            throw new RuntimeException("生成验证码失败", e);
        }
    }

    @PostMapping("/send-email")
    public String sendEmailCode(@RequestBody Map<String, String> request) {
        try {
            verificationService.sendEmailCode(
                    request.get("email"),
                    request.get("captchaKey"),
                    request.get("captchaCode")
            );
            return "验证码发送成功";
        } catch (Throwable e) {
            // 🚨 强制打印邮件发送时的致命错误
            System.err.println("========== 发送邮件接口崩溃了 ==========");
            e.printStackTrace();
            System.err.println("========================================");
            throw new RuntimeException("发送邮件失败", e);
        }
    }
}