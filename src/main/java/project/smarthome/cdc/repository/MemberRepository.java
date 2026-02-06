package project.smarthome.cdc.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import project.smarthome.cdc.model.entity.Member;

import java.sql.Date;

public interface MemberRepository extends JpaRepository<Member, Integer> {
    Member findFirstByNameAndDateOfBirth(String name, Date dateOfBirth);
    Member findFirstByDeviceId(String deviceId);
    Member findFirstById(Integer id);
    Page<Member> findById(Integer id, Pageable pageable);
    Page<Member> findByNameContainingIgnoreCase(String keyword, Pageable pageable);
    @Query("SELECT MAX(m.id) FROM Member m")
    Integer getMaxId();
}
