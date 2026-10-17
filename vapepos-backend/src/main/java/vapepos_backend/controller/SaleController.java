
package vapepos_backend.controller;

import vapepos_backend.entity.CashierAssignment;
import vapepos_backend.entity.Role;
import vapepos_backend.entity.Sale;
import vapepos_backend.repository.CashierAssignmentRepository;
import vapepos_backend.repository.SaleItemRepository;
import vapepos_backend.repository.SaleRepository;
import vapepos_backend.security.CurrentUserService;
import vapepos_backend.service.SaleService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    private final SaleService saleService;
    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final CashierAssignmentRepository assignmentRepository;
    private final CurrentUserService currentUserService;

    public SaleController(
            SaleService saleService,
            SaleRepository saleRepository,
            SaleItemRepository saleItemRepository,
            CashierAssignmentRepository assignmentRepository,
            CurrentUserService currentUserService) {

        this.saleService = saleService;
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.assignmentRepository = assignmentRepository;
        this.currentUserService = currentUserService;
    }

    // Process a sale
    @PostMapping
    public ResponseEntity<?> createSale(@RequestBody SaleRequest request) {
        try {
            Sale sale = saleService.createSale(
                    request.items(),
                    request.paymentMethod());

            return ResponseEntity.ok(Map.of(
                    "message", "Sale completed successfully",
                    "saleId", sale.getId(),
                    "totalAmount", sale.getTotalAmount(),
                    "paymentMethod", sale.getPaymentMethod(),
                    "createdAt", sale.getCreatedAt()));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", e.getMessage()));

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.internalServerError().body(Map.of(
                    "message", "Failed to process sale"));
        }
    }

    // Get all sales (admin only)
    @GetMapping
    public ResponseEntity<?> getAllSales() {
        if (!currentUserService.isAdmin()) {
            return ResponseEntity.status(403).body(Map.of(
                    "message", "Only administrators can view all sales"));
        }

        List<Sale> sales = saleRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();

        List<Map<String, Object>> result = new ArrayList<>();

        for (Sale sale : sales) {
            Map<String, Object> data = new HashMap<>();

            data.put("id", sale.getId());
            data.put("cashier", sale.getUser().getUsername());
            data.put("branch", sale.getBranch().getName());
            data.put("totalAmount", sale.getTotalAmount());
            data.put("paymentMethod", sale.getPaymentMethod());
            data.put("createdAt", sale.getCreatedAt());

            result.add(data);
        }

        return ResponseEntity.ok(result);
    }

    // Get sales for a specific branch
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<?> getSalesByBranch(@PathVariable Long branchId) {
        if (!currentUserService.canAccessBranch(branchId)) {
            return ResponseEntity.status(403).body(Map.of(
                    "message", "You are not allowed to access this branch"));
        }

        return ResponseEntity.ok(
                saleRepository.findByBranchIdOrderByCreatedAtDesc(branchId));
    }

    // Get sales history for the cashier's assigned branch
    @GetMapping("/my-branch")
    public ResponseEntity<?> getMyBranchSales() {
        try {
            if (currentUserService.getCurrentUser().getRole() != Role.CASHIER) {
                return ResponseEntity.status(403).body(Map.of(
                        "message", "This endpoint is for cashiers only"));
            }

            Long userId = currentUserService.getCurrentUserId();
            LocalDate today = LocalDate.now();

            Optional<CashierAssignment> assignment = assignmentRepository.findByUserIdAndShiftDate(userId, today);

            if (assignment.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }

            Long branchId = assignment.get().getBranch().getId();

            List<Sale> sales = saleRepository.findByBranchIdOrderByCreatedAtDesc(branchId);

            List<Map<String, Object>> result = new ArrayList<>();

            for (Sale sale : sales) {
                Map<String, Object> data = new HashMap<>();

                data.put("id", sale.getId());
                data.put("totalAmount", sale.getTotalAmount());
                data.put("paymentMethod", sale.getPaymentMethod());
                data.put("createdAt", sale.getCreatedAt());
                data.put("cashier", sale.getUser().getUsername());
                data.put("branch", sale.getBranch().getName());

                result.add(data);
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.internalServerError().body(Map.of(
                    "message", "Failed to load sales history"));
        }
    }

    // Get a specific sale
    @GetMapping("/{saleId}")
    public ResponseEntity<?> getSaleById(@PathVariable Long saleId) {
        Sale sale = saleRepository.findById(saleId).orElse(null);

        if (sale == null) {
            return ResponseEntity.notFound().build();
        }

        if (!currentUserService.canAccessBranch(sale.getBranch().getId())) {
            return ResponseEntity.status(403).body(Map.of(
                    "message", "You are not allowed to access this sale"));
        }

        return ResponseEntity.ok(Map.of(
                "id", sale.getId(),
                "cashier", sale.getUser().getUsername(),
                "branch", sale.getBranch().getName(),
                "totalAmount", sale.getTotalAmount(),
                "paymentMethod", sale.getPaymentMethod(),
                "createdAt", sale.getCreatedAt(),
                "items", saleItemRepository.findBySaleId(saleId)));
    }

    // Get today's sales for the logged-in cashier
    @GetMapping("/today")
    public ResponseEntity<?> getTodaysSales() {
        try {
            if (currentUserService.getCurrentUser().getRole() != Role.CASHIER) {
                return ResponseEntity.status(403).body(Map.of(
                        "message", "This endpoint is for cashiers only"));
            }

            Long userId = currentUserService.getCurrentUserId();
            LocalDate today = LocalDate.now();

            Optional<CashierAssignment> assignment = assignmentRepository.findByUserIdAndShiftDate(userId, today);

            // No assignment today means no branch sales to display.
            if (assignment.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "totalSales", BigDecimal.ZERO,
                        "transactionCount", 0,
                        "recentSales", List.of()));
            }

            // Use the saved assignment without enforcing the 9 PM cutoff.
            Long branchId = assignment.get().getBranch().getId();

            LocalDateTime start = today.atStartOfDay();
            LocalDateTime end = today.plusDays(1).atStartOfDay();

            List<Sale> sales = saleRepository
                    .findByBranchIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                            branchId, start, end);

            List<Map<String, Object>> recentSales = new ArrayList<>();

            for (Sale sale : sales) {
                Map<String, Object> saleData = new HashMap<>();

                saleData.put("id", sale.getId());
                saleData.put("totalAmount", sale.getTotalAmount());
                saleData.put("paymentMethod", sale.getPaymentMethod());
                saleData.put("createdAt", sale.getCreatedAt());
                saleData.put("cashier", sale.getUser().getUsername());

                recentSales.add(saleData);
            }

            BigDecimal totalSales = sales.stream()
                    .map(Sale::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            return ResponseEntity.ok(Map.of(
                    "totalSales", totalSales,
                    "transactionCount", sales.size(),
                    "recentSales", recentSales));

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.internalServerError().body(Map.of(
                    "message", "Failed to load today's sales"));
        }
    }

    public record SaleRequest(
            List<SaleService.SaleItemRequest> items,
            String paymentMethod) {
    }
}
