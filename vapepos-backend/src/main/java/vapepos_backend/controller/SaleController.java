package vapepos_backend.controller;

import vapepos_backend.entity.Sale;
import vapepos_backend.repository.SaleItemRepository;
import vapepos_backend.repository.SaleRepository;
import vapepos_backend.security.CurrentUserService;
import vapepos_backend.service.SaleService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    private final SaleService saleService;
    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final CurrentUserService currentUserService;

    public SaleController(
            SaleService saleService,
            SaleRepository saleRepository,
            SaleItemRepository saleItemRepository,
            CurrentUserService currentUserService) {

        this.saleService = saleService;
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    public ResponseEntity<?> createSale(
            @RequestBody SaleRequest request) {

        try {

            Sale sale = saleService.createSale(
                    request.items(),
                    request.paymentMethod());

            return ResponseEntity.ok(
                    Map.of(
                            "message", "Sale completed successfully",
                            "saleId", sale.getId(),
                            "totalAmount", sale.getTotalAmount(),
                            "paymentMethod", sale.getPaymentMethod(),
                            "createdAt", sale.getCreatedAt()));

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message", e.getMessage()));

        } catch (Exception e) {

            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "message", "Failed to process sale"));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllSales() {

        if (!currentUserService.isAdmin()) {
            return ResponseEntity.status(403)
                    .body(Map.of(
                            "message",
                            "Only administrators can view all sales"));
        }

        return ResponseEntity.ok(
                saleRepository.findAll());
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<?> getSalesByBranch(
            @PathVariable Long branchId) {

        if (!currentUserService.canAccessBranch(branchId)) {
            return ResponseEntity.status(403)
                    .body(Map.of(
                            "message",
                            "You are not allowed to access this branch"));
        }

        return ResponseEntity.ok(
                saleRepository
                        .findByBranchIdOrderByCreatedAtDesc(branchId));
    }

    @GetMapping("/{saleId}")
    public ResponseEntity<?> getSaleById(
            @PathVariable Long saleId) {

        Sale sale = saleRepository
                .findById(saleId)
                .orElse(null);

        if (sale == null) {
            return ResponseEntity.notFound().build();
        }

        if (!currentUserService
                .canAccessBranch(sale.getBranch().getId())) {

            return ResponseEntity.status(403)
                    .body(Map.of(
                            "message",
                            "You are not allowed to access this sale"));
        }

        return ResponseEntity.ok(
                Map.of(
                        "id", sale.getId(),
                        "cashier", sale.getUser().getUsername(),
                        "branch", sale.getBranch().getName(),
                        "totalAmount", sale.getTotalAmount(),
                        "paymentMethod", sale.getPaymentMethod(),
                        "createdAt", sale.getCreatedAt(),
                        "items",
                        saleItemRepository.findBySaleId(saleId)));
    }

    public record SaleRequest(
            List<SaleService.SaleItemRequest> items,
            String paymentMethod) {
    }
}