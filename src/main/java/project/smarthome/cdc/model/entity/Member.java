package project.smarthome.cdc.model.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.Data;

import java.sql.Date;
import java.sql.Timestamp;

@Data
@Entity
@Table(name = "MEMBER")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @Column(name = "NAME", nullable = false, length = 124)
    private String name;

    @Column(name = "DATE_OF_BIRTH", nullable = false)
    @JsonFormat(pattern = "dd/MM/yyyy", timezone = "Asia/Ho_Chi_Minh")
    private Date dateOfBirth;

    @Column(name = "DEVICE_ID", nullable = false, length = 124)
    private String deviceId;

    @Column(name = "CREATED_TIME", nullable = false, updatable = false)
    private Timestamp createdTime;
}
