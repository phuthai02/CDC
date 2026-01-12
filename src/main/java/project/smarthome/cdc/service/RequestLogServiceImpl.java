package project.smarthome.cdc.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import project.smarthome.cdc.model.entity.RequestLog;
import project.smarthome.cdc.repository.RequestLogRepository;

@Service
public class RequestLogServiceImpl implements RequestLogService {

    @Autowired
    private RequestLogRepository requestLogRepository;

    @Override
    public void create(RequestLog requestLog) throws Exception {
        requestLogRepository.save(requestLog);
    }
}
