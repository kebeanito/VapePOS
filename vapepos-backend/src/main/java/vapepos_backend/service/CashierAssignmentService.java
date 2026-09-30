package vapepos_backend.service;

import vapepos_backend.entity.Branch;
import vapepos_backend.entity.CashierAssignment;
import vapepos_backend.entity.Role;
import vapepos_backend.entity.User;
import vapepos_backend.repository.BranchRepository;
import vapepos_backend.repository.CashierAssignmentRepository;
import vapepos_backend.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class CashierAssignmentService {

    private final CashierAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;

    public CashierAssignmentService(
            CashierAssignmentRepository assignmentRepository,
            UserRepository userRepository,
            BranchRepository branchRepository) {
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
    }

    /**
     * Get the cashier's assignment for today.
     */
    public CashierAssignment getTodayAssignment(Long userId) {

        return assignmentRepository
                .findByUserIdAndShiftDate(userId, LocalDate.now())
                .orElse(null);
    }

    /**
     * Assign a cashier to a branch for today.
     *
     * If the cashier already has an assignment today,
     * they cannot select another branch.
     */
    @Transactional
    public CashierAssignment assignToday(
            Long userId,
            Long branchId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Only CASHIER accounts can have cashier assignments
        if (user.getRole() != Role.CASHIER) {
            throw new RuntimeException(
                    "Only cashier accounts can be assigned to a branch");
        }

        LocalDate today = LocalDate.now();

        // Check if cashier already has an assignment today
        CashierAssignment existingAssignment = assignmentRepository
                .findByUserIdAndShiftDate(userId, today)
                .orElse(null);

        if (existingAssignment != null) {
            throw new RuntimeException(
                    "You are already assigned to "
                            + existingAssignment.getBranch().getName()
                            + " for today");
        }

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));

        CashierAssignment assignment = new CashierAssignment();

        assignment.setUser(user);
        assignment.setBranch(branch);
        assignment.setShiftDate(today);

        return assignmentRepository.save(assignment);
    }

    /**
     * Get all assignments for today.
     * Mainly useful for the admin dashboard.
     */
    public List<CashierAssignment> getTodayAssignments() {

        LocalDate today = LocalDate.now();

        return assignmentRepository.findAll()
                .stream()
                .filter(assignment -> assignment.getShiftDate().equals(today))
                .toList();
    }
}