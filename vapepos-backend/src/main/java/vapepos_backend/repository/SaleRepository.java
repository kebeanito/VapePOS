package vapepos_backend.repository;

import vapepos_backend.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;

import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    List<Sale> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<Sale> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Sale> findByBranchIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
            Long branchId,
            LocalDateTime start,
            LocalDateTime end);
}