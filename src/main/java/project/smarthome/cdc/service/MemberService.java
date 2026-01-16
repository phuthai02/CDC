package project.smarthome.cdc.service;

import project.smarthome.cdc.model.dto.CDCResponse;
import project.smarthome.cdc.model.entity.Member;

public interface MemberService {
    CDCResponse create(Member member);
    CDCResponse findByDeviceId(String deviceId);
    CDCResponse login(Member member);
    CDCResponse update(Integer id, Member member, String actor);
    CDCResponse delete(Integer id, String actor);
    CDCResponse getData(String keyWord, Integer page, Integer pageSize, String actor);
    CDCResponse exportExcel(String actor);
    CDCResponse toggleAllowCreate();
    CDCResponse getAllowCreate();
}

