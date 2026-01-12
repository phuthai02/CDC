const music = document.getElementById('background-music');

const welcomeScreen = document.getElementById('welcome-screen');
const formScreen = document.getElementById('form-screen');
const resultScreen = document.getElementById('result-screen');

const startBtn = document.getElementById('start-btn');
const registrationForm = document.getElementById('registration-form');
const fullnameInput = document.getElementById('fullname');
const birthdateInput = document.getElementById('birthdate');
const petalsContainer = document.getElementById('petals-container');
const submitBtn = document.getElementById('submit-btn');
const downloadBtn = document.getElementById('download-btn');


document.addEventListener('DOMContentLoaded', function () {
    startPetalRain();
    checkExistingDevice();
});

function checkExistingDevice() {
    const deviceId = localStorage.getItem('deviceId');

    if (deviceId) {
        fetch(`/find-by-device?deviceId=${encodeURIComponent(deviceId)}`)
            .then(response => response.json())
            .then(data => {
                if (data.code === 404) {
                    localStorage.removeItem('deviceId');
                    welcomeScreen.classList.add('show');
                } else if (data.code === 200 && data.data && data.data.id) {
                    showSuccessResult(data.data.id);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                localStorage.removeItem('deviceId');
                welcomeScreen.classList.add('show');
            });
    } else {
        welcomeScreen.classList.add('show');
    }

    // music.play();
}

// Tạo một cánh hoa rơi - Tối ưu cho Safari
function createSinglePetal() {
    const petal = document.createElement('div');
    petal.className = 'petal';

    // Random loại hoa: hoadao hoặc hoamai
    const flowerType = Math.random() > 0.5 ? 'hoadao' : 'hoamai';
    petal.style.backgroundImage = `url('images/${flowerType}.png')`;

    // Vị trí ngẫu nhiên từ trái sang phải
    petal.style.left = Math.random() * 100 + '%';

    // Kích thước ngẫu nhiên
    const size = 15 + Math.random() * 5;
    petal.style.width = size + 'px';
    petal.style.height = size + 'px';

    // Thời gian rơi ngẫu nhiên
    const duration = 10 + Math.random() * 10;
    petal.style.animationDuration = duration + 's';

    // Một số cánh hoa rơi theo hướng ngược lại
    if (Math.random() > 0.5) {
        petal.style.animationName = 'fallReverse';
    }

    petalsContainer.appendChild(petal);

    // Xóa cánh hoa sau khi animation kết thúc
    setTimeout(() => {
        petal.remove();
    }, duration * 1000);
}

function startPetalRain() {
    setInterval(() => {
        const petalCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < petalCount; i++) {
            setTimeout(() => {
                createSinglePetal();
            }, i * 500);
        }
    }, 2000);
}

// Tạo pháo hoa GIF ngẫu nhiên
function createFireworkGif() {
    const firework = document.createElement('img');

    // Chọn ngẫu nhiên 1 trong 3 file GIF
    const fireworkNumber = Math.floor(Math.random() * 3) + 1;
    firework.src = `images/firework_${fireworkNumber}.gif`;
    firework.className = 'firework-gif';

    // Vị trí ngẫu nhiên (tránh các góc màn hình)
    const xPosition = 10 + Math.random() * 80;
    const yPosition = 10 + Math.random() * 60;
    firework.style.left = xPosition + '%';
    firework.style.top = yPosition + '%';

    // Kích thước ngẫu nhiên (150px - 350px)
    const size = 150 + Math.random() * 200;
    firework.style.width = size + 'px';
    firework.style.height = size + 'px';

    // Thêm vào body
    document.body.appendChild(firework);

    // Xóa sau 3 giây (thời gian hiển thị GIF)
    setTimeout(() => {
        firework.style.animation = 'fadeOut 0.5s ease-out forwards';
        setTimeout(() => {
            firework.remove();
        }, 500);
    }, 3000);
}

function startFireworkShow() {
    setInterval(() => {
        // Ngẫu nhiên có nổ pháo hoa hay không (70% cơ hội)
        if (Math.random() > 0.3) {
            createFireworkGif();

            // Có thể nổ thêm 1 pháo hoa nữa (30% cơ hội)
            if (Math.random() > 0.7) {
                setTimeout(() => {
                    createFireworkGif();
                }, 500);
            }
        }
    }, 2000);
}

// Chuyển từ welcome screen sang form screen
startBtn.addEventListener('click', function() {
    // Hiệu ứng chuyển đổi
    welcomeScreen.style.animation = 'fadeOut 0.5s ease-out forwards';

    setTimeout(() => {
        welcomeScreen.style.display = 'none';
        formScreen.classList.add('show');
    }, 500);
});


// =========================================== SUBMIT =================================================================//


fullnameInput.addEventListener('input', function() {
    this.classList.remove('error');
    document.getElementById('fullname-error').classList.remove('show');
});

birthdateInput.addEventListener('input', function() {
    this.classList.remove('error');
    document.getElementById('birthdate-error').classList.remove('show');
});

birthdateInput.addEventListener('blur', function() {
    const value = this.value.trim();
    if (value) {
        const result = formatBirthdateInput(value);
        if (result.formatted) {
            this.value = result.formatted;
        }
    }
});

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

registrationForm.addEventListener('submit', function(e) {
    e.preventDefault();

    let isValid = true;

    // Validate họ tên
    const fullname = fullnameInput.value.trim();
    const fullnameValidation = validateFullname(fullname);

    if (!fullnameValidation.valid) {
        fullnameInput.classList.add('error');
        document.getElementById('fullname-error').textContent = fullnameValidation.message;
        document.getElementById('fullname-error').classList.add('show');
        isValid = false;
    }

    // Validate ngày sinh
    const birthdate = birthdateInput.value.trim();
    const birthdateValidation = validateBirthdate(birthdate);

    if (!birthdateValidation.valid) {
        birthdateInput.classList.add('error');
        document.getElementById('birthdate-error').textContent = birthdateValidation.message;
        document.getElementById('birthdate-error').classList.add('show');
        isValid = false;
    } else {
        birthdateInput.value = birthdateValidation.formatted;
    }

    if (isValid) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang xử lý...';

        const member = {
            name: fullnameValidation.cleaned,
            dateOfBirth: birthdateValidation.formatted
        };

        fetch("/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(member)
        })
            .then(response => {
                return response.json().then(data => {
                    if (data && (data.code === 200 || data.code === 409)) {
                        showSuccessResult(data.data.id, data.data.deviceId);
                    } else {
                        showErrorResult();
                    }
                });
            })
            .catch(error => {
                console.error('Error:', error);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Xác nhận';
            });
    }
});

function showErrorResult() {
    const resultContent = document.getElementById('result-content');

    resultContent.innerHTML = `
        <h2>HỆ THỐNG XẢY RA LỖI</h2>
    `;

    formScreen.style.animation = 'fadeOut 0.5s ease-out forwards';
    setTimeout(() => {
        formScreen.style.display = 'none';
        resultScreen.classList.add('show');
    }, 500);
}

function showSuccessResult(id, deviceId) {
    if (deviceId) {
        localStorage.setItem('deviceId', deviceId);
    }

    const luckyNumber = String(id).padStart(3, '0');
    const resultContent = document.getElementById('result-content');

    resultContent.innerHTML = `
        <h2>CON SỐ MAY MẮN</h2>
        <div class="lucky-number">${luckyNumber}</div>
    `;

    formScreen.style.animation = 'fadeOut 0.5s ease-out forwards';
    setTimeout(() => {
        formScreen.style.display = 'none';
        resultScreen.classList.add('show');
    }, 500);
}