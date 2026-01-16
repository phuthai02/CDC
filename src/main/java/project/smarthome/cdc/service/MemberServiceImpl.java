package project.smarthome.cdc.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import project.smarthome.cdc.model.dto.CDCResponse;
import project.smarthome.cdc.model.entity.Member;
import project.smarthome.cdc.model.entity.RequestLog;
import project.smarthome.cdc.model.entity.SystemConfig;
import project.smarthome.cdc.repository.MemberRepository;
import project.smarthome.cdc.repository.RequestLogRepository;
import project.smarthome.cdc.repository.SystemConfigRepository;
import project.smarthome.cdc.utils.JsonUtils;

import java.io.ByteArrayOutputStream;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.*;

@Slf4j
@Service
public class MemberServiceImpl implements MemberService {

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private RequestLogRepository requestLogRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private static final Integer RESPONSE_SUCCESS = 200;
    private static final Integer RESPONSE_ERROR = 500;
    private static final Integer RESPONSE_EXIST = 409;
    private static final Integer RESPONSE_NOT_FOUND = 404;
    private static final Integer RESPONSE_UNAUTHORIZED = 401;
    private static final Integer RESPONSE_EXPIRED = 403;
    private static final String[] badSuffix = {"13", "49", "53"};
    private static final String SCK_ALLOW_CREATE = "SCK_ALLOW_CREATE";

    @Override
    public CDCResponse create(Member member) {
        CDCResponse response = new CDCResponse();
        try {
            // Kiểm tra trùng lặp
            Member memberDB = memberRepository.findFirstByNameAndDateOfBirth(member.getName(), member.getDateOfBirth());
            if (memberDB != null) {
                response.setCode(RESPONSE_EXIST);
                response.setData(memberDB);
                return response;
            }

            // Kiểm tra trạng thái cho phép tạo
            if (!isAllowCreate()) {
                response.setCode(RESPONSE_EXPIRED);
                return response;
            }

            //Tạo deviceId
            String deviceId = UUID.randomUUID().toString();
            member.setDeviceId(deviceId);
            member.setCreatedTime(new Timestamp(System.currentTimeMillis()));

            //Validate id xấu
            while (true) {
                memberDB = memberRepository.save(member);
                String idStr = memberDB.getId().toString();
                boolean isBad = false;
                for (String s : badSuffix) {
                    if (idStr.endsWith(s)) {
                        isBad = true;
                        break;
                    }
                }
                if (!isBad) break;
                memberRepository.delete(memberDB);
            }

            //Set data trả về
            response.setCode(RESPONSE_SUCCESS);
            response.setData(memberDB);

            //Push event
            messagingTemplate.convertAndSend("/topic/event", "CREATE");
        } catch (Exception e) {
            response.setCode(RESPONSE_ERROR);
        }
        return response;
    }

    @Override
    public CDCResponse findByDeviceId(String deviceId) {
        CDCResponse response = new CDCResponse();
        try {
            Member member = memberRepository.findFirstByDeviceId(deviceId);
            if (member != null) {
                response.setCode(RESPONSE_SUCCESS);
                response.setData(member);
                return response;
            }
            response.setCode(RESPONSE_NOT_FOUND);
        } catch (Exception e) {
            response.setCode(RESPONSE_ERROR);
        }
        return response;
    }

    @Override
    public CDCResponse login(Member member) {
        CDCResponse response = new CDCResponse();
        try {
            Member memberDB = memberRepository.findFirstByNameAndDateOfBirth(member.getName(), member.getDateOfBirth());
            if (memberDB == null) {
                response.setCode(RESPONSE_NOT_FOUND);
                return response;
            }
            response.setCode(RESPONSE_SUCCESS);
            response.setData(memberDB);
        } catch (Exception e) {
            response.setCode(RESPONSE_ERROR);
        }
        return response;
    }

