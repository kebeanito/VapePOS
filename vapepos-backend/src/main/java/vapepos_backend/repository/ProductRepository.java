package vapepos_backend.repository;

import vapepos_backend.entity.Product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository
        extends JpaRepository<Product, Long> {

    Optional<Product> findByBranchIdAndSku(
            Long branchId,
            String sku);

    List<Product> findByBranchId(
            Long branchId);

    List<Product> findByBranchIdAndActiveTrue(
            Long branchId);
}