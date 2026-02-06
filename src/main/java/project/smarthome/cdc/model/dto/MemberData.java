package project.smarthome.cdc.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MemberData {
    private String memberID;
    private String memberName;
    private String memberDepartment;
    private String memberRole;
    private String memberDayOfBirth;
}
