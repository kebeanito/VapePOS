package vapepos_backend.controller;

import vapepos_backend.entity.User;
import vapepos_backend.repository.UserRepository;
import vapepos_backend.security.JwtService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request) {

        if (request.username() == null ||
                request.username().trim().isEmpty()) {

            return ResponseEntity.badRequest().body(
                    Map.of("message", "Username is required"));
        }

        if (request.password() == null ||
                request.password().isEmpty()) {

            return ResponseEntity.badRequest().body(
                    Map.of("message", "Password is required"));
        }

        User user = userRepository
                .findByUsername(request.username().trim())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(401).body(
                    Map.of("message", "Invalid username or password"));
        }

        if (!passwordEncoder.matches(
                request.password(),
                user.getPassword())) {
            return ResponseEntity.status(401).body(
                    Map.of("message", "Invalid username or password"));
        }

        String token = jwtService.generateToken(
                user.getUsername(),
                user.getId(),
                user.getRole().name());

        return ResponseEntity.ok(
                Map.of(
                        "message", "Login successful",
                        "token", token,
                        "userId", user.getId(),
                        "username", user.getUsername(),
                        "fullName", user.getFullName(),
                        "role", user.getRole().name()));
    }

    public record LoginRequest(
            String username,
            String password) {
    }
}