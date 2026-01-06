package project.smarthome.cdc.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import project.smarthome.cdc.model.entity.NhanVien;

import java.sql.Date;

public interface NhanVienRepository extends JpaRepository<NhanVien, Integer> {
    NhanVien findFirstByNameAndDateOfBirth(String name, Date dateOfBirth);
    NhanVien findFirstByDeviceId(String deviceId);

}
