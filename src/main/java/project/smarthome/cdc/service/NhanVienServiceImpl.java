package project.smarthome.cdc.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import project.smarthome.cdc.model.dto.CDCResponse;
import project.smarthome.cdc.model.entity.NhanVien;
import project.smarthome.cdc.repository.NhanVienRepository;

import java.io.ByteArrayOutputStream;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class NhanVienServiceImpl implements NhanVienService {

    @Autowired
    private NhanVienRepository nhanVienRepository;

    private static final Integer RESPONSE_SUCCESS = 200;
    private static final Integer RESPONSE_ERROR = 500;
    private static final Integer RESPONSE_EXIST = 409;
    private static final Integer RESPONSE_NOT_FOUND = 404;
    private static final String[] badSuffix = {"13", "49", "53"};

    @Override
    public CDCResponse create(NhanVien nhanVien) {
        CDCResponse response = new CDCResponse();
        try {
            // Kiểm tra trùng lặp
            NhanVien nhanVienDB = nhanVienRepository.findFirstByNameAndDateOfBirth(nhanVien.getName(), nhanVien.getDateOfBirth());
            if (nhanVienDB != null) {
                response.setCode(RESPONSE_EXIST);
                response.setData(nhanVienDB);
                return response;
            }

            //Tạo deviceId
            String deviceId = UUID.randomUUID().toString();
            nhanVien.setDeviceId(deviceId);
            nhanVien.setCreatedTime(new Timestamp(System.currentTimeMillis()));

            //Validate id xấu
            while (true) {
                nhanVienDB = nhanVienRepository.save(nhanVien);
                String idStr = nhanVienDB.getId().toString();
                boolean isBad = false;
                for (String s : badSuffix) {
                    if (idStr.endsWith(s)) {
                        isBad = true;
                        break;
                    }
                }
                if (!isBad) break;
                nhanVienRepository.delete(nhanVienDB);
            }

            //Set data trả về
            response.setCode(RESPONSE_SUCCESS);
            response.setData(nhanVienDB);
        } catch (Exception e) {
            log.info(e.getMessage());
            response.setCode(RESPONSE_ERROR);
        }
        return response;
    }

    @Override
    public CDCResponse findByDeviceId(String deviceId) {
        CDCResponse response = new CDCResponse();
        try {
            NhanVien nhanVien = nhanVienRepository.findFirstByDeviceId(deviceId);
            if (nhanVien != null) {
                response.setCode(RESPONSE_SUCCESS);
                response.setData(nhanVien);
                return response;
            }
            response.setCode(RESPONSE_NOT_FOUND);
        } catch (Exception e) {
            response.setCode(RESPONSE_ERROR);
        }
        return response;
    }

    @Override
    public CDCResponse update(NhanVien nhanVien) {
        return null;
    }

    @Override
    public CDCResponse delete(NhanVien nhanVien) {
        return null;
    }

    @Override
    public CDCResponse findAll() {
        CDCResponse response = new CDCResponse();
        try {
            List<NhanVien> nhanViens = nhanVienRepository.findAll();
            response.setCode(RESPONSE_SUCCESS);
            response.setData(nhanViens);
        } catch (Exception e) {
            response.setCode(RESPONSE_ERROR);
        }
        return response;
    }

    @Override
    public byte[] exportToExcel() throws Exception {
        List<NhanVien> nhanViens = nhanVienRepository.findAll();

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
            for (NhanVien nhanVien : nhanViens) {
                Row row = sheet.createRow(rowNum++);

                Cell cell0 = row.createCell(0);
                cell0.setCellValue(rowNum - 1);
                cell0.setCellStyle(cellStyle);

                Cell cell1 = row.createCell(1);
                cell1.setCellValue(String.format("%03d", nhanVien.getId()));
                cell1.setCellStyle(luckyNumberStyle);

                Cell cell2 = row.createCell(2);
                cell2.setCellValue(nhanVien.getName() != null ? nhanVien.getName() : "N/A");
                cell2.setCellStyle(cellStyle);

                Cell cell3 = row.createCell(3);
                cell3.setCellValue(nhanVien.getDateOfBirth() != null ? new SimpleDateFormat("dd/MM/yyyy").format(nhanVien.getDateOfBirth()) : "N/A");
                cell3.setCellStyle(cellStyle);

                Cell cell4 = row.createCell(4);
                cell4.setCellValue(nhanVien.getCreatedTime() != null ? new SimpleDateFormat("dd/MM/yyyy").format(nhanVien.getCreatedTime()) : "N/A");
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