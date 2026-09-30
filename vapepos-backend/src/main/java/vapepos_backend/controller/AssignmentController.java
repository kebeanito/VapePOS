package vapepos_backend.controller;

import vapepos_backend.entity.Branch;
import vapepos_backend.entity.CashierAssignment;
import vapepos_backend.entity.Role;
import vapepos_backend.entity.User;
import vapepos_backend.repository.BranchRepository;
import vapepos_backend.repository.CashierAssignmentRepository;
import vapepos_backend.security.CurrentUserService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private final CashierAssignmentRepository assignmentRepository;
    private final BranchRepository branchRepository;
    private final CurrentUserService currentUserService;

    public AssignmentController(
            CashierAssignmentRepository assignmentRepository,
            BranchRepository branchRepository,
            CurrentUserService currentUserService) {

        this.assignmentRepository = assignmentRepository;
        this.branchRepository = branchRepository;
        this.currentUserService = currentUserService;
    }

    /*
     * CASHIER selects their branch for today.
     */
    @PostMapping
    public ResponseEntity<?> createAssignment(
            @RequestBody AssignmentRequest request) {

        try {

            User user = currentUserService.getCurrentUser();

            // Only cashiers can create a cashier assignment.
            if (user.getRole() != Role.CASHIER) {
                return ResponseEntity.status(403)
                        .body(Map.of(
                                "message",
                                "Only cashiers can select a branch"));
            }

            if (request.branchId() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "message",
                                "Branch ID is required"));
            }

            LocalDate today = LocalDate.now();

            /*
             * Check if this cashier already has an assignment today.
             */
            if (assignmentRepository
                    .findByUserIdAndShiftDate(
                            user.getId(),
                            today)
                    .isPresent()) {

                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "message",
                                "You already have a branch assignment for today"));
            }

            Branch branch = branchRepository
                    .findById(request.branchId())
                    .orElse(null);

            if (branch == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "message",
                                "Branch not found"));
            }

            CashierAssignment assignment = new CashierAssignment();

            assignment.setUser(user);
            assignment.setBranch(branch);
            assignment.setShiftDate(today);

            CashierAssignment savedAssignment = assignmentRepository.save(assignment);

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Branch assigned successfully",

                            "assignmentId",
                            savedAssignment.getId(),

                            "cashier",
                            user.getUsername(),

                            "branchId",
                            branch.getId(),

                            "branch",
                            branch.getName(),

                            "shiftDate",
                            savedAssignment.getShiftDate(),

                            "assignedAt",
                            savedAssignment.getAssignedAt()));

        } catch (Exception e) {

            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "message",
                            "Failed to create branch assignment"));
        }
    }

    /*
     * Get the current cashier's assignment for today.
     */
    @GetMapping("/today")
    public ResponseEntity<?> getTodayAssignment() {

        User user = currentUserService.getCurrentUser();

        if (user.getRole() != Role.CASHIER) {
            return ResponseEntity.status(403)
                    .body(Map.of(
                            "message",
                            "This endpoint is for cashiers"));
        }

        LocalDate today = LocalDate.now();

        CashierAssignment assignment = assignmentRepository
                .findByUserIdAndShiftDate(
                        user.getId(),
                        today)
                .orElse(null);

        if (assignment == null) {
            return ResponseEntity.ok(
                    Map.of(
                            "assigned",
                            false,
                            "message",
                            "No branch assignment for today"));
        }

        return ResponseEntity.ok(
                Map.of(
                        "assigned",
                        true,
                        "assignmentId",
                        assignment.getId(),
                        "branchId",
                        assignment.getBranch().getId(),
                        "branch",
                        assignment.getBranch().getName(),
                        "shiftDate",
                        assignment.getShiftDate(),
                        "assignedAt",
                        assignment.getAssignedAt()));
    }

    /*
     * ADMIN can view all cashier assignments for today.
     */
    @GetMapping("/today/all")
    public ResponseEntity<?> getTodayAssignments() {

        if (!currentUserService.isAdmin()) {
            return ResponseEntity.status(403)
                    .body(Map.of(
                            "message",
                            "Only administrators can view all assignments"));
        }

        LocalDate today = LocalDate.now();

        List<CashierAssignment> assignments = assignmentRepository
                .findByShiftDateOrderByAssignedAtDesc(
                        today);

        return ResponseEntity.ok(assignments);
    }

    /*
     * ADMIN can view assignment history.
     */
    @GetMapping("/history")
    public ResponseEntity<?> getAssignmentHistory() {

        if (!currentUserService.isAdmin()) {
            return ResponseEntity.status(403)
                    .body(Map.of(
                            "message",
                            "Only administrators can view assignment history"));
        }

        return ResponseEntity.ok(
                assignmentRepository.findAll());
    }

    public record AssignmentRequest(
            Long branchId) {
    }
}