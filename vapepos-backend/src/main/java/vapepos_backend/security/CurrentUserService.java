package vapepos_backend.security;

import vapepos_backend.entity.CashierAssignment;
import vapepos_backend.entity.Role;
import vapepos_backend.entity.User;
import vapepos_backend.repository.CashierAssignmentRepository;
import vapepos_backend.repository.UserRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;
    private final CashierAssignmentRepository assignmentRepository;

    // Cashier shift ends at 9:00 PM
    private static final LocalTime SHIFT_END_TIME = LocalTime.of(21, 0);

    public CurrentUserService(
            UserRepository userRepository,
            CashierAssignmentRepository assignmentRepository) {

        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
    }

    public User getCurrentUser() {

        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new RuntimeException(
                    "User is not authenticated");
        }

        String username = authentication.getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(
                        "Current user not found"));
    }

    public boolean isAdmin() {
        return getCurrentUser()
                .getRole()
                .equals(Role.ADMIN);
    }

    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    public Long getAssignedBranchId() {

        User user = getCurrentUser();

        // Admin does not have a cashier assignment.
        if (user.getRole() != Role.CASHIER) {
            return null;
        }

        LocalDate today = LocalDate.now();

        CashierAssignment assignment = assignmentRepository
                .findByUserIdAndShiftDate(
                        user.getId(),
                        today)
                .orElseThrow(() -> new RuntimeException(
                        "No branch assignment for today"));

        /*
         * If an assignment has already been explicitly ended,
         * the cashier can no longer use that assignment.
         */
        if (assignment.getEndedAt() != null) {

            throw new RuntimeException(
                    "Your shift has ended");
        }

        /*
         * Cashier access ends automatically at 9:00 PM.
         */
        if (!LocalTime.now().isBefore(SHIFT_END_TIME)) {

            if (assignment.getEndedAt() == null) {

                assignment.setEndedAt(
                        java.time.LocalDateTime.now());

                assignmentRepository.save(assignment);
            }

            throw new RuntimeException(
                    "Your shift has ended for today");
        }

        return assignment.getBranch().getId();
    }

    public boolean canAccessBranch(Long branchId) {

        User user = getCurrentUser();

        // Admin can access every branch.
        if (user.getRole() == Role.ADMIN) {
            return true;
        }

        Long assignedBranchId = getAssignedBranchId();

        return assignedBranchId.equals(branchId);
    }
}