    @Override
    public CDCResponse update(Integer id, Member member, String actor) {
        CDCResponse response = checkActor(actor);
        if (response.getCode() != null) return response;

        try {
            Member oldData = memberRepository.findFirstById(id);
            if (oldData == null) {
                response.setCode(RESPONSE_NOT_FOUND);
                return response;
            }

            Member beforeUpdate = new Member();
            BeanUtils.copyProperties(oldData, beforeUpdate);

            oldData.setName(member.getName());
            oldData.setDateOfBirth(member.getDateOfBirth());
            memberRepository.save(oldData);

            saveLog(actor, "UPDATE", beforeUpdate, oldData);

            response.setCode(RESPONSE_SUCCESS);
            response.setData(oldData);

            //Push event
            messagingTemplate.convertAndSend("/topic/event", "UPDATE");
        } catch (Exception e) {
            response.setCode(RESPONSE_ERROR);
        }
        return response;
    }

    @Override
    public CDCResponse delete(Integer id, String actor) {
        CDCResponse response = checkActor(actor);
        if (response.getCode() != null) return response;

        try {
            Member memberDB = memberRepository.findFirstById(id);
            if (memberDB == null) {
                response.setCode(RESPONSE_NOT_FOUND);
                return response;
            }

            saveLog(actor, "DELETE", memberDB, null);

            memberRepository.delete(memberDB);

            response.setCode(RESPONSE_SUCCESS);
            response.setData(memberDB);

            //Push event
            messagingTemplate.convertAndSend("/topic/event", "DETETE");
        } catch (Exception e) {
            response.setCode(RESPONSE_ERROR);
        }
        return response;
    }

    @Override
    public CDCResponse getData(String keyWord, Integer page, Integer pageSize, String actor) {
        CDCResponse response = checkActor(actor);
        if (response.getCode() != null) return response;

        try {
            Pageable pageable = PageRequest.of(page, pageSize, Sort.by("id").descending());
            Page<Member> resultPage = memberRepository.findByNameContainingIgnoreCase(keyWord, pageable);

            Map<String, Object> condition = new HashMap<>();
            condition.put("keyWord", keyWord);
            condition.put("page", page);
            condition.put("pageSize", pageSize);

            Map<String, Object> data = new HashMap<>();
            data.put("items", resultPage.getContent());
            data.put("totalElements", resultPage.getTotalElements());
            data.put("totalPages", resultPage.getTotalPages());
            response.setCode(RESPONSE_SUCCESS);
            response.setData(data);
        } catch (Exception e) {
            response.setCode(RESPONSE_ERROR);
        }
        return response;
    }

    @Override
    public CDCResponse exportExcel(String actor) {
        CDCResponse response = checkActor(actor);
        if (response.getCode() != null) return response;

        try {
            List<Member> members = memberRepository.findAll();
            members.sort(Comparator.comparing(Member::getId).reversed());

            byte[] excelBytes;

            try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

                Sheet sheet = workbook.createSheet("Danh Sách Nhân Viên");

                // ===== Header style =====
                CellStyle headerStyle = workbook.createCellStyle();
                headerStyle.setFillForegroundColor(IndexedColors.RED.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

                Font headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerFont.setColor(IndexedColors.WHITE.getIndex());
                headerFont.setFontHeightInPoints((short) 12);
                headerStyle.setFont(headerFont);
                headerStyle.setAlignment(HorizontalAlignment.CENTER);
                headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);

                // ===== Cell style =====
                CellStyle cellStyle = workbook.createCellStyle();
                cellStyle.setBorderBottom(BorderStyle.THIN);
                cellStyle.setBorderTop(BorderStyle.THIN);
                cellStyle.setBorderLeft(BorderStyle.THIN);
                cellStyle.setBorderRight(BorderStyle.THIN);
                cellStyle.setVerticalAlignment(VerticalAlignment.CENTER);

                // ===== Lucky number style =====
                CellStyle luckyNumberStyle = workbook.createCellStyle();
                luckyNumberStyle.cloneStyleFrom(cellStyle);
                luckyNumberStyle.setAlignment(HorizontalAlignment.CENTER);

                Font luckyFont = workbook.createFont();
                luckyFont.setBold(true);
                luckyFont.setColor(IndexedColors.RED.getIndex());
                luckyFont.setFontHeightInPoints((short) 14);
                luckyNumberStyle.setFont(luckyFont);

                // ===== Header row =====
                String[] headers = {"STT", "Số May Mắn", "Họ và Tên", "Ngày Sinh", "Tạo lúc"};
                Row headerRow = sheet.createRow(0);

                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                }

                // ===== Data rows =====
                int rowNum = 1;
                for (Member member : members) {
                    Row row = sheet.createRow(rowNum);

                    Cell c0 = row.createCell(0);
                    c0.setCellValue(rowNum);
                    c0.setCellStyle(cellStyle);

                    Cell c1 = row.createCell(1);
                    c1.setCellValue(String.format("%03d", member.getId()));
                    c1.setCellStyle(luckyNumberStyle);

                    Cell c2 = row.createCell(2);
                    c2.setCellValue(member.getName() != null ? member.getName() : "N/A");
                    c2.setCellStyle(cellStyle);

                    Cell c3 = row.createCell(3);
                    c3.setCellValue(member.getDateOfBirth() != null ? new SimpleDateFormat("dd/MM/yyyy").format(member.getDateOfBirth()) : "N/A");
                    c3.setCellStyle(cellStyle);

                    Cell c4 = row.createCell(4);
                    c4.setCellValue(member.getCreatedTime() != null ? new SimpleDateFormat("HH:mm:ss - dd/MM/yyyy").format(member.getCreatedTime()) : "N/A");
                    c4.setCellStyle(cellStyle);

                    rowNum++;
                }

                for (int i = 0; i < headers.length; i++) {
                    sheet.autoSizeColumn(i);
                    sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 1000);
                }

