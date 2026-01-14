function formatBirthdateInput(input) {
    // Kiểm tra xem có dấu phân cách không (/, -, ., space)
    if (/[\/\-\.\s]/.test(input)) {
        const p = input.split(/[\/\-\.\s]+/);
        if (p.length !== 3) return { formatted: '', valid: false };

        let d = p[0];
        let m = p[1];
        let y = p[2];

        const expandYear = yy => (parseInt(yy) > 50 ? '19' : '20') + yy;
        if (y.length === 2) y = expandYear(y);

        d = d.padStart(2, '0');
        m = m.padStart(2, '0');

        return { formatted: `${d}/${m}/${y}`, day: +d, month: +m, year: +y };
    }

    // Xử lý trường hợp không có dấu phân cách (chỉ số)
    let n = input.replace(/[^\d]/g, '');
    if (!n) return { formatted: '', valid: false };

    let d, m, y;
    const L = n.length;
    const expandYear = yy => (parseInt(yy) > 50 ? '19' : '20') + yy;

    if (L === 8) {
        [d, m, y] = [n.slice(0,2), n.slice(2,4), n.slice(4,8)];
    }
    else if (L === 6) {
        [d, m, y] = [n.slice(0,2), n.slice(2,4), expandYear(n.slice(4,6))];
    }
    else if (L === 4) {
        [d, m, y] = [n.slice(0,2), n.slice(2,4), String(new Date().getFullYear())];
    }
    else if (L === 5) {
        const [d2, m2, y2] = [n.slice(0,2), n.slice(2,3), n.slice(3,5)];
        const [d1, m1, y1] = [n.slice(0,1), n.slice(1,3), n.slice(3,5)];
        if (d2 >= 1 && d2 <= 31 && m2 >= 1 && m2 <= 9) {
            [d, m, y] = [d2, '0'+m2, expandYear(y2)];
        }
        else if (d1 >= 1 && d1 <= 9 && m1 >= 1 && m1 <= 12) {
            [d, m, y] = ['0'+d1, m1, expandYear(y1)];
        }
        else {
            return { formatted: '', valid: false };
        }
    }
    else if (L === 7) {
        const opts = [
            [n.slice(0,1), n.slice(1,3), n.slice(3,7)],
            [n.slice(0,2), n.slice(2,3), n.slice(3,7)],
            [n.slice(0,1), n.slice(1,2), n.slice(2,7)]
        ];
        const valid = opts.find(([dd, mm, yy]) => dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && yy.length === 4);
        if (valid) {
            [d, m, y] = valid.map((v, i) => i < 2 ? v.padStart(2, '0') : v);
        }
        else {
            return { formatted: '', valid: false };
        }
    }
    else {
        return { formatted: '', valid: false };
    }

    d = d.padStart(2, '0');
    m = m.padStart(2, '0');

    return { formatted: `${d}/${m}/${y}`, day: +d, month: +m, year: +y };
}

function validateFullname(fullname) {
    const n = fullname.trim();
    const err = msg => ({ valid: false, message: msg });

    if (!n) return err('Vui lòng nhập họ và tên');
    if (n.length < 2) return err('Họ tên phải có ít nhất 2 ký tự');
    if (n.length > 100) return err('Họ tên không được quá 100 ký tự');
    if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(n)) return err('Họ tên chỉ được chứa chữ cái');
    if (/\s{2,}/.test(n)) return err('Họ tên không được chứa khoảng trắng liên tiếp');
    if (n.split(/\s+/).filter(w => w).length < 2) return err('Vui lòng nhập đầy đủ họ và tên');

    return { valid: true, cleaned: n };
}

function validateBirthdate(birthdate) {
    const err = msg => ({ valid: false, message: msg });
    if (!birthdate?.trim()) return err('Vui lòng nhập ngày sinh');

    const fmt = formatBirthdateInput(birthdate);
    if (!fmt.formatted) return err('Định dạng ngày sinh không hợp lệ');

    const { day: d, month: m, year: y } = fmt;
    if (m < 1 || m > 12) return err('Tháng không hợp lệ (1-12)');
    if (d < 1 || d > 31) return err('Ngày không hợp lệ (1-31)');

    const days = [31, ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (d > days[m - 1]) return err(`Tháng ${m} chỉ có ${days[m - 1]} ngày`);

    const curYear = new Date().getFullYear();
    if (y < 1900 || y > curYear) return err(`Năm sinh phải từ 1900 đến ${curYear}`);

    const bd = new Date(y, m - 1, d);
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const mDiff = today.getMonth() - bd.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < bd.getDate())) age--;

    if (age < 1) return err('Ngày sinh không hợp lệ');
    if (age > 100) return err('Ngày sinh không hợp lệ');

    return { valid: true, formatted: fmt.formatted };
}