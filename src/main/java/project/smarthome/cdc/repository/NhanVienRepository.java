package project.smarthome.cdc.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import project.smarthome.cdc.model.entity.NhanVien;

public interface NhanVienRepository extends JpaRepository<NhanVien, Integer> {
    boolean existsByPhoneNumber(String phoneNumber);
    NhanVien findFirstByDeviceId(String deviceId);
}