                workbook.write(out);
                excelBytes = out.toByteArray();
            }

            response.setCode(RESPONSE_SUCCESS);
            response.setData(excelBytes);
            return response;

        } catch (Exception e) {
            response.setCode(RESPONSE_ERROR);
            return response;
        }
    }

    @Override
    public CDCResponse toggleAllowCreate() {
        CDCResponse response = new CDCResponse();
        try {
            SystemConfig systemConfig = systemConfigRepository.findFirstByKey(SCK_ALLOW_CREATE);
            if (systemConfig != null) {
                systemConfig.setData("Y".equals(systemConfig.getData()) ? "Y" : "N");
                systemConfigRepository.save(systemConfig);
            } else {
                systemConfig = new SystemConfig();
                systemConfig.setKey(SCK_ALLOW_CREATE);
                systemConfig.setData("Y");
                systemConfigRepository.save(systemConfig);
            }
            response.setCode(RESPONSE_SUCCESS);
        } catch (Exception e) {
            response.setCode(RESPONSE_ERROR);
        }
        return response;
    }

    @Override
    public CDCResponse getAllowCreate() {
        CDCResponse response = new CDCResponse();
        try {
            response.setCode(RESPONSE_SUCCESS);
            response.setData(isAllowCreate());
        } catch (Exception e) {
            response.setCode(RESPONSE_ERROR);
        }
        return response;
    }

    private void saveLog(String actor, String action, Object asIs, Object toBe) {
        RequestLog log = new RequestLog();
        log.setActor(actor);
        log.setAction(action);
        log.setAsIs(asIs != null ? JsonUtils.toJson(asIs) : "");
        log.setToBe(toBe != null ? JsonUtils.toJson(toBe) : "");
        log.setCreatedTime(new Timestamp(System.currentTimeMillis()));
        requestLogRepository.save(log);
    }

    private CDCResponse checkActor(String actor) {
        if (!StringUtils.hasText(actor)) {
            CDCResponse response = new CDCResponse();
            response.setCode(RESPONSE_UNAUTHORIZED);
            return response;
        }
        return new CDCResponse();
    }

    private Boolean isAllowCreate() {
        boolean isAllowCreate = false;
        try {
            SystemConfig systemConfig = systemConfigRepository.findFirstByKey(SCK_ALLOW_CREATE);
            if (systemConfig != null && "Y".equals(systemConfig.getData())) {
                isAllowCreate = true;
            }
        } catch (Exception e) {
            return isAllowCreate;
        }
        return isAllowCreate;
    }
}