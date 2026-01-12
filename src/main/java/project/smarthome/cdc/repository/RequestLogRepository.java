package project.smarthome.cdc.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import project.smarthome.cdc.model.entity.RequestLog;

public interface RequestLogRepository extends JpaRepository<RequestLog, Long> {
}
