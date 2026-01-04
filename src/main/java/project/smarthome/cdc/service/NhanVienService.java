package project.smarthome.cdc.service;

import project.smarthome.cdc.model.dto.CDCResponse;
import project.smarthome.cdc.model.entity.NhanVien;

public interface NhanVienService {
    CDCResponse create(NhanVien nhanVien);
    CDCResponse findByDeviceId(String deviceId);
    CDCResponse findAll();
    byte[] exportToExcel() throws Exception;

    CDCResponse update(NhanVien nhanVien);
    CDCResponse delete(NhanVien nhanVien);
}
