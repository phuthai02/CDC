package project.smarthome.cdc.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.smarthome.cdc.model.entity.SystemConfig;

public interface SystemConfigRepository extends JpaRepository<SystemConfig, Integer> {
    SystemConfig findFirstByKey(String key);
}
