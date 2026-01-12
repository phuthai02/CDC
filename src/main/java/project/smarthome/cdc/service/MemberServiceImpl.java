package project.smarthome.cdc.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import project.smarthome.cdc.model.dto.CDCResponse;
import project.smarthome.cdc.model.entity.Member;
import project.smarthome.cdc.repository.MemberRepository;

import java.io.ByteArrayOutputStream;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class MemberServiceImpl implements MemberService {

    @Autowired
    private MemberRepository memberRepository;

    private static final Integer RESPONSE_SUCCESS = 200;
    private static final Integer RESPONSE_ERROR = 500;
    private static final Integer RESPONSE_EXIST = 409;
    private static final Integer RESPONSE_NOT_FOUND = 404;
    private static final String[] badSuffix = {"13", "49", "53"};

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
        } catch (Exception e) {
            response.setCode(RESPONSE_ERROR);
        }
        return response;
    }

    @Override
    public CDCResponse update(Integer id, Member member) {
        return null;
    }

    @Override
    public CDCResponse delete(Integer id) {
        return null;
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
    public CDCResponse findAll() {
        CDCResponse response = new CDCResponse();
        try {
            List<Member> members = memberRepository.findAll();
            response.setCode(RESPONSE_SUCCESS);
            response.setData(members);
        } catch (Exception e) {
            response.setCode(RESPONSE_ERROR);
        }
        return response;
    }

    @Override
    public byte[] exportExcel() throws Exception {
        List<Member> members = memberRepository.findAll();

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Danh Sách Nhân Viên");

            // Tạo style cho header
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

            // Tạo style cho cells
            CellStyle cellStyle = workbook.createCellStyle();
            cellStyle.setBorderBottom(BorderStyle.THIN);
            cellStyle.setBorderTop(BorderStyle.THIN);
            cellStyle.setBorderRight(BorderStyle.THIN);
            cellStyle.setBorderLeft(BorderStyle.THIN);
            cellStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // Tạo style cho số may mắn
            CellStyle luckyNumberStyle = workbook.createCellStyle();
            luckyNumberStyle.cloneStyleFrom(cellStyle);
            luckyNumberStyle.setAlignment(HorizontalAlignment.CENTER);
            Font luckyFont = workbook.createFont();
            luckyFont.setBold(true);
            luckyFont.setColor(IndexedColors.RED.getIndex());
            luckyFont.setFontHeightInPoints((short) 14);
            luckyNumberStyle.setFont(luckyFont);

            // Tạo header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"STT", "Số May Mắn", "Họ và Tên", "Ngày Sinh", "Tạo lúc"};

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Tạo data rows
            int rowNum = 1;
            for (Member member : members) {
                Row row = sheet.createRow(rowNum++);

                Cell cell0 = row.createCell(0);
                cell0.setCellValue(rowNum - 1);
                cell0.setCellStyle(cellStyle);

                Cell cell1 = row.createCell(1);
                cell1.setCellValue(String.format("%03d", member.getId()));
                cell1.setCellStyle(luckyNumberStyle);

                Cell cell2 = row.createCell(2);
                cell2.setCellValue(member.getName() != null ? member.getName() : "N/A");
                cell2.setCellStyle(cellStyle);

                Cell cell3 = row.createCell(3);
                cell3.setCellValue(member.getDateOfBirth() != null ? new SimpleDateFormat("dd/MM/yyyy").format(member.getDateOfBirth()) : "N/A");
                cell3.setCellStyle(cellStyle);

                Cell cell4 = row.createCell(4);
                cell4.setCellValue(member.getCreatedTime() != null ? new SimpleDateFormat("dd/MM/yyyy").format(member.getCreatedTime()) : "N/A");
                cell4.setCellStyle(cellStyle);
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 1000);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }
}