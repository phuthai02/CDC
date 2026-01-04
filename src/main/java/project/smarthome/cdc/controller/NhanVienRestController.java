package project.smarthome.cdc.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.smarthome.cdc.model.dto.CDCResponse;
import project.smarthome.cdc.model.entity.NhanVien;
import project.smarthome.cdc.service.NhanVienService;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@RestController
public class NhanVienRestController {

    @Autowired
    private NhanVienService nhanVienService;

    @PostMapping("")
    public CDCResponse submit(@RequestBody NhanVien nhanVien) {
        log.info("[CDC] submit");
        return nhanVienService.create(nhanVien);
    }

    @GetMapping("find-by-device")
    public CDCResponse findByDeviceId(@RequestParam("deviceId") String deviceId) {
        log.info("[CDC] findByDevice");
        return nhanVienService.findByDeviceId(deviceId);
    }

    @GetMapping("find-all")
    public CDCResponse findAll() {
        log.info("[CDC] findAll");
        return nhanVienService.findAll();
    }

    @GetMapping("export-excel")
    public ResponseEntity<ByteArrayResource> exportExcel() {
        log.info("[CDC] exportExcel");
        try {
            byte[] excelData = nhanVienService.exportToExcel();

            ByteArrayResource resource = new ByteArrayResource(excelData);

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy_HH-mm"));
            String filename = "CDC_Portal_DanhSach_" + timestamp + ".xlsx";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .contentLength(excelData.length)
                    .body(resource);
        } catch (Exception e) {
            log.error("[CDC] Error exporting excel", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}