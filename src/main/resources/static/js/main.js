const music = document.getElementById('background-music');

const welcomeScreen = document.getElementById('welcome-screen');
const formScreen = document.getElementById('form-screen');
const resultScreen = document.getElementById('result-screen');

const startBtn = document.getElementById('start-btn');
const registrationForm = document.getElementById('registration-form');
const fullnameInput = document.getElementById('fullname');
const phoneInput = document.getElementById('phone');
const petalsContainer = document.getElementById('petals-container');
const submitBtn = document.getElementById('submit-btn');

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded');
    startPetalRain();
    checkExistingDevice();
});

function checkExistingDevice() {
    const deviceId = localStorage.getItem('deviceId');

    if (deviceId) {
        fetch(`/cdc/find-by-device?deviceId=${encodeURIComponent(deviceId)}`)
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
        // QUAN TRỌNG: Thêm phần này!
        welcomeScreen.classList.add('show');
    }
}


// Tạo một cánh hoa rơi
function createSinglePetal() {
    const petal = document.createElement('div');
    petal.className = 'petal';

    // Random loại hoa: hoadao hoặc hoamai
    const flowerType = Math.random() > 0.5 ? 'hoadao' : 'hoamai';
    petal.style.backgroundImage = `url('images/${flowerType}.png')`;

    // Vị trí ngẫu nhiên từ trái sang phải
    petal.style.left = Math.random() * 100 + '%';

    // Kích thước ngẫu nhiên
    const size = 15 + Math.random() * 5; // 15-30px
    petal.style.width = size + 'px';
    petal.style.height = size + 'px';

    // Thời gian rơi ngẫu nhiên
    const duration = 10 + Math.random() * 10; // 8-16 giây
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
    const xPosition = 10 + Math.random() * 80; // 10% - 90% chiều rộng
    const yPosition = 10 + Math.random() * 60; // 10% - 70% chiều cao
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
    }, 2000); // Mỗi 7 giây kiểm tra 1 lần
}

// Lấy Device ID (có thể sử dụng fingerprint hoặc generate random)
function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
}

// Format số thành 3 chữ số
function formatLuckyNumber(id) {
    return String(id).padStart(3, '0');
}

// Hiển thị kết quả thành công
function showSuccessResult(id) {
    const luckyNumber = formatLuckyNumber(id);
    const resultContent = document.getElementById('result-content');

    resultContent.innerHTML = `
            <h2>SỐ MAY MẮN</h2>
            <div class="lucky-number">${luckyNumber}</div>
        `;

    formScreen.style.animation = 'fadeOut 0.5s ease-out forwards';
    setTimeout(() => {
        formScreen.style.display = 'none';
        resultScreen.classList.add('show');
    }, 500);
}

// Hiển thị kết quả lỗi (đã có số may mắn)
function showErrorResult() {
    const resultContent = document.getElementById('result-content');

    resultContent.innerHTML = `
            <h2>THÔNG BÁO</h2>
            <p class="error-result">Bạn đã có con số may mắn rồi!</p>
        `;

    formScreen.style.animation = 'fadeOut 0.5s ease-out forwards';
    setTimeout(() => {
        formScreen.style.display = 'none';
        resultScreen.classList.add('show');
    }, 500);
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

// Xóa lỗi khi người dùng bắt đầu nhập
fullnameInput.addEventListener('input', function() {
    this.classList.remove('error');
    document.getElementById('fullname-error').classList.remove('show');
});

phoneInput.addEventListener('input', function() {
    this.classList.remove('error');
    document.getElementById('phone-error').classList.remove('show');
});

// Validate form
registrationForm.addEventListener('submit', function(e) {
    e.preventDefault();

    let isValid = true;

    // Validate họ tên
    const fullname = fullnameInput.value.trim();
    if (fullname === '' || fullname.length < 2) {
        fullnameInput.classList.add('error');
        document.getElementById('fullname-error').textContent =
            fullname === '' ? 'Vui lòng nhập họ và tên' : 'Họ tên phải có ít nhất 2 ký tự';
        document.getElementById('fullname-error').classList.add('show');
        isValid = false;
    }

    // Validate số điện thoại
    const phone = phoneInput.value.trim();
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (phone === '') {
        phoneInput.classList.add('error');
        document.getElementById('phone-error').textContent = 'Vui lòng nhập số điện thoại';
        document.getElementById('phone-error').classList.add('show');
        isValid = false;
    } else if (!phoneRegex.test(phone)) {
        phoneInput.classList.add('error');
        document.getElementById('phone-error').textContent = 'Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0 hoặc +84)';
        document.getElementById('phone-error').classList.add('show');
        isValid = false;
    }

    if (isValid) {
        // Disable button để tránh submit nhiều lần
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang xử lý...';

        // Tạo data để gửi
        const nhanVien = {
            name: fullname,
            phoneNumber: phone,
            deviceId: getDeviceId()
        };

        // Gửi request đến API
        fetch("/cdc/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(nhanVien)
        })
            .then(response => {
                return response.json().then(data => {
                    if (data && data.code === 200) {
                        showSuccessResult(data.data.id);
                    } else {
                        showErrorResult();
                    }
                });
            })
            .catch(error => {
                console.error('Error:', error);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Gửi Thông Tin';
            });
    }
});



