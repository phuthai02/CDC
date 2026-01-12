package project.smarthome.cdc.service;

import project.smarthome.cdc.model.dto.CDCResponse;
import project.smarthome.cdc.model.entity.Member;

public interface MemberService {
    CDCResponse create(Member member);
    CDCResponse update(Integer id, Member member);
    CDCResponse delete(Integer id);
    CDCResponse findByDeviceId(String deviceId);
    CDCResponse findAll();
    byte[] exportExcel() throws Exception;
}
