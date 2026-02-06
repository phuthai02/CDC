package project.smarthome.cdc.model.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.sql.Timestamp;

@Data
@Entity
@Table(name = "REQUEST_LOG")
public class RequestLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @Column(name = "ACTOR", nullable = false, length = 128)
    private String actor;

    @Column(name = "ACTION", nullable = false, length = 16)
    private String action;

    @Column(name = "AS_IS", nullable = false, length = 512)
    private String asIs;

    @Column(name = "TO_BE", nullable = false, length = 512)
    private String toBe;

    @Column(name = "CREATED_TIME", nullable = false)
    private Timestamp createdTime;
}
