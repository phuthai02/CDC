// ===== STATE MANAGEMENT =====
let currentPage = 0;
let pageSize = 10;
let totalElements = 0;
let totalPages = 0;
let idMax = 0;
let allowCreate = false;
let currentData = [];
let searchKeyword = '';
let editingRowId = null;
let searchTimeout = null;
const socket = new SockJS('/ws');
const stompClient = Stomp.over(socket);

// ===== DEVICE ID MANAGEMENT =====
async function getDeviceId() {
    let deviceId = localStorage.getItem('actor');
    if (!deviceId) {
        showLoginModal();
        return null;
    }

    // Validate device ID với server
    try {
        const response = await fetch(`/find-by-device?deviceId=${encodeURIComponent(deviceId)}`);
        const data = await response.json();

        if (data.code !== 200) {
            clearDeviceId();
            showLoginModal();
            return null;
        }

        return deviceId;
    } catch (error) {
        console.error('Error validating device:', error);
        clearDeviceId();
        showLoginModal();
        return null;
    }
}

function setDeviceId(deviceId) {
    localStorage.setItem('actor', deviceId);
}

function clearDeviceId() {
    localStorage.removeItem('actor');
}

// ===== UNAUTHORIZED HANDLER =====
function handleUnauthorized() {
    clearDeviceId();
    showToast('Phiên đăng nhập hết hạn', 'error');
    showLoginModal();
}

// ===== UTILITY FUNCTIONS =====
function formatLuckyNumber(id) {
    return String(id).padStart(3, '0');
}

