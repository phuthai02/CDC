package project.smarthome.cdc.service;

import project.smarthome.cdc.model.entity.RequestLog;

public interface RequestLogService {
    void create(RequestLog requestLog) throws Exception;
}
