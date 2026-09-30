package vapepos_backend.service;

import vapepos_backend.entity.*;
import vapepos_backend.repository.*;
import vapepos_backend.security.CurrentUserService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final CurrentUserService currentUserService;

    public SaleService(
            SaleRepository saleRepository,
            SaleItemRepository saleItemRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            InventoryTransactionRepository inventoryTransactionRepository,
            CurrentUserService currentUserService) {

        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public Sale createSale(
            List<SaleItemRequest> items,
            String paymentMethod) {

        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException(
                    "Sale must contain at least one item");
        }

        if (paymentMethod == null ||
                paymentMethod.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Payment method is required");
        }

        User user = currentUserService.getCurrentUser();

        Long branchId = currentUserService.getAssignedBranchId();

        Branch branch = null;

        /*
         * The cashier's assigned branch is determined
         * by the authenticated user.
         */
        for (Product product : productRepository.findAll()) {
            if (product.getBranch().getId().equals(branchId)) {
                branch = product.getBranch();
                break;
            }
        }

        if (branch == null) {
            throw new IllegalArgumentException(
                    "Assigned branch could not be found");
        }

        Sale sale = new Sale();
        sale.setUser(user);
        sale.setBranch(branch);
        sale.setPaymentMethod(paymentMethod.trim());

        BigDecimal totalAmount = BigDecimal.ZERO;

        List<SaleItem> saleItems = new ArrayList<>();

        for (SaleItemRequest request : items) {

            if (request.productId() == null) {
                throw new IllegalArgumentException(
                        "Product ID is required");
            }

            if (request.quantity() == null ||
                    request.quantity() <= 0) {
                throw new IllegalArgumentException(
                        "Quantity must be greater than zero");
            }

            Product product = productRepository
                    .findById(request.productId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Product not found: "
                                    + request.productId()));

            /*
             * IMPORTANT:
             * The product must belong to the cashier's
             * assigned branch.
             */
            if (!product.getBranch().getId().equals(branchId)) {
                throw new IllegalArgumentException(
                        "Product does not belong to your assigned branch");
            }

            if (!product.isActive()) {
                throw new IllegalArgumentException(
                        "Product is inactive: "
                                + product.getName());
            }

            Inventory inventory = inventoryRepository
                    .findByBranchIdAndProductId(
                            branchId,
                            product.getId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Inventory record not found for product: "
                                    + product.getName()));

            if (inventory.getQuantity() < request.quantity()) {
                throw new IllegalArgumentException(
                        "Insufficient stock for product: "
                                + product.getName()
                                + ". Available: "
                                + inventory.getQuantity());
            }

            BigDecimal price = product.getPrice();

            BigDecimal subtotal = price.multiply(
                    BigDecimal.valueOf(request.quantity()));

            SaleItem saleItem = new SaleItem();

            saleItem.setSale(sale);
            saleItem.setProduct(product);
            saleItem.setQuantity(request.quantity());
            saleItem.setPrice(price);
            saleItem.setSubtotal(subtotal);

            saleItems.add(saleItem);

            totalAmount = totalAmount.add(subtotal);

            /*
             * Deduct inventory.
             */
            inventory.setQuantity(
                    inventory.getQuantity()
                            - request.quantity());

            inventoryRepository.save(inventory);

            /*
             * Record inventory transaction.
             */
            InventoryTransaction transaction = new InventoryTransaction();

            transaction.setProduct(product);
            transaction.setBranch(branch);
            transaction.setUser(user);
            transaction.setType("SALE");
            transaction.setQuantity(-request.quantity());
            transaction.setReason(
                    "Sale transaction");

            inventoryTransactionRepository.save(transaction);
        }

        sale.setTotalAmount(totalAmount);

        Sale savedSale = saleRepository.save(sale);

        for (SaleItem saleItem : saleItems) {
            saleItem.setSale(savedSale);
        }

        saleItemRepository.saveAll(saleItems);

        return savedSale;
    }

    public record SaleItemRequest(
            Long productId,
            Integer quantity) {
    }
}