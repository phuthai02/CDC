const welcomeScreen = document.getElementById('welcome-screen');
const formScreen = document.getElementById('form-screen');
const resultScreen = document.getElementById('result-screen');

const startBtn = document.getElementById('start-btn');
const registrationForm = document.getElementById('registration-form');
const fullnameInput = document.getElementById('fullname');
const birthdateInput = document.getElementById('birthdate');
const petalsContainer = document.getElementById('petals-container');
const submitBtn = document.getElementById('submit-btn');

// ==================== LOADING SCREEN ====================
window.addEventListener('load', function() {
    const loadingScreen = document.getElementById('loading-screen');
    setTimeout(() => {
        loadingScreen.classList.add('hide');
    }, 100);
});

// Hàm tải xuống hình ảnh khi click/tap
function downloadOnClick() {
    const deviceId = localStorage.getItem("deviceId");
    if (deviceId) {
        // Lấy và disable nút hint-text
        const hintText = document.querySelector('.hint-text');
        if (hintText) {
            hintText.style.pointerEvents = 'none';
            hintText.style.opacity = '0.6';
            hintText.innerHTML = '<u>Đang tạo ảnh...</u>';
        }

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


// Chuyển từ welcome screen sang form screen
startBtn.addEventListener('click', function() {
    // Hiệu ứng chuyển đổi
    welcomeScreen.style.animation = 'fadeOut 0.5s ease-out forwards';
    welcomeScreen.style.display = 'none';
    formScreen.classList.add('show');
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

fullnameInput.addEventListener('blur', function() {
    const value = this.value.trim();
    if (value) {
        // Loại bỏ khoảng trắng liên tiếp + Viết hoa chữ cái đầu mỗi từ
        const capitalized = value.replace(/\s+/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        this.value = capitalized;
    }
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

        fetch("/?type=1", {
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
                    else if (data && data.code === 404) {
                        showNotFoundForm(member);
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

function showNotFoundForm(memberData) {
    // Ẩn form screen
    formScreen.style.animation = 'fadeOut 0.5s ease-out forwards';

    setTimeout(() => {
        formScreen.style.display = 'none';

        // Cập nhật nội dung form
        const formContainer = document.querySelector('.form-container');
        formContainer.innerHTML = `
            <div class="notification-box">
                <p>
                    Thông tin chưa chính xác
                </p>
            </div>

            <button type="button" id="retry-btn" class="form-action-btn retry-btn">Vui lòng nhập lại</button>
            <button type="button" id="guest-btn" class="form-action-btn guest-btn">Tôi là khách mời</button>
        `;

        // Hiển thị lại form screen
        formScreen.style.animation = '';
        formScreen.style.display = '';
        formScreen.classList.add('show');

    }, 500);

    // Sau khi DOM được render, gắn sự kiện
    setTimeout(() => {
        // Gắn sự kiện cho nút "Nhập lại thông tin"
        document.getElementById('retry-btn').addEventListener('click', function() {
            // Ẩn form hiện tại
            formScreen.style.animation = 'fadeOut 0.5s ease-out forwards';

            setTimeout(() => {
                formScreen.style.display = 'none';

                // Reset lại form về ban đầu
                const formContainer = document.querySelector('.form-container');
                formContainer.innerHTML = `
                    <h2>ĐĂNG KÝ THÔNG TIN</h2>

                    <form id="registration-form">
                        <div class="form-group">
                            <label for="fullname">Họ và tên <span>*</span></label>
                            <input type="text" id="fullname" name="fullname" placeholder="Nhập họ và tên đầy đủ" value="${memberData.name || ''}">
                            <div class="error-message" id="fullname-error">Vui lòng nhập họ và tên</div>
                        </div>

                        <div class="form-group">
                            <label for="birthdate">Ngày sinh <span>*</span></label>
                            <input type="text" id="birthdate" name="birthdate" placeholder="Nhập ngày tháng năm sinh" value="${memberData.dateOfBirth || ''}">
                            <div class="error-message" id="birthdate-error">Vui lòng nhập ngày sinh</div>
                        </div>

                        <button type="submit" id="submit-btn">Xác nhận</button>
                    </form>
                `;

                // Hiển thị lại form screen
                formScreen.style.animation = '';
                formScreen.style.display = '';
                formScreen.classList.add('show');

                // Re-attach các event listeners cho form mới
                setTimeout(() => {
                    attachFormEventListeners();
                }, 100);
            }, 500);
        });

        // Gắn sự kiện cho nút "Tôi là khách mời"
        document.getElementById('guest-btn').addEventListener('click', function() {
            // Disable nút để tránh click nhiều lần
            this.disabled = true;
            this.textContent = 'Đang xử lý...';

            // Gọi API với type=2
            fetch("/?type=2", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(memberData)
            })
                .then(response => response.json())
                .then(data => {
                    if (data && (data.code === 200 || data.code === 409)) {
                        showSuccessResult(data.data.id, data.data.deviceId);
                    }
                    else if (data && data.code === 403) {
                        showErrorResult("HẾT GIỜ ĐĂNG KÝ");
                    }
                    else {
                        showErrorResult("LỖI HỆ THỐNG");
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    this.disabled = false;
                    this.textContent = 'Tôi là khách mời';
                });
        });
    }, 500);
}

// Tách riêng function để attach event listeners
function attachFormEventListeners() {
    const newFullnameInput = document.getElementById('fullname');
    const newBirthdateInput = document.getElementById('birthdate');
    const newRegistrationForm = document.getElementById('registration-form');
    const newSubmitBtn = document.getElementById('submit-btn');

    newFullnameInput.addEventListener('input', function() {
        this.classList.remove('error');
        document.getElementById('fullname-error').classList.remove('show');
    });

    newBirthdateInput.addEventListener('input', function() {
        this.classList.remove('error');
        document.getElementById('birthdate-error').classList.remove('show');
    });

    newFullnameInput.addEventListener('blur', function() {
        const value = this.value.trim();
        if (value) {
            const capitalized = value.replace(/\s+/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            this.value = capitalized;
        }
    });

    newBirthdateInput.addEventListener('blur', function() {
        const value = this.value.trim();
        if (value) {
            const result = formatBirthdateInput(value);
            if (result.formatted) {
                this.value = result.formatted;
            }
        }
    });

    newRegistrationForm.addEventListener('submit', function(e) {
        e.preventDefault();

        let isValid = true;

        const fullname = newFullnameInput.value.trim();
        const fullnameValidation = validateFullname(fullname);

        if (!fullnameValidation.valid) {
            newFullnameInput.classList.add('error');
            document.getElementById('fullname-error').textContent = fullnameValidation.message;
            document.getElementById('fullname-error').classList.add('show');
            isValid = false;
        }

        const birthdate = newBirthdateInput.value.trim();
        const birthdateValidation = validateBirthdate(birthdate);

        if (!birthdateValidation.valid) {
            newBirthdateInput.classList.add('error');
            document.getElementById('birthdate-error').textContent = birthdateValidation.message;
            document.getElementById('birthdate-error').classList.add('show');
            isValid = false;
        } else {
            newBirthdateInput.value = birthdateValidation.formatted;
        }

        if (isValid) {
            newSubmitBtn.disabled = true;
            newSubmitBtn.textContent = 'Đang xử lý...';

            const member = {
                name: fullnameValidation.cleaned,
                dateOfBirth: birthdateValidation.formatted
            };

            fetch("/?type=1", {
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
                        else if (data && data.code === 404) {
                            showNotFoundForm(member);
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
                    newSubmitBtn.disabled = false;
                    newSubmitBtn.textContent = 'Xác nhận';
                });
        }
    });
}

function showErrorResult(msg) {
    const resultContent = document.getElementById('result-content');

    resultContent.innerHTML = `
        <h2>${msg}</h2>
    `;

    formScreen.style.animation = 'fadeOut 0.5s ease-out forwards';
    formScreen.style.display = 'none';
    resultScreen.classList.add('show');
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

    formScreen.style.display = 'none';
    resultScreen.classList.add('show');
    const hintText = document.querySelector('.hint-text');
    if (hintText) {
        let isDownloading = false; // Ngăn download nhiều lần

        // Hàm xử lý download
        const handleDownloadTrigger = function (e) {
            e.preventDefault();
            e.stopPropagation();

            // Ngăn download nếu đang xử lý
            if (isDownloading) {
                return;
            }

            isDownloading = true;
            downloadOnClick();
            isDownloading = false;
        };

        // CHỈ GẮN 1 EVENT DUY NHẤT cho PC (click)
        // Touch events chỉ cho mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
            // KHÔNG DÙNG once:true để có thể click nhiều lần
            hintText.addEventListener('touchstart', handleDownloadTrigger, {passive: false});
        } else {
            // KHÔNG DÙNG once:true để có thể click nhiều lần
            hintText.addEventListener('click', handleDownloadTrigger);
        }
    }
}

// Thay thế hàm downloadImage cũ
async function downloadImage(deviceId) {
    const hintText = document.querySelector('.hint-text');

    try {
        const url =`/download-image?deviceId=${encodeURIComponent(deviceId)}`;
        const response = await fetch(url);

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
            showMobileImageModal(url, blob, isIOS);
        } else {
            // Desktop: Download trực tiếp
            downloadDirectly(url);
        }

        // Reset lại text và enable nút sau khi xử lý xong
        if (hintText) {
            hintText.innerHTML = '<u>Nhấn để tải hình ảnh</u>';
            hintText.style.pointerEvents = 'auto';
            hintText.style.opacity = '1';
        }

    } catch (error) {
        console.error('[Download Image] Error:', error);
        alert(`Không thể tải hình ảnh: ${error.message}`);

        // Reset lại text và enable nút khi có lỗi
        if (hintText) {
            hintText.innerHTML = '<u>Nhấn để tải hình ảnh</u>';
            hintText.style.pointerEvents = 'auto';
            hintText.style.opacity = '1';
        }
    }
}

// Hiển thị modal cho mobile (iOS + Android) - ĐÃ TỐI ƯU CHO ZALO BROWSER
function showMobileImageModal(url, blob, isIOS) {
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
                    <!-- Nút tải xuống cho Android - TỐI ƯU CHO ZALO BROWSER -->
                    <button class="download-btn" id="download-btn" type="button">Tải xuống</button>
                `}
                
                <!-- Nút đóng -->
                <button class="close-modal-btn" id="close-modal-btn" type="button">Đóng</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Đảm bảo DOM đã render xong trước khi gắn event - QUAN TRỌNG CHO ZALO BROWSER
        requestAnimationFrame(() => {
            // Animation vào
            modal.classList.add('show');

            // Xử lý nút download cho Android - FIX: Tránh download 2 lần
            if (!isIOS) {
                const downloadBtn = document.getElementById('download-btn');
                if (downloadBtn) {
                    let isProcessing = false;

                    const handleDownload = function (e) {
                        e.stopPropagation();

                        if (isProcessing) return;
                        isProcessing = true;

                        // Disable button
                        downloadBtn.disabled = true;
                        downloadBtn.textContent = 'Đang tải...';

                        try {
                            downloadDirectly(url);
                        } finally {
                            // Re-enable sau 2s
                            setTimeout(() => {
                                downloadBtn.disabled = false;
                                downloadBtn.textContent = 'Tải xuống';
                                isProcessing = false;
                            }, 2000);
                        }
                    };

                    // Detect mobile để chọn event phù hợp
                    const isTouchDevice = 'ontouchstart' in window;

                    if (isTouchDevice) {
                        // Mobile: Chỉ dùng touchend (không dùng click để tránh double fire)
                        // KHÔNG DÙNG once:true vì đã có flag isProcessing control rồi
                        downloadBtn.addEventListener('touchend', handleDownload, {passive: false});
                    } else {
                        // Desktop: Chỉ dùng click
                        // KHÔNG DÙNG once:true vì đã có flag isProcessing control rồi
                        downloadBtn.addEventListener('click', handleDownload);
                    }

                    // Thêm style để đảm bảo button có thể click được trên mọi browser
                    downloadBtn.style.pointerEvents = 'auto';
                    downloadBtn.style.cursor = 'pointer';
                    downloadBtn.style.userSelect = 'none';
                    downloadBtn.style.webkitUserSelect = 'none';
                    downloadBtn.style.webkitTouchCallout = 'none';
                    downloadBtn.style.touchAction = 'manipulation'; // Ngăn zoom khi double tap
                }
            }

            // Xử lý nút đóng
            const closeBtn = document.getElementById('close-modal-btn');
            if (closeBtn) {
                const handleClose = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    closeImageModal(modal);
                };

                // Detect mobile
                const isTouchDevice = 'ontouchstart' in window;

                if (isTouchDevice) {
                    // Giữ once:true cho nút đóng vì modal sẽ bị remove
                    closeBtn.addEventListener('touchend', handleClose, {passive: false});
                } else {
                    // Giữ once:true cho nút đóng vì modal sẽ bị remove
                    closeBtn.addEventListener('click', handleClose);
                }

                // Thêm style cho nút đóng
                closeBtn.style.pointerEvents = 'auto';
                closeBtn.style.cursor = 'pointer';
                closeBtn.style.userSelect = 'none';
                closeBtn.style.webkitUserSelect = 'none';
                closeBtn.style.webkitTouchCallout = 'none';
                closeBtn.style.touchAction = 'manipulation';
            }

            // Đóng khi click vào background
            modal.addEventListener('click', function (e) {
                if (e.target === modal) {
                    closeImageModal(modal);
                }
            }, false);

            // Ngăn đóng modal khi click vào modal-content
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.addEventListener('click', function (e) {
                    e.stopPropagation();
                }, false);
            }

            // Đóng khi nhấn ESC
            const handleEsc = function (e) {
                if (e.key === 'Escape') {
                    closeImageModal(modal);
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
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

// Download trực tiếp (cho desktop và Android)
function downloadDirectly(url) {
    window.location.href = url;
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