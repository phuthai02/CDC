package project.smarthome.cdc.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
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

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

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

    // Constants
    private static final Integer RESPONSE_SUCCESS = 200;
    private static final Integer RESPONSE_ERROR = 500;
    private static final Integer RESPONSE_EXIST = 409;
    private static final Integer RESPONSE_NOT_FOUND = 404;
    private static final Integer RESPONSE_UNAUTHORIZED = 401;
    private static final Integer RESPONSE_EXPIRED = 403;
    private static final String[] BAD_SUFFIX = {"13", "49", "53"};
    private static final String SCK_ALLOW_CREATE = "SCK_ALLOW_CREATE";

    // Pre-loaded resources
    private BufferedImage templateImage;
    private java.awt.Font customFont;
    private final ExecutorService asyncExecutor = Executors.newFixedThreadPool(
            Runtime.getRuntime().availableProcessors()
    );

    // Thread-safe date formatters
    private static final ThreadLocal<SimpleDateFormat> DATE_FORMAT =
            ThreadLocal.withInitial(() -> new SimpleDateFormat("dd/MM/yyyy"));
    private static final ThreadLocal<SimpleDateFormat> DATETIME_FORMAT =
            ThreadLocal.withInitial(() -> new SimpleDateFormat("HH:mm:ss - dd/MM/yyyy"));

    /**
     * Pre-load resources khi service khởi động
     */
    @PostConstruct
    public void init() {
        // Load template image và vẽ sẵn title
        asyncExecutor.submit(() -> {
            try {
                ClassPathResource resource = new ClassPathResource("static/images/frame_2.png");
                BufferedImage baseImage = ImageIO.read(resource.getInputStream());

                // Vẽ sẵn title vào template
                Graphics2D g2d = baseImage.createGraphics();
                configureGraphics(g2d);

                // Đợi font load xong
                Thread.sleep(100);

                if (customFont == null) {
                    customFont = new java.awt.Font("Arial", java.awt.Font.BOLD, 90);
                }

                java.awt.Font titleFont = customFont.deriveFont(java.awt.Font.BOLD, 40f);
                g2d.setFont(titleFont);
                g2d.setColor(new Color(189, 14, 21));
                g2d.drawString("CON SỐ MAY MẮN", 338, 306 + g2d.getFontMetrics(titleFont).getAscent());

                g2d.dispose();

                templateImage = baseImage;
                log.info("[CDC] Template image with title pre-loaded successfully");
            } catch (Exception e) {
                log.error("[CDC] Failed to pre-load template image", e);
            }
        });

        // Load custom font
        asyncExecutor.submit(() -> {
            try {
                ClassPathResource fontResource = new ClassPathResource("static/fonts/Bungee-Regular.ttf");
                if (fontResource.exists()) {
                    customFont = java.awt.Font.createFont(java.awt.Font.TRUETYPE_FONT, fontResource.getInputStream());
                    log.info("[CDC] Bungee font pre-loaded successfully");
                } else {
                    log.warn("[CDC] Bungee font not found, using Arial Bold");
                    customFont = new java.awt.Font("Arial", java.awt.Font.BOLD, 90);
                }
            } catch (Exception e) {
                log.warn("[CDC] Error loading Bungee font, using Arial Bold: {}", e.getMessage());
                customFont = new java.awt.Font("Arial", java.awt.Font.BOLD, 90);
            }
        });
    }

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

            // Tạo deviceId
            member.setDeviceId(UUID.randomUUID().toString());
            member.setCreatedTime(new Timestamp(System.currentTimeMillis()));

            // Validate id xấu - tối ưu với Set lookup
            Set<String> badSuffixSet = new HashSet<>(Arrays.asList(BAD_SUFFIX));
            while (true) {
                memberDB = memberRepository.save(member);
                String idStr = memberDB.getId().toString();

                boolean isBad = badSuffixSet.stream()
                        .anyMatch(idStr::endsWith);

                if (!isBad) break;
                memberRepository.delete(memberDB);
            }

            response.setCode(RESPONSE_SUCCESS);
            response.setData(memberDB);

            // Push event async
            asyncExecutor.submit(() ->
                    messagingTemplate.convertAndSend("/topic/event", "CREATE")
            );
        } catch (Exception e) {
            log.error("[CDC] Error in create", e);
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
            log.error("[CDC] Error in findByDeviceId", e);
            response.setCode(RESPONSE_ERROR);
        }
        return response;
    }

    @Override
    public CDCResponse downloadImage(String deviceId) {
        CDCResponse response = new CDCResponse();
        try {
            Member member = memberRepository.findFirstByDeviceId(deviceId);
            if (member == null) {
                response.setCode(RESPONSE_NOT_FOUND);
                return response;
            }

            // Format ID as 3 digits: 001, 021, 111
            String luckyNumber = String.format("%03d", member.getId());
            String fileName = "lucky_number_" + luckyNumber + ".png";
            String outputPath = "src/main/resources/static/downloads/" + fileName;
            File outputFile = new File(outputPath);

            // Kiểm tra nếu ảnh đã tồn tại thì return luôn
            if (outputFile.exists()) {
                log.info("[CDC] Image already exists: {}", fileName);
                response.setCode(RESPONSE_SUCCESS);
                response.setData("/downloads/" + fileName);
                return response;
            }

            // Tạo thư mục nếu chưa có
            File parentDir = outputFile.getParentFile();
            if (!parentDir.exists()) {
                parentDir.mkdirs();
            }

            // Sử dụng template đã load sẵn (title đã vẽ sẵn)
            BufferedImage image = cloneImage(templateImage);
            Graphics2D g2d = image.createGraphics();
            configureGraphics(g2d);

            // Chỉ vẽ số may mắn
            java.awt.Font numberFont = customFont.deriveFont(java.awt.Font.BOLD, 90f);
            g2d.setFont(numberFont);
            g2d.setColor(new Color(189, 14, 21));
            g2d.drawString(luckyNumber, 418, 366 + g2d.getFontMetrics(numberFont).getAscent());

            g2d.dispose();

            // Lưu file
            ImageIO.write(image, "png", outputFile);

            log.info("[CDC] Image created: {} with lucky number: {}", fileName, luckyNumber);

            response.setCode(RESPONSE_SUCCESS);
            response.setData("/downloads/" + fileName);

        } catch (Exception e) {
            log.error("[CDC] Error in downloadImage", e);
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
            response.setData(memberDB.getDeviceId());
        } catch (Exception e) {
            log.error("[CDC] Error in login", e);
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

            // Save log async
            asyncExecutor.submit(() -> saveLog(actor, "UPDATE", beforeUpdate, oldData));

            response.setCode(RESPONSE_SUCCESS);
            response.setData(oldData);

            // Push event async
            asyncExecutor.submit(() ->
                    messagingTemplate.convertAndSend("/topic/event", "UPDATE")
            );
        } catch (Exception e) {
            log.error("[CDC] Error in update", e);
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

            // Save log async
            Member finalMemberDB = memberDB;
            asyncExecutor.submit(() -> saveLog(actor, "DELETE", finalMemberDB, null));

            memberRepository.delete(memberDB);

            response.setCode(RESPONSE_SUCCESS);
            response.setData(memberDB);

            // Push event async
            asyncExecutor.submit(() ->
                    messagingTemplate.convertAndSend("/topic/event", "DELETE")
            );
        } catch (Exception e) {
            log.error("[CDC] Error in delete", e);
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

            Map<String, Object> data = new HashMap<>();
            data.put("items", resultPage.getContent());
            data.put("totalElements", resultPage.getTotalElements());
            data.put("totalPages", resultPage.getTotalPages());
            data.put("idMax", memberRepository.getMaxId());
            data.put("allowCreate", isAllowCreate());

            response.setCode(RESPONSE_SUCCESS);
            response.setData(data);
        } catch (Exception e) {
            log.error("[CDC] Error in getData", e);
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

                // Tạo styles một lần
                CellStyle headerStyle = createHeaderStyle(workbook);
                CellStyle cellStyle = createCellStyle(workbook);
                CellStyle luckyNumberStyle = createLuckyNumberStyle(workbook, cellStyle);

                // Header row
                String[] headers = {"STT", "Số May Mắn", "Họ và Tên", "Ngày Sinh", "Tạo lúc"};
                Row headerRow = sheet.createRow(0);

                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                }

                // Data rows
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
                    c3.setCellValue(member.getDateOfBirth() != null ?
                            DATE_FORMAT.get().format(member.getDateOfBirth()) : "N/A");
                    c3.setCellStyle(cellStyle);

                    Cell c4 = row.createCell(4);
                    c4.setCellValue(member.getCreatedTime() != null ?
                            DATETIME_FORMAT.get().format(member.getCreatedTime()) : "N/A");
                    c4.setCellStyle(cellStyle);

                    rowNum++;
                }

                // Auto-size columns
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
            log.error("[CDC] Error in exportExcel", e);
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
                systemConfig.setData("Y".equals(systemConfig.getData()) ? "N" : "Y");
                systemConfigRepository.save(systemConfig);
            } else {
                systemConfig = new SystemConfig();
                systemConfig.setKey(SCK_ALLOW_CREATE);
                systemConfig.setData("Y");
                systemConfigRepository.save(systemConfig);
            }

            response.setCode(RESPONSE_SUCCESS);
            response.setData("Y".equals(systemConfig.getData()));

            // Push event async
            asyncExecutor.submit(() ->
                    messagingTemplate.convertAndSend("/topic/event", "TOGGLE_ALLOW_CREATE")
            );
        } catch (Exception e) {
            log.error("[CDC] Error in toggleAllowCreate", e);
            response.setCode(RESPONSE_ERROR);
        }
        return response;
    }

    // ===== Private Helper Methods =====

    private void saveLog(String actor, String action, Object asIs, Object toBe) {
        try {
            RequestLog log = new RequestLog();
            log.setActor(actor);
            log.setAction(action);
            log.setAsIs(asIs != null ? JsonUtils.toJson(asIs) : "");
            log.setToBe(toBe != null ? JsonUtils.toJson(toBe) : "");
            log.setCreatedTime(new Timestamp(System.currentTimeMillis()));
            requestLogRepository.save(log);
        } catch (Exception e) {
            log.error("[CDC] Error saving log", e);
        }
    }

    private CDCResponse checkActor(String actor) {
        if (!StringUtils.hasText(actor)) {
            CDCResponse response = new CDCResponse();
            response.setCode(RESPONSE_UNAUTHORIZED);
            return response;
        }
        return new CDCResponse();
    }

    /**
     * Kiểm tra allowCreate từ DB
     */
    private Boolean isAllowCreate() {
        try {
            SystemConfig systemConfig = systemConfigRepository.findFirstByKey(SCK_ALLOW_CREATE);
            return systemConfig != null && "Y".equals(systemConfig.getData());
        } catch (Exception e) {
            log.error("[CDC] Error checking allowCreate", e);
            return false;
        }
    }

    /**
     * Clone BufferedImage để tránh modify template gốc
     */
    private BufferedImage cloneImage(BufferedImage source) {
        BufferedImage clone = new BufferedImage(
                source.getWidth(),
                source.getHeight(),
                source.getType()
        );
        Graphics2D g = clone.createGraphics();
        g.drawImage(source, 0, 0, null);
        g.dispose();
        return clone;
    }

    /**
     * Configure graphics rendering hints
     */
    private void configureGraphics(Graphics2D g2d) {
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
    }

    /**
     * Create Excel header style
     */
    private CellStyle createHeaderStyle(Workbook workbook) {
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

        return headerStyle;
    }

    /**
     * Create Excel cell style
     */
    private CellStyle createCellStyle(Workbook workbook) {
        CellStyle cellStyle = workbook.createCellStyle();
        cellStyle.setBorderBottom(BorderStyle.THIN);
        cellStyle.setBorderTop(BorderStyle.THIN);
        cellStyle.setBorderLeft(BorderStyle.THIN);
        cellStyle.setBorderRight(BorderStyle.THIN);
        cellStyle.setVerticalAlignment(VerticalAlignment.CENTER);

        return cellStyle;
    }

    /**
     * Create Excel lucky number style
     */
    private CellStyle createLuckyNumberStyle(Workbook workbook, CellStyle baseStyle) {
        CellStyle luckyNumberStyle = workbook.createCellStyle();
        luckyNumberStyle.cloneStyleFrom(baseStyle);
        luckyNumberStyle.setAlignment(HorizontalAlignment.CENTER);

        Font luckyFont = workbook.createFont();
        luckyFont.setBold(true);
        luckyFont.setColor(IndexedColors.RED.getIndex());
        luckyFont.setFontHeightInPoints((short) 14);
        luckyNumberStyle.setFont(luckyFont);

        return luckyNumberStyle;
    }
}