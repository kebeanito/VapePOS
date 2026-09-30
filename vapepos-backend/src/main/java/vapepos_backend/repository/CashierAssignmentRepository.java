package vapepos_backend.repository;

import vapepos_backend.entity.CashierAssignment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CashierAssignmentRepository
                extends JpaRepository<CashierAssignment, Long> {

        Optional<CashierAssignment> findByUserIdAndShiftDate(
                        Long userId,
                        LocalDate shiftDate);

        List<CashierAssignment> findByShiftDateOrderByAssignedAtDesc(
                        LocalDate shiftDate);

        List<CashierAssignment> findByUserIdOrderByShiftDateDesc(
                        Long userId);
}