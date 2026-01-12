package project.smarthome.cdc.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import project.smarthome.cdc.model.entity.Member;

import java.sql.Date;

public interface MemberRepository extends JpaRepository<Member, Integer> {
    Member findFirstByNameAndDateOfBirth(String name, Date dateOfBirth);
    Member findFirstByDeviceId(String deviceId);

}
