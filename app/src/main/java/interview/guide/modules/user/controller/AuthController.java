package interview.guide.modules.user.controller;

/**
 * Project:     interview-guide
 * Author:      32107
 * Created on:  2026/4/7 20:33
 */


import interview.guide.modules.user.model.AuthDTO.AuthRequest;
import interview.guide.modules.user.model.AuthDTO.AuthResponse;
import interview.guide.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@CrossOrigin("*") // 允许前端跨域访问
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public AuthResponse register(@RequestBody AuthRequest request) {
        return userService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request) {
        return userService.login(request);
    }
}