const welcomeScreen = document.getElementById('welcome-screen');
const formScreen = document.getElementById('form-screen');
const resultScreen = document.getElementById('result-screen');

const startBtn = document.getElementById('start-btn');
const registrationForm = document.getElementById('registration-form');
const fullnameInput = document.getElementById('fullname');
const birthdateInput = document.getElementById('birthdate');
const petalsContainer = document.getElementById('petals-container');
const submitBtn = document.getElementById('submit-btn');

// Hàm tải xuống hình ảnh khi click/tap
function downloadOnClick() {
    const deviceId = localStorage.getItem("deviceId");
    if (deviceId) {
        downloadImage(deviceId);
    }
}

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
                    showSuccessResult(data.data.id, data.data.deviceId);
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
                    }
                    else if (data && data.code === 403) {
                        showErrorResult("HẾT GIỜ ĐĂNG KÝ");
                    }
                    else {
                        showErrorResult("LỖI HỆ THỐNG");
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

function showErrorResult(msg) {
    const resultContent = document.getElementById('result-content');

    resultContent.innerHTML = `
        <h2>${msg}</h2>
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
        <p class="hint-text"><u>Nhấn để tải hình ảnh</u></p>
    `;

    formScreen.style.animation = 'fadeOut 0.5s ease-out forwards';

    setTimeout(() => {
        formScreen.style.display = 'none';
        resultScreen.classList.add('show');
        const hintText = document.querySelector('.hint-text');
        if (hintText) {
            hintText.addEventListener('click', downloadOnClick);
            hintText.addEventListener('touchstart', downloadOnClick, { passive: false });
        }
    }, 500);
}

// Thay thế hàm downloadImage cũ
async function downloadImage(deviceId) {
    try {
        const response = await fetch(`/download-image?deviceId=${encodeURIComponent(deviceId)}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();

        // Detect thiết bị
        const userAgent = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isAndroid = /Android/.test(userAgent);
        const isMobile = isIOS || isAndroid;

        if (isMobile) {
            // Mobile: Hiển thị modal với hướng dẫn hoặc nút download
            showMobileImageModal(blob, isIOS);
        } else {
            // Desktop: Download trực tiếp
            downloadDirectly(blob, 'lucky_number.png');
            showToast('Đã tải xuống thành công');
        }

    } catch (error) {
        console.error('[Download Image] Error:', error);
        alert(`Không thể tải hình ảnh: ${error.message}`);
    }
}

// Hiển thị modal cho mobile (iOS + Android)
function showMobileImageModal(blob, isIOS) {
    // Xóa modal cũ nếu còn tồn tại
    const existingModal = document.getElementById('image-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const reader = new FileReader();
    reader.onloadend = function() {
        const base64data = reader.result;

        const modal = document.createElement('div');
        modal.id = 'image-modal';
        modal.className = 'image-modal';

        // iOS: Hiển thị hướng dẫn, không có nút download
        // Android: Hiển thị nút download, không có hướng dẫn
        modal.innerHTML = `
            <div class="modal-content">
                <!-- Ảnh chính -->
                <div class="image-wrapper">
                    <img src="${base64data}" alt="Lucky Number" class="modal-image" id="modal-image">
                </div>
                
                ${isIOS ? `
                    <!-- Hướng dẫn cho iOS -->
                    <div class="instruction-box">
                        <div class="instruction-title">Cách lưu ảnh trên Iphone</div>
                        <div class="instruction-steps">
                            <div class="step">
                                <span class="step-number">1</span>
                                <span class="step-text">Nhấn <strong>giữ</strong> vào ảnh bên trên</span>
                            </div>
                            <div class="step">
                                <span class="step-number">2</span>
                                <span class="step-text">Chọn <strong>"Lưu vào Ảnh"</strong></span>
                            </div>
                        </div>
                    </div>
                ` : `
                    <!-- Nút tải xuống cho Android -->
                    <button class="download-btn" id="download-btn">Tải xuống ảnh</button>
                `}
                
                <!-- Nút đóng -->
                <button class="close-modal-btn" id="close-modal-btn">Đóng</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Animation vào
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Xử lý nút download cho Android
        if (!isIOS) {
            const downloadBtn = document.getElementById('download-btn');
            if (downloadBtn) {
                downloadBtn.onclick = function(e) {
                    e.stopPropagation();
                    downloadDirectly(blob, 'lucky_number.png');
                };
            }
        }

        // Xử lý nút đóng - Đơn giản hóa
        const closeBtn = document.getElementById('close-modal-btn');
        if (closeBtn) {
            closeBtn.onclick = function(e) {
                e.stopPropagation();
                closeImageModal(modal);
            };
        }

        // Đóng khi click vào background
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeImageModal(modal);
            }
        };

        // Ngăn đóng modal khi click vào modal-content
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.onclick = function(e) {
                e.stopPropagation();
            };
        }

        // Đóng khi nhấn ESC
        const handleEsc = function(e) {
            if (e.key === 'Escape') {
                closeImageModal(modal);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    };

    reader.readAsDataURL(blob);
}

// Đóng modal với animation
function closeImageModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        if (modal.parentNode) {
            // Xóa tất cả event listeners bằng cách remove modal hoàn toàn
            document.body.removeChild(modal);
        }
    }, 300);
}

// Download trực tiếp (cho desktop)
function downloadDirectly(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

// Hiển thị toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 2500);
}