function formatTime(ts) {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2,'0')}:${
        String(d.getMinutes()).padStart(2,'0')}:${
        String(d.getSeconds()).padStart(2,'0')} - ${
        String(d.getDate()).padStart(2,'0')}/${
        String(d.getMonth()+1).padStart(2,'0')}/${
        d.getFullYear()}`;
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== MODAL =====
function showModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    modal.classList.add('show');

    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);

    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newConfirmBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        onConfirm();
    });

    newCancelBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// ===== LOGIN =====
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('show');
    document.getElementById('login-name').value = '';
    document.getElementById('login-dob').value = '';
    document.getElementById('login-name-error').textContent = '';
    document.getElementById('login-dob-error').textContent = '';
}

function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('show');
}

function login() {
    const nameInput = document.getElementById('login-name');
    const dobInput = document.getElementById('login-dob');
    const nameError = document.getElementById('login-name-error');
    const dobError = document.getElementById('login-dob-error');

    // Reset errors
    nameError.textContent = '';
    dobError.textContent = '';
    nameInput.classList.remove('error');
    dobInput.classList.remove('error');

    // Validate
    const nameValidation = validateFullname(nameInput.value);
    const dobValidation = validateBirthdate(dobInput.value);

    let hasError = false;

    if (!nameValidation.valid) {
        nameInput.classList.add('error');
        nameError.textContent = nameValidation.message;
        hasError = true;
    }

    if (!dobValidation.valid) {
        dobInput.classList.add('error');
        dobError.textContent = dobValidation.message;
        hasError = true;
    } else {
        // Format lại ngày sinh trong input
        dobInput.value = dobValidation.formatted;
    }

    if (hasError) return;

    // Call API
    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: nameInput.value.trim(),
            dateOfBirth: dobValidation.formatted
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                setDeviceId(data.data);
                hideLoginModal();
                showToast('Đăng nhập thành công', 'success');
                loadData();
            } else if (data.code === 404) {
                showToast('Thông tin đăng nhập không chính xác', 'error');
            } else {
                showToast('Đăng nhập thất bại', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Lỗi kết nối đến server', 'error');
        });
}

// ===== STATS UPDATE =====
function updateStats() {
    document.getElementById('total-count').textContent = totalElements;
    document.getElementById('max-number').textContent = formatLuckyNumber(idMax);
}

// ===== EDIT FUNCTIONS =====
function enableEdit(id) {
    if (editingRowId !== null) {
        showToast('Vui lòng hoàn thành chỉnh sửa hiện tại trước', 'error');
        return;
    }

    editingRowId = id;
    const employee = currentData.find(e => e.id === id);
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const localIndex = currentData.indexOf(employee);
    const globalIndex = currentPage * pageSize + localIndex + 1;

    row.classList.add('editing');
    row.innerHTML = `
        <td style="width: 60px;">${globalIndex}</td>
        <td style="width: 120px;"><span class="lucky-number">${formatLuckyNumber(employee.id)}</span></td>
        <td style="width: 200px;">
            <input type="text" class="edit-input" id="edit-name-${id}" value="${employee.name || ''}" placeholder="Nhập họ và tên">
            <span class="error-message" id="error-name-${id}"></span>
        </td>
        <td style="width: 150px;">
            <input type="text" class="edit-input" id="edit-dob-${id}" value="${employee.dateOfBirth || ''}" placeholder="dd/mm/yyyy">
            <span class="error-message" id="error-dob-${id}"></span>
        </td>
        <td style="width: 200px;">${employee.createdTime ? formatTime(employee.createdTime) : 'N/A'}</td>
        <td style="width: 180px;">
            <div class="action-btns">
                <button class="btn btn-save" onclick="saveEdit(${id})">Lưu thay đổi</button>
                <button class="btn btn-cancel" onclick="cancelEdit()">Hủy</button>
            </div>
        </td>
    `;

    const nameInput = document.getElementById(`edit-name-${id}`);
    const dobInput = document.getElementById(`edit-dob-${id}`);

    nameInput.addEventListener('blur', () => validateNameInput(id));
    dobInput.addEventListener('blur', () => validateDobInput(id));
}

function validateNameInput(id) {
    const nameInput = document.getElementById(`edit-name-${id}`);
    const errorSpan = document.getElementById(`error-name-${id}`);
    const validation = validateFullname(nameInput.value);

    if (!validation.valid) {
        nameInput.classList.add('error');
        errorSpan.textContent = validation.message;
        return false;
    } else {
        nameInput.classList.remove('error');
        errorSpan.textContent = '';
        return true;
    }
}

function validateDobInput(id) {
    const dobInput = document.getElementById(`edit-dob-${id}`);
    const errorSpan = document.getElementById(`error-dob-${id}`);
    const validation = validateBirthdate(dobInput.value);

    if (!validation.valid) {
        dobInput.classList.add('error');
        errorSpan.textContent = validation.message;
        return false;
    } else {
        dobInput.classList.remove('error');
        errorSpan.textContent = '';
        dobInput.value = validation.formatted;
        return true;
    }
}

function cancelEdit() {
    editingRowId = null;
    renderTable(currentData);
}

async function saveEdit(id) {
    const nameInput = document.getElementById(`edit-name-${id}`);
    const dobInput = document.getElementById(`edit-dob-${id}`);

    const isNameValid = validateNameInput(id);
    const isDobValid = validateDobInput(id);

    if (!isNameValid || !isDobValid) {
        showToast('Vui lòng kiểm tra lại thông tin', 'error');
        return;
    }

    const name = nameInput.value.trim();
    const dateOfBirth = dobInput.value.trim();

    showModal(
        'Xác nhận chỉnh sửa',
        `Bạn có chắc chắn muốn chỉnh sửa thông tin cho "${name}"?`,
        async () => {
            const deviceId = await getDeviceId();
            if (!deviceId) return;

            const employee = currentData.find(e => e.id === id);
            const updatedMember = {
                ...employee,
                name: name,
                dateOfBirth: dateOfBirth
            };

            fetch(`/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'actor': deviceId
                },
                body: JSON.stringify(updatedMember)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.code === 200) {
                        showToast('Chỉnh sửa thành công', 'success');
                        editingRowId = null;
                    } else if (data.code === 404) {
                        showToast('Không tìm thấy người này', 'error');
                    } else if (data.code === 409) {
                        showToast('Người này đã tồn tại', 'error');
                    } else if (data.code === 401) {
                        handleUnauthorized();
                    } else if (data.code === 500) {
                        showToast('Lỗi hệ thống', 'error');
                    } else {
                        showToast(data.message || 'Lỗi không xác định', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('Lỗi kết nối đến server', 'error');
                });
        }
    );
}

