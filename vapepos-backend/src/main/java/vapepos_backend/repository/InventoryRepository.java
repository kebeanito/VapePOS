package vapepos_backend.repository;

import vapepos_backend.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InventoryRepository
        extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByBranchIdAndProductId(
            Long branchId,
            Long productId);
}