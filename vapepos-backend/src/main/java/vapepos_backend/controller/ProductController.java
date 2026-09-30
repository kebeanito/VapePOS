package vapepos_backend.controller;

import vapepos_backend.entity.Branch;
import vapepos_backend.entity.Category;
import vapepos_backend.entity.Product;

import vapepos_backend.repository.BranchRepository;
import vapepos_backend.repository.CategoryRepository;
import vapepos_backend.repository.ProductRepository;

import vapepos_backend.security.CurrentUserService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BranchRepository branchRepository;
    private final CurrentUserService currentUserService;

    public ProductController(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            BranchRepository branchRepository,
            CurrentUserService currentUserService) {

        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.branchRepository = branchRepository;
        this.currentUserService = currentUserService;
    }

    // =========================================================
    // GET ALL PRODUCTS
    // ADMIN ONLY
    // =========================================================

    @GetMapping
    public ResponseEntity<?> getAllProducts() {

        if (!currentUserService.isAdmin()) {
            return ResponseEntity.status(403)
                    .body("Only administrators can access all products");
        }

        return ResponseEntity.ok(
                productRepository.findAll());
    }

    // =========================================================
    // GET PRODUCTS BY BRANCH
    // ADMIN = ANY BRANCH
    // CASHIER = ASSIGNED BRANCH ONLY
    // =========================================================

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<?> getProductsByBranch(
            @PathVariable Long branchId) {

        if (!currentUserService.canAccessBranch(branchId)) {
            return ResponseEntity.status(403)
                    .body("You are not allowed to access this branch");
        }

        if (!branchRepository.existsById(branchId)) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(
                productRepository.findByBranchId(branchId));
    }

    // =========================================================
    // GET ACTIVE PRODUCTS BY BRANCH
    // ADMIN = ANY BRANCH
    // CASHIER = ASSIGNED BRANCH ONLY
    // =========================================================

    @GetMapping("/branch/{branchId}/active")
    public ResponseEntity<?> getActiveProductsByBranch(
            @PathVariable Long branchId) {

        if (!currentUserService.canAccessBranch(branchId)) {
            return ResponseEntity.status(403)
                    .body("You are not allowed to access this branch");
        }

        if (!branchRepository.existsById(branchId)) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(
                productRepository.findByBranchIdAndActiveTrue(
                        branchId));
    }

    // =========================================================
    // GET PRODUCT BY ID
    // ADMIN = ANY PRODUCT
    // CASHIER = ASSIGNED BRANCH PRODUCT ONLY
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(
            @PathVariable Long id) {

        Product product = productRepository
                .findById(id)
                .orElse(null);

        if (product == null) {
            return ResponseEntity.notFound().build();
        }

        Long productBranchId = product.getBranch().getId();

        if (!currentUserService.canAccessBranch(
                productBranchId)) {

            return ResponseEntity.status(403)
                    .body("You are not allowed to access this product");
        }

        return ResponseEntity.ok(product);
    }

    // =========================================================
    // CREATE PRODUCT
    // ADMIN = ANY BRANCH
    // CASHIER = ASSIGNED BRANCH ONLY
    // =========================================================

    @PostMapping
    public ResponseEntity<?> createProduct(
            @RequestBody ProductRequest request) {

        if (request.branchId() == null) {
            return ResponseEntity.badRequest()
                    .body("Branch is required");
        }

        // Check branch authorization
        if (!currentUserService.canAccessBranch(
                request.branchId())) {

            return ResponseEntity.status(403)
                    .body("You are not allowed to add products to this branch");
        }

        if (request.name() == null ||
                request.name().trim().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("Product name is required");
        }

        if (request.sku() == null ||
                request.sku().trim().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("SKU is required");
        }

        if (request.price() == null ||
                request.price().signum() < 0) {

            return ResponseEntity.badRequest()
                    .body("Valid price is required");
        }

        if (request.categoryId() == null) {
            return ResponseEntity.badRequest()
                    .body("Category is required");
        }

        Branch branch = branchRepository
                .findById(request.branchId())
                .orElse(null);

        if (branch == null) {
            return ResponseEntity.badRequest()
                    .body("Branch not found");
        }

        Category category = categoryRepository
                .findById(request.categoryId())
                .orElse(null);

        if (category == null) {
            return ResponseEntity.badRequest()
                    .body("Category not found");
        }

        String sku = request.sku().trim();

        if (productRepository
                .findByBranchIdAndSku(
                        request.branchId(),
                        sku)
                .isPresent()) {

            return ResponseEntity.badRequest()
                    .body("SKU already exists in this branch");
        }

        Product product = new Product();

        product.setBranch(branch);
        product.setCategory(category);
        product.setName(request.name().trim());
        product.setSku(sku);
        product.setPrice(request.price());
        product.setActive(true);

        Product savedProduct = productRepository.save(product);

        return ResponseEntity.ok(savedProduct);
    }

    // =========================================================
    // UPDATE PRODUCT
    // ADMIN = ANY BRANCH
    // CASHIER = ASSIGNED BRANCH ONLY
    // =========================================================

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @RequestBody ProductRequest request) {

        Product product = productRepository
                .findById(id)
                .orElse(null);

        if (product == null) {
            return ResponseEntity.notFound().build();
        }

        // Check the product's CURRENT branch.
        Long currentBranchId = product.getBranch().getId();

        if (!currentUserService.canAccessBranch(
                currentBranchId)) {

            return ResponseEntity.status(403)
                    .body("You are not allowed to modify this product");
        }

        if (request.name() == null ||
                request.name().trim().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("Product name is required");
        }

        if (request.sku() == null ||
                request.sku().trim().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("SKU is required");
        }

        if (request.price() == null ||
                request.price().signum() < 0) {

            return ResponseEntity.badRequest()
                    .body("Valid price is required");
        }

        if (request.branchId() == null ||
                request.categoryId() == null) {

            return ResponseEntity.badRequest()
                    .body("Branch and category are required");
        }

        // Check the NEW branch as well.
        if (!currentUserService.canAccessBranch(
                request.branchId())) {

            return ResponseEntity.status(403)
                    .body("You are not allowed to move this product to this branch");
        }

        Branch branch = branchRepository
                .findById(request.branchId())
                .orElse(null);

        if (branch == null) {
            return ResponseEntity.badRequest()
                    .body("Branch not found");
        }

        Category category = categoryRepository
                .findById(request.categoryId())
                .orElse(null);

        if (category == null) {
            return ResponseEntity.badRequest()
                    .body("Category not found");
        }

        String sku = request.sku().trim();

        Product existingProduct = productRepository
                .findByBranchIdAndSku(
                        request.branchId(),
                        sku)
                .orElse(null);

        if (existingProduct != null &&
                !existingProduct.getId().equals(id)) {

            return ResponseEntity.badRequest()
                    .body("SKU already exists in this branch");
        }

        product.setBranch(branch);
        product.setCategory(category);
        product.setName(request.name().trim());
        product.setSku(sku);
        product.setPrice(request.price());

        return ResponseEntity.ok(
                productRepository.save(product));
    }

    // =========================================================
    // DEACTIVATE PRODUCT
    // ADMIN = ANY BRANCH
    // CASHIER = ASSIGNED BRANCH ONLY
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivateProduct(
            @PathVariable Long id) {

        Product product = productRepository
                .findById(id)
                .orElse(null);

        if (product == null) {
            return ResponseEntity.notFound().build();
        }

        Long productBranchId = product.getBranch().getId();

        if (!currentUserService.canAccessBranch(
                productBranchId)) {

            return ResponseEntity.status(403)
                    .body("You are not allowed to deactivate this product");
        }

        product.setActive(false);

        productRepository.save(product);

        return ResponseEntity.ok(
                "Product deactivated successfully");
    }

    // =========================================================
    // REACTIVATE PRODUCT
    // ADMIN = ANY BRANCH
    // CASHIER = ASSIGNED BRANCH ONLY
    // =========================================================

    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activateProduct(
            @PathVariable Long id) {

        Product product = productRepository
                .findById(id)
                .orElse(null);

        if (product == null) {
            return ResponseEntity.notFound().build();
        }

        Long productBranchId = product.getBranch().getId();

        if (!currentUserService.canAccessBranch(
                productBranchId)) {

            return ResponseEntity.status(403)
                    .body("You are not allowed to activate this product");
        }

        product.setActive(true);

        productRepository.save(product);

        return ResponseEntity.ok(
                "Product activated successfully");
    }

    // =========================================================
    // REQUEST RECORD
    // =========================================================

    public record ProductRequest(
            Long branchId,
            String name,
            String sku,
            java.math.BigDecimal price,
            Long categoryId) {
    }
}