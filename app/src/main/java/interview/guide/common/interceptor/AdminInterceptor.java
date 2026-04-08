package interview.guide.common.interceptor;

/**
 * Project:     interview-guide
 * Author:      32107
 * Created on:  2026/4/8 08:12
 */
import interview.guide.modules.user.model.UserEntity;
import interview.guide.modules.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class AdminInterceptor implements HandlerInterceptor {

    private final UserRepository userRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 放行跨域预检请求
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        // 兼容获取 adminId 或 userId 参数
        String userIdStr = request.getParameter("adminId");
        if (userIdStr == null || userIdStr.isBlank()) {
            userIdStr = request.getParameter("userId");
        }

        if (userIdStr == null || userIdStr.isBlank()) {
            throw new RuntimeException("无权访问：缺少身份标识(adminId/userId)");
        }

        try {
            Long userId = Long.parseLong(userIdStr);
            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));

            if (!"ADMIN".equals(user.getRole())) {
                throw new RuntimeException("拒绝访问：您的账号不是管理员");
            }
        } catch (NumberFormatException e) {
            throw new RuntimeException("非法参数：ID格式错误");
        }

        // 校验通过，放行请求到 Controller
        return true;
    }
}