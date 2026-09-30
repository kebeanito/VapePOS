package vapepos_backend.config;

import vapepos_backend.entity.Branch;
import vapepos_backend.entity.Role;
import vapepos_backend.entity.User;
import vapepos_backend.repository.BranchRepository;
import vapepos_backend.repository.UserRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedData(
            BranchRepository branchRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {

            // =========================
            // SEED BRANCHES
            // =========================

            createBranchIfNotExists(branchRepository, "Red V");
            createBranchIfNotExists(branchRepository, "Iyam");
            createBranchIfNotExists(branchRepository, "Pleasantville");
            createBranchIfNotExists(branchRepository, "M.L. Tagarao");

            // =========================
            // SEED USERS
            // =========================

            createUserIfNotExists(
                    userRepository,
                    passwordEncoder,
                    "admin",
                    "System Administrator",
                    Role.ADMIN,
                    "admin123");

            createUserIfNotExists(
                    userRepository,
                    passwordEncoder,
                    "cashier1",
                    "Cashier 1",
                    Role.CASHIER,
                    "cashier123");

            createUserIfNotExists(
                    userRepository,
                    passwordEncoder,
                    "cashier2",
                    "Cashier 2",
                    Role.CASHIER,
                    "cashier123");

            createUserIfNotExists(
                    userRepository,
                    passwordEncoder,
                    "cashier3",
                    "Cashier 3",
                    Role.CASHIER,
                    "cashier123");

            createUserIfNotExists(
                    userRepository,
                    passwordEncoder,
                    "cashier4",
                    "Cashier 4",
                    Role.CASHIER,
                    "cashier123");
        };
    }

    private void createBranchIfNotExists(
            BranchRepository branchRepository,
            String name) {
        if (branchRepository.findByName(name).isEmpty()) {

            Branch branch = new Branch();
            branch.setName(name);

            branchRepository.save(branch);

            System.out.println("Created branch: " + name);
        }
    }

    private void createUserIfNotExists(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            String username,
            String fullName,
            Role role,
            String password) {
        if (userRepository.findByUsername(username).isEmpty()) {

            User user = new User();

            user.setUsername(username);
            user.setFullName(fullName);
            user.setRole(role);

            // Never store plain-text passwords
            user.setPassword(passwordEncoder.encode(password));

            userRepository.save(user);

            System.out.println(
                    "Created user: " + username + " (" + role + ")");
        }
    }
}