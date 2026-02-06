package project.smarthome.cdc.model.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "SYSTEM_CONFIG")
public class SystemConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @Column(name = "`KEY`", nullable = false, length = 16)
    private String key;

    @Column(name = "DATA", nullable = false, length = 128)
    private String data;
}
