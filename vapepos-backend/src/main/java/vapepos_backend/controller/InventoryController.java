package vapepos_backend.controller;

import vapepos_backend.entity.Branch;
import vapepos_backend.entity.Inventory;
import vapepos_backend.entity.InventoryTransaction;
import vapepos_backend.entity.Product;
import vapepos_backend.entity.User;

import vapepos_backend.repository.BranchRepository;
import vapepos_backend.repository.InventoryRepository;
import vapepos_backend.repository.InventoryTransactionRepository;
import vapepos_backend.repository.ProductRepository;

import vapepos_backend.security.CurrentUserService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

        private final InventoryRepository inventoryRepository;
        private final InventoryTransactionRepository transactionRepository;
        private final BranchRepository branchRepository;
        private final ProductRepository productRepository;
        private final CurrentUserService currentUserService;

        public InventoryController(
                        InventoryRepository inventoryRepository,
                        InventoryTransactionRepository transactionRepository,
                        BranchRepository branchRepository,
                        ProductRepository productRepository,
                        CurrentUserService currentUserService) {

                this.inventoryRepository = inventoryRepository;
                this.transactionRepository = transactionRepository;
                this.branchRepository = branchRepository;
                this.productRepository = productRepository;
                this.currentUserService = currentUserService;
        }

        // =========================================================
        // GET ALL INVENTORY
        // ADMIN ONLY
        // =========================================================

        @GetMapping
        public ResponseEntity<?> getAllInventory() {

                if (!currentUserService.isAdmin()) {
                        return ResponseEntity.status(403)
                                        .body("Only administrators can access all inventory");
                }

                return ResponseEntity.ok(
                                inventoryRepository.findAll());
        }

        // =========================================================
        // GET INVENTORY BY BRANCH
        // ADMIN = ANY BRANCH
        // CASHIER = ASSIGNED BRANCH ONLY
        // =========================================================

        @GetMapping("/branch/{branchId}")
        public ResponseEntity<?> getInventoryByBranch(
                        @PathVariable Long branchId) {

                if (!currentUserService.canAccessBranch(branchId)) {
                        return ResponseEntity.status(403)
                                        .body("You are not allowed to access this branch");
                }

                if (!branchRepository.existsById(branchId)) {
                        return ResponseEntity.notFound().build();
                }

                List<Inventory> inventory = inventoryRepository
                                .findAll()
                                .stream()
                                .filter(item -> item.getBranch()
                                                .getId()
                                                .equals(branchId))
                                .toList();

                return ResponseEntity.ok(inventory);
        }

        // =========================================================
        // STOCK IN
        // ADMIN = ANY BRANCH
        // CASHIER = ASSIGNED BRANCH ONLY
        // =========================================================

        @PostMapping("/stock-in")
        @Transactional
        public ResponseEntity<?> stockIn(
                        @RequestBody StockRequest request) {

                if (request.branchId() == null ||
                                request.productId() == null ||
                                request.quantity() == null) {

                        return ResponseEntity.badRequest().body(
                                        Map.of(
                                                        "message",
                                                        "branchId, productId and quantity are required"));
                }

                if (!currentUserService.canAccessBranch(
                                request.branchId())) {

                        return ResponseEntity.status(403).body(
                                        Map.of(
                                                        "message",
                                                        "You are not allowed to manage inventory for this branch"));
                }

                if (request.quantity() <= 0) {
                        return ResponseEntity.badRequest().body(
                                        Map.of(
                                                        "message",
                                                        "Quantity must be greater than 0"));
                }

                Branch branch = branchRepository
                                .findById(request.branchId())
                                .orElse(null);

                if (branch == null) {
                        return ResponseEntity.badRequest().body(
                                        Map.of(
                                                        "message",
                                                        "Branch not found"));
                }

                Product product = productRepository
                                .findById(request.productId())
                                .orElse(null);

                if (product == null) {
                        return ResponseEntity.badRequest().body(
                                        Map.of(
                                                        "message",
                                                        "Product not found"));
                }

                // Make sure the product actually belongs to
                // the branch being modified.
                if (!product.getBranch()
                                .getId()
                                .equals(request.branchId())) {

                        return ResponseEntity.badRequest().body(
                                        Map.of(
                                                        "message",
                                                        "Product does not belong to this branch"));
                }

                // Get the authenticated user from JWT.
                User user = currentUserService.getCurrentUser();

                Inventory inventory = inventoryRepository
                                .findByBranchIdAndProductId(
                                                request.branchId(),
                                                request.productId())
                                .orElse(null);

                if (inventory == null) {

                        inventory = new Inventory();

                        inventory.setBranch(branch);
                        inventory.setProduct(product);
                        inventory.setQuantity(request.quantity());

                        if (request.reorderLevel() != null) {
                                inventory.setReorderLevel(
                                                request.reorderLevel());
                        }

                } else {

                        inventory.setQuantity(
                                        inventory.getQuantity()
                                                        + request.quantity());

                        if (request.reorderLevel() != null) {
                                inventory.setReorderLevel(
                                                request.reorderLevel());
                        }
                }

                Inventory savedInventory = inventoryRepository.save(inventory);

                InventoryTransaction transaction = new InventoryTransaction();

                transaction.setBranch(branch);
                transaction.setProduct(product);
                transaction.setUser(user);
                transaction.setType("STOCK_IN");
                transaction.setQuantity(request.quantity());
                transaction.setReason(request.reason());

                transactionRepository.save(transaction);

                return ResponseEntity.ok(
                                Map.of(
                                                "message",
                                                "Stock added successfully",

                                                "inventoryId",
                                                savedInventory.getId(),

                                                "branch",
                                                branch.getName(),

                                                "product",
                                                product.getName(),

                                                "quantity",
                                                savedInventory.getQuantity(),

                                                "reorderLevel",
                                                savedInventory.getReorderLevel()));
        }

        // =========================================================
        // STOCK ADJUSTMENT
        // ADMIN = ANY BRANCH
        // CASHIER = ASSIGNED BRANCH ONLY
        // =========================================================

        @PostMapping("/adjustment")
        @Transactional
        public ResponseEntity<?> adjustStock(
                        @RequestBody AdjustmentRequest request) {

                if (request.branchId() == null ||
                                request.productId() == null ||
                                request.quantity() == null) {

                        return ResponseEntity.badRequest().body(
                                        Map.of(
                                                        "message",
                                                        "branchId, productId and quantity are required"));
                }

                if (!currentUserService.canAccessBranch(
                                request.branchId())) {

                        return ResponseEntity.status(403).body(
                                        Map.of(
                                                        "message",
                                                        "You are not allowed to manage inventory for this branch"));
                }

                Branch branch = branchRepository
                                .findById(request.branchId())
                                .orElse(null);

                if (branch == null) {
                        return ResponseEntity.badRequest().body(
                                        Map.of(
                                                        "message",
                                                        "Branch not found"));
                }

                Product product = productRepository
                                .findById(request.productId())
                                .orElse(null);

                if (product == null) {
                        return ResponseEntity.badRequest().body(
                                        Map.of(
                                                        "message",
                                                        "Product not found"));
                }

                // Make sure the product belongs to
                // the requested branch.
                if (!product.getBranch()
                                .getId()
                                .equals(request.branchId())) {

                        return ResponseEntity.badRequest().body(
                                        Map.of(
                                                        "message",
                                                        "Product does not belong to this branch"));
                }

                // Get the authenticated user from JWT.
                User user = currentUserService.getCurrentUser();

                Inventory inventory = inventoryRepository
                                .findByBranchIdAndProductId(
                                                request.branchId(),
                                                request.productId())
                                .orElse(null);

                if (inventory == null) {
                        return ResponseEntity.badRequest().body(
                                        Map.of(
                                                        "message",
                                                        "Inventory record not found"));
                }

                int newQuantity = inventory.getQuantity()
                                + request.quantity();

                if (newQuantity < 0) {
                        return ResponseEntity.badRequest().body(
                                        Map.of(
                                                        "message",
                                                        "Stock cannot be negative"));
                }

                inventory.setQuantity(newQuantity);

                Inventory savedInventory = inventoryRepository.save(inventory);

                InventoryTransaction transaction = new InventoryTransaction();

                transaction.setBranch(branch);
                transaction.setProduct(product);
                transaction.setUser(user);
                transaction.setType("ADJUSTMENT");
                transaction.setQuantity(request.quantity());
                transaction.setReason(request.reason());

                transactionRepository.save(transaction);

                return ResponseEntity.ok(
                                Map.of(
                                                "message",
                                                "Stock adjusted successfully",

                                                "inventoryId",
                                                savedInventory.getId(),

                                                "branch",
                                                branch.getName(),

                                                "product",
                                                product.getName(),

                                                "quantity",
                                                savedInventory.getQuantity()));
        }

        // =========================================================
        // GET ALL TRANSACTIONS
        // ADMIN ONLY
        // =========================================================

        @GetMapping("/transactions")
        public ResponseEntity<?> getAllTransactions() {

                if (!currentUserService.isAdmin()) {
                        return ResponseEntity.status(403)
                                        .body(
                                                        "Only administrators can access all inventory transactions");
                }

                return ResponseEntity.ok(
                                transactionRepository.findAll());
        }

        // =========================================================
        // GET TRANSACTIONS BY BRANCH
        // ADMIN = ANY BRANCH
        // CASHIER = ASSIGNED BRANCH ONLY
        // =========================================================

        @GetMapping("/transactions/branch/{branchId}")
        public ResponseEntity<?> getBranchTransactions(
                        @PathVariable Long branchId) {

                if (!currentUserService.canAccessBranch(branchId)) {
                        return ResponseEntity.status(403)
                                        .body(
                                                        "You are not allowed to access this branch");
                }

                if (!branchRepository.existsById(branchId)) {
                        return ResponseEntity.notFound().build();
                }

                return ResponseEntity.ok(
                                transactionRepository
                                                .findByBranchIdOrderByCreatedAtDesc(
                                                                branchId));
        }

        // =========================================================
        // GET PRODUCT TRANSACTIONS
        // ADMIN = ANY PRODUCT
        // CASHIER = ASSIGNED BRANCH PRODUCT ONLY
        // =========================================================

        @GetMapping("/transactions/product/{productId}")
        public ResponseEntity<?> getProductTransactions(
                        @PathVariable Long productId) {

                Product product = productRepository
                                .findById(productId)
                                .orElse(null);

                if (product == null) {
                        return ResponseEntity.notFound().build();
                }

                Long productBranchId = product.getBranch().getId();

                if (!currentUserService.canAccessBranch(
                                productBranchId)) {

                        return ResponseEntity.status(403)
                                        .body(
                                                        "You are not allowed to access this product's transactions");
                }

                return ResponseEntity.ok(
                                transactionRepository
                                                .findByProductIdOrderByCreatedAtDesc(
                                                                productId));
        }

        // =========================================================
        // STOCK-IN REQUEST
        // =========================================================

        public record StockRequest(
                        Long branchId,
                        Long productId,
                        Integer quantity,
                        Integer reorderLevel,
                        Long userId,
                        String reason) {
        }

        // =========================================================
        // ADJUSTMENT REQUEST
        // =========================================================

        public record AdjustmentRequest(
                        Long branchId,
                        Long productId,
                        Integer quantity,
                        Long userId,
                        String reason) {
        }
}