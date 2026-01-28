package project.smarthome.cdc.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.smarthome.cdc.model.dto.CDCResponse;
import project.smarthome.cdc.model.entity.Member;
import project.smarthome.cdc.service.MemberService;
import project.smarthome.cdc.utils.JsonUtils;

import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;

@Slf4j
@RestController
public class MemberRestController {

    @Autowired
    private MemberService memberService;

    @PostMapping("")
    public CDCResponse create(@RequestBody Member member) {
        log.info("[CDC] create: member={}", JsonUtils.toJson(member));
        return memberService.create(member);
    }

    @GetMapping("find-by-device")
    public CDCResponse findByDeviceId(@RequestParam("deviceId") String deviceId) {
        log.info("[CDC] findByDevice: deviceId={}", deviceId);
        return memberService.findByDeviceId(deviceId);
    }

    @GetMapping("download-image")
    public ResponseEntity<byte[]> downloadImage(@RequestParam("deviceId") String deviceId) {
        log.info("[CDC] downloadImage: deviceId={}", deviceId);

        try {
            byte[] imageBytes = memberService.downloadImage(deviceId);

            if (imageBytes == null || imageBytes.length == 0) {
                log.error("[CDC] No image data returned");
                return ResponseEntity.notFound().build();
            }

            // Extract lucky number từ deviceId để tạo tên file
            CDCResponse memberResponse = memberService.findByDeviceId(deviceId);
            String fileName = "lucky_number.png";

            if (memberResponse.getCode() == 200 && memberResponse.getData() != null) {
                Member member = (Member) memberResponse.getData();
                String luckyNumber = String.format("%03d", member.getId());
                fileName = "lucky_number_" + luckyNumber + ".png";
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentDispositionFormData("attachment", fileName);
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0);
            return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("[CDC] Error downloading image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("login")
    public CDCResponse login(@RequestBody Member member) {
        log.info("[CDC] login: member={}", JsonUtils.toJson(member));
        return memberService.login(member);
    }

    @PutMapping("/{id}")
    public CDCResponse update(@PathVariable("id") Integer id,
                              @RequestBody Member member,
                              @RequestHeader(value = "actor", required = false) String actor) {
        log.info("[CDC] update: id={}, actor={}, member={}", id, actor, JsonUtils.toJson(member));
        return memberService.update(id, member, actor);
    }

    @DeleteMapping("/{id}")
    public CDCResponse delete(@PathVariable("id") Integer id,
                              @RequestHeader(value = "actor", required = false) String actor) {
        log.info("[CDC] delete: id={}, actor={}", id, actor);
        return memberService.delete(id, actor);
    }

    @GetMapping("get-data")
    public CDCResponse getData(@RequestParam("keyWord") String keyWord,
                               @RequestParam("page") Integer page,
                               @RequestParam("pageSize") Integer pageSize,
                               @RequestHeader(value = "actor", required = false) String actor) {
        log.info("[CDC] getData: keyWord={}, page={}, pageSize={}, actor={}", keyWord, page, pageSize, actor);
        return memberService.getData(keyWord, page, pageSize, actor);
    }

    @GetMapping("export-excel")
    public ResponseEntity<byte[]> exportExcel(@RequestHeader(value = "actor", required = false) String actor) {
        log.info("[CDC] exportExcel: actor={}", actor);

        try {
            byte[] excelBytes = memberService.exportExcel(actor);

            if (excelBytes == null || excelBytes.length == 0) {
                log.error("[CDC] No excel data returned or unauthorized");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String fileName = "CDC_Members_" +
                    new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date()) + ".xlsx";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", fileName);
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0);
            return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("[CDC] Error exporting excel", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("toggle-allow-create")
    public CDCResponse toggleAllowCreate(@RequestHeader(value = "actor", required = false) String actor) {
        log.info("[CDC] toggleAllowCreate: actor={}", actor);
        return memberService.toggleAllowCreate();
    }
}