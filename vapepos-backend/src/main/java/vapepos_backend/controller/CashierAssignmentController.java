package vapepos_backend.controller;

import vapepos_backend.entity.CashierAssignment;
import vapepos_backend.service.CashierAssignmentService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cashier-assignments")
public class CashierAssignmentController {

    private final CashierAssignmentService assignmentService;

    public CashierAssignmentController(
            CashierAssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    /**
     * Get today's assignment for a cashier.
     *
     * Example:
     * GET /api/cashier-assignments/today/2
     */
    @GetMapping("/today/{userId}")
    public ResponseEntity<?> getTodayAssignment(
            @PathVariable Long userId) {

        CashierAssignment assignment = assignmentService.getTodayAssignment(userId);

        if (assignment == null) {
            return ResponseEntity.ok(
                    Map.of(
                            "assigned", false,
                            "message", "No branch assignment for today"));
        }

        return ResponseEntity.ok(
                Map.of(
                        "assigned", true,
                        "userId", assignment.getUser().getId(),
                        "branchId", assignment.getBranch().getId(),
                        "branchName", assignment.getBranch().getName(),
                        "shiftDate", assignment.getShiftDate()));
    }

    /**
     * Assign cashier to a branch for today.
     *
     * Example:
     * POST /api/cashier-assignments
     *
     * {
     * "userId": 2,
     * "branchId": 1
     * }
     */
    @PostMapping
    public ResponseEntity<?> assignToday(
            @RequestBody Map<String, Long> request) {

        Long userId = request.get("userId");
        Long branchId = request.get("branchId");

        if (userId == null || branchId == null) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            "userId and branchId are required"));
        }

        try {

            CashierAssignment assignment = assignmentService.assignToday(
                    userId,
                    branchId);

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Branch assigned successfully",

                            "userId",
                            assignment.getUser().getId(),

                            "branchId",
                            assignment.getBranch().getId(),

                            "branchName",
                            assignment.getBranch().getName(),

                            "shiftDate",
                            assignment.getShiftDate()));

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            e.getMessage()));
        }
    }

    /**
     * Get all cashier assignments for today.
     *
     * Example:
     * GET /api/cashier-assignments/today
     */
    @GetMapping("/today")
    public ResponseEntity<List<CashierAssignment>> getTodayAssignments() {

        return ResponseEntity.ok(
                assignmentService.getTodayAssignments());
    }
}