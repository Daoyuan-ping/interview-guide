package interview.guide.modules.user.controller;

/**
 * Project:     interview-guide
 * Author:      32107
 * Created on:  2026/4/7 22:10
 */


import interview.guide.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/info")
    public Map<String, Object> getUserInfo(@RequestParam Long userId) {
        return userService.getUserInfo(userId);
    }

    @PostMapping("/avatar")
    public String updateAvatar(@RequestParam Long userId, @RequestParam("file") MultipartFile file) {
        return userService.updateAvatar(userId, file);
    }

    @PostMapping("/password")
    public void updatePassword(@RequestParam Long userId,
                               @RequestParam String oldPassword,
                               @RequestParam String newPassword) {
        userService.updatePassword(userId, oldPassword, newPassword);
    }
    public static class UpdateProfileRequest {
        public Long userId;
        public String phone;
        public String targetPosition;
        public String bio;
    }
    @PostMapping("/update")
    public void updateProfile(@RequestBody UpdateProfileRequest request) {
        userService.updateProfile(request.userId, request.phone, request.targetPosition, request.bio);
    }
}