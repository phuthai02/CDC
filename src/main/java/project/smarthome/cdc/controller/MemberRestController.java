package project.smarthome.cdc.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import project.smarthome.cdc.model.dto.CDCResponse;
import project.smarthome.cdc.model.entity.Member;
import project.smarthome.cdc.service.MemberService;
import project.smarthome.cdc.utils.JsonUtils;

import java.nio.charset.StandardCharsets;

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

    @PostMapping("login")
    public CDCResponse login(@RequestBody Member member) {
        log.info("[CDC] login: member={}", JsonUtils.toJson(member));
        return memberService.login(member);
    }

    @PutMapping("/{id}")
    public CDCResponse update(@PathVariable("id") Integer id,
                              @RequestBody Member member,
                              @RequestHeader(value = "actor", required = false) String actor) {
        actor = actor != null ? java.net.URLDecoder.decode(actor, StandardCharsets.UTF_8) : null;
        log.info("[CDC] update: id={}, actor={}, member={}", id, actor, JsonUtils.toJson(member));
        return memberService.update(id, member, actor);
    }

    @DeleteMapping("/{id}")
    public CDCResponse delete(@PathVariable("id") Integer id,
                              @RequestHeader(value = "actor", required = false) String actor) {
        actor = actor != null ? java.net.URLDecoder.decode(actor, StandardCharsets.UTF_8) : null;
        log.info("[CDC] delete: id={}, actor={}", id, actor);
        return memberService.delete(id, actor);
    }

    @GetMapping("get-data")
    public CDCResponse getData(@RequestParam("keyWord") String keyWord,
                               @RequestParam("page") Integer page,
                               @RequestParam("pageSize") Integer pageSize,
                               @RequestHeader(value = "actor", required = false) String actor) {
        actor = actor != null ? java.net.URLDecoder.decode(actor, StandardCharsets.UTF_8) : null;
        log.info("[CDC] getData: keyWord={}, page={}, pageSize={}, actor={}", keyWord, page, pageSize, actor);
        return memberService.getData(keyWord, page, pageSize, actor);
    }

    @GetMapping("export-excel")
    public CDCResponse exportExcel(@RequestHeader(value = "actor", required = false) String actor) {
        actor = actor != null ? java.net.URLDecoder.decode(actor, StandardCharsets.UTF_8) : null;
        log.info("[CDC] exportExcel: actor={}", actor);
        return memberService.exportExcel(actor);
    }

    @GetMapping("toggle-allow-create")
    public CDCResponse toggleAllowCreate(@RequestHeader(value = "actor", required = false) String actor) {
        actor = actor != null ? java.net.URLDecoder.decode(actor, StandardCharsets.UTF_8) : null;
        log.info("[CDC] toggleAllowCreate: actor={}", actor);
        return memberService.toggleAllowCreate();
    }

    @GetMapping("get-allow-create")
    public CDCResponse getAllowCreate(@RequestHeader(value = "actor", required = false) String actor) {
        actor = actor != null ? java.net.URLDecoder.decode(actor, StandardCharsets.UTF_8) : null;
        log.info("[CDC] getAllowCreate: actor={}", actor);
        return memberService.exportExcel(actor);
    }
}