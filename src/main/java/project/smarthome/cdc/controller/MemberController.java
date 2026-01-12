package project.smarthome.cdc.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Slf4j
@Controller
public class MemberController {

    @GetMapping("")
    public String main() {
        return "main";
    }

    @GetMapping("portal")
    public String portal() {
        return "portal";
    }
}