// ===== DELETE FUNCTION =====
function deleteEmployee(id) {
    const employee = currentData.find(e => e.id === id);

    showModal(
        'Xác nhận xóa bỏ',
        `Bạn có chắc chắn muốn xóa "${employee.name}" (Số may mắn: ${formatLuckyNumber(id)})?`,
        async () => {
            const deviceId = await getDeviceId();
            if (!deviceId) return;

            fetch(`/${id}`, {
                method: 'DELETE',
                headers: {
                    'actor': deviceId
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.code === 200) {
                        showToast('Xóa bỏ thành công', 'success');

                        if (currentData.length === 1 && currentPage > 0) {
                            currentPage--;
                        }
                    } else if (data.code === 404) {
                        showToast('Không tìm thấy người này', 'error');
                    } else if (data.code === 401) {
                        handleUnauthorized();
                    } else if (data.code === 500) {
                        showToast('Lỗi hệ thống', 'error');
                    } else {
                        showToast(data.message || 'Lỗi không xác định', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('Lỗi kết nối đến server', 'error');
                });
        }
    );
}

// ===== TABLE RENDERING =====
function renderTable(employees) {
    const tableBody = document.getElementById('table-body');

    if (employees.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 50px; color: #666;"><strong>KHÔNG CÓ DỮ LIỆU</strong></td></tr>';
        return;
    }

    tableBody.innerHTML = employees.map((emp, i) => {
        const globalIndex = currentPage * pageSize + i + 1;
        return `
            <tr data-id="${emp.id}">
                <td style="width: 60px;">${globalIndex}</td>
                <td style="width: 120px;"><span class="lucky-number">${formatLuckyNumber(emp.id)}</span></td>
                <td style="width: 200px;">${emp.name || 'N/A'}</td>
                <td style="width: 150px;">${emp.dateOfBirth || 'N/A'}</td>
                <td style="width: 200px;">${emp.createdTime ? formatTime(emp.createdTime) : 'N/A'}</td>
                <td style="width: 180px;">
                    <div class="action-btns">
                        <button class="btn btn-edit" onclick="enableEdit(${emp.id})">Chỉnh sửa</button>
                        <button class="btn btn-delete" onclick="deleteEmployee(${emp.id})">Xóa bỏ</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== PAGINATION =====
function renderPagination() {
    const buttonsContainer = document.getElementById('pagination-buttons');
    const infoContainer = document.getElementById('pagination-info');

    const start = totalElements === 0 ? 0 : currentPage * pageSize + 1;
    const end = Math.min((currentPage + 1) * pageSize, totalElements);
    infoContainer.textContent = `Hiển thị ${start} - ${end} của ${totalElements} kết quả`;

    let buttons = [];

    buttons.push(`
        <button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}>
            ‹
        </button>
    `);

    const maxButtons = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(0, endPage - maxButtons + 1);
    }

    if (startPage > 0) {
        buttons.push(`<button class="page-btn" onclick="changePage(0)">1</button>`);
        if (startPage > 1) {
            buttons.push(`<button class="page-btn ellipsis">...</button>`);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        buttons.push(`
            <button class="page-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="changePage(${i})" 
                    ${i === currentPage ? 'disabled' : ''}>
                ${i + 1}
            </button>
        `);
    }

    if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) {
            buttons.push(`<button class="page-btn ellipsis">...</button>`);
        }
        buttons.push(`<button class="page-btn" onclick="changePage(${totalPages - 1})">${totalPages}</button>`);
    }

    buttons.push(`
        <button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>
            ›
        </button>
    `);

    buttonsContainer.innerHTML = buttons.join('');
}

function changePage(newPage) {
    editingRowId = null;
    if (newPage < 0 || newPage >= totalPages) return;
    currentPage = newPage;
    loadData();
}

function changePageSize(newSize) {
    editingRowId = null;
    pageSize = newSize;
    currentPage = 0;
    loadData();
}

// ===== DATA LOADING =====
async function loadData() {
    const deviceId = await getDeviceId();
    if (!deviceId) return;

    const tableBody = document.getElementById('table-body');

    fetch(`/get-data?keyWord=${encodeURIComponent(searchKeyword)}&page=${currentPage}&pageSize=${pageSize}`, {
        headers: {
            'actor': deviceId
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                currentData = data.data.items || [];
                totalElements = data.data.totalElements || 0;
                totalPages = data.data.totalPages || 0;
                idMax = data.data.idMax || 0;
                allowCreate = data.data.allowCreate || false;
                renderTable(currentData);
                renderPagination();
                updateStats();
                updateAllowCreateButton();
            } else if (data.code === 401) {
                handleUnauthorized();
            } else {
                tableBody.innerHTML = '<tr><td colspan="6" class="error" style="text-align: center; padding: 50px; color: #f44336;"><strong>KHÔNG THỂ TẢI DỮ LIỆU</strong></td></tr>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            tableBody.innerHTML = '<tr><td colspan="6" class="error" style="text-align: center; padding: 50px; color: #f44336;"><strong>LỖI KẾT NỐI MÁY CHỦ</strong></td></tr>';
        });
}

// ===== SEARCH =====
document.getElementById('search-input').addEventListener('input', function(e) {
    editingRowId = null;

    const newKeyword = e.target.value.trim();

    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(() => {
        searchKeyword = newKeyword;
        currentPage = 0;
        loadData();
    }, 500);
});

// ===== PAGE SIZE SELECTOR =====
document.getElementById('page-size-select').addEventListener('change', function(e) {
    changePageSize(parseInt(e.target.value));
});

// ===== ALLOW CREATE =====
function updateAllowCreateButton() {
    const btn = document.getElementById('allow-cre-btn');
    if (allowCreate) {
        btn.textContent = 'Cho phép đăng ký';
        btn.classList.remove('disabled');
        btn.classList.add('enabled');
    } else {
        btn.textContent = 'Từ chối đăng ký';
        btn.classList.remove('enabled');
        btn.classList.add('disabled');
    }
}

function toggleAllowCreate() {
    const currentStatus = allowCreate ? 'cho phép' : 'từ chối';
    const newStatus = allowCreate ? 'từ chối' : 'cho phép';

    showModal(
        'Xác nhận thay đổi',
        `Hiện tại đang ${currentStatus} đăng ký. Bạn có chắc chắn muốn chuyển sang ${newStatus} đăng ký?`,
        async () => {
            const deviceId = await getDeviceId();
            if (!deviceId) return;

            fetch('/toggle-allow-create', {
                method: 'POST',
                headers: {
                    'actor': deviceId
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.code === 200) {
                        showToast(
                            !allowCreate ? 'Đã cho phép đăng ký' : 'Đã từ chối đăng ký',
                            'success'
                        );
                    } else if (data.code === 401) {
                        handleUnauthorized();
                    } else if (data.code === 500) {
                        showToast('Lỗi hệ thống', 'error');
                    } else {
                        showToast(data.message || 'Lỗi không xác định', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('Lỗi kết nối đến server', 'error');
                });
        }
    );
}

document.getElementById('allow-cre-btn').addEventListener('click', toggleAllowCreate);

// ===== EXPORT EXCEL =====
document.getElementById('excel-btn').addEventListener('click', async function () {
    const deviceId = await getDeviceId();
    if (!deviceId) return;

    showToast('Đang tạo file Excel...', 'info');

    fetch('/export-excel', {
        headers: {
            'actor': deviceId
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                const base64String = data.data;
                const byteCharacters = atob(base64String);
                const byteNumbers = new Array(byteCharacters.length);

                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }

                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });

                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Danh_Sach_Tham_Du_${new Date().getTime()}.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                showToast('Tạo file Excel thành công', 'success');
            } else if (data.code === 401) {
                handleUnauthorized();
            } else {
                showToast('Không thể tạo file Excel', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Lỗi khi tạo file Excel', 'error');
        });
});

// ===== LOGIN EVENT LISTENERS =====
document.getElementById('login-btn').addEventListener('click', login);

document.getElementById('login-name').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') login();
});

document.getElementById('login-name').addEventListener('blur', function() {
    const nameInput = document.getElementById('login-name');
    const nameError = document.getElementById('login-name-error');

    if (!nameInput.value.trim()) return;

    const validation = validateFullname(nameInput.value);
    if (!validation.valid) {
        nameInput.classList.add('error');
        nameError.textContent = validation.message;
    } else {
        nameInput.classList.remove('error');
        nameError.textContent = '';
    }
});

document.getElementById('login-dob').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') login();
});

document.getElementById('login-dob').addEventListener('blur', function() {
    const dobInput = document.getElementById('login-dob');
    const dobError = document.getElementById('login-dob-error');

    if (!dobInput.value.trim()) return;

    const validation = validateBirthdate(dobInput.value);
    if (!validation.valid) {
        dobInput.classList.add('error');
        dobError.textContent = validation.message;
    } else {
        dobInput.classList.remove('error');
        dobError.textContent = '';
        dobInput.value = validation.formatted;
    }
});

// ===== WEBSOCKET SUBSCRIPTION =====
stompClient.connect({}, function () {
    stompClient.subscribe('/topic/event', async function (message) {
        loadData();
    });
});

// ===== INITIALIZATION =====
(async function init() {
    const deviceId = await getDeviceId();
    if (!deviceId) return;
    loadData();
})();