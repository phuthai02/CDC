package project.smarthome.cdc.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.smarthome.cdc.model.dto.CDCResponse;
import project.smarthome.cdc.model.entity.Member;
import project.smarthome.cdc.service.MemberService;
import project.smarthome.cdc.utils.JsonUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@RestController
public class MemberRestController {

    @Autowired
    private MemberService memberService;

    @PostMapping("")
    public CDCResponse create(@RequestBody Member member) {
        log.info("[CDC] create: {}", JsonUtils.toJson(member));
        return memberService.create(member);
    }

    @PutMapping("/{id}")
    public CDCResponse update(@PathVariable("id") Integer id, @RequestBody Member member) {
        log.info("[CDC] update: id={}, member={}", id, JsonUtils.toJson(member));
        return memberService.update(id, member);
    }

    @DeleteMapping("/{id}")
    public CDCResponse delete(@PathVariable("id") Integer id) {
        log.info("[CDC] delete: id={}", id);
        return memberService.delete(id);
    }

    @GetMapping("find-by-device")
    public CDCResponse findByDeviceId(@RequestParam("deviceId") String deviceId) {
        log.info("[CDC] findByDevice: deviceId={}", deviceId);
        return memberService.findByDeviceId(deviceId);
    }

    @GetMapping("find-all")
    public CDCResponse findAll() {
        log.info("[CDC] findAll");
        return memberService.findAll();
    }

    @GetMapping("export-excel")
    public ResponseEntity<ByteArrayResource> exportExcel() {
        log.info("[CDC] exportExcel");
        try {
            byte[] excelData = memberService.exportExcel();

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