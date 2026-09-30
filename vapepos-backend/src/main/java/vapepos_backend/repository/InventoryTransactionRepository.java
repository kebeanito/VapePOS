package vapepos_backend.repository;

import vapepos_backend.entity.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryTransactionRepository
        extends JpaRepository<InventoryTransaction, Long> {

    List<InventoryTransaction> findByBranchIdOrderByCreatedAtDesc(
            Long branchId);

    List<InventoryTransaction> findByProductIdOrderByCreatedAtDesc(
            Long productId);
}