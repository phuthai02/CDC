let allEmployees = [];
let filteredEmployees = [];

// Format số thành 3 chữ số
function formatLuckyNumber(id) {
    return String(id).padStart(3, '0');
}

// Format ngày tháng
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Kiểm tra ngày hôm nay
function isToday(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

// Cập nhật thống kê
function updateStats() {
    const totalCount = allEmployees.length;
    const maxNumber = totalCount > 0 ? Math.max(...allEmployees.map(e => e.id)) : 0;

    document.getElementById('total-count').textContent = totalCount;
    document.getElementById('max-number').textContent = formatLuckyNumber(maxNumber);
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

// Render bảng
function renderTable(employees) {
    const tableBody = document.getElementById('table-body');

    if (!employees.length) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty">Không có dữ liệu</td></tr>';
        return;
    }

    tableBody.innerHTML = employees.map((emp, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><span class="lucky-number">${formatLuckyNumber(emp.id)}</span></td>
            <td>${emp.name || 'N/A'}</td>
            <td>${emp.dateOfBirth || 'N/A'}</td>
            <td>${emp.createdTime ? formatTime(emp.createdTime) : 'N/A'}</td>
        </tr>
    `).join('');
}

// Load dữ liệu từ API
function loadEmployees() {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '<tr><td colspan="6" class="loading">Đang tải dữ liệu</td></tr>';

    fetch('/find-all')
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                allEmployees = data.data || [];
                // Sắp xếp theo ID giảm dần (mới nhất trước)
                allEmployees.sort((a, b) => b.id - a.id);
                filteredEmployees = [...allEmployees];
                renderTable(filteredEmployees);
                updateStats();
            } else {
                tableBody.innerHTML = '<tr><td colspan="6" class="error">Không thể tải dữ liệu</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            tableBody.innerHTML = '<tr><td colspan="6" class="error">Lỗi kết nối đến server</td></tr>';
        });
}

// Tìm kiếm
document.getElementById('search-input').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (searchTerm === '') {
        filteredEmployees = [...allEmployees];
    } else {
        filteredEmployees = allEmployees.filter(emp => {
            const name = (emp.name || '').toLowerCase();
            const phone = (emp.phoneNumber || '').toLowerCase();
            const luckyNumber = formatLuckyNumber(emp.id);
            return name.includes(searchTerm) ||
                phone.includes(searchTerm) ||
                luckyNumber.includes(searchTerm);
        });
    }

    renderTable(filteredEmployees);
});

// Nút refresh
document.getElementById('refresh-btn').addEventListener('click', function() {
    document.getElementById('search-input').value = '';
    loadEmployees();
});

// Load dữ liệu khi trang load
loadEmployees();

// Auto refresh mỗi 30 giây
setInterval(loadEmployees, 10000);

document.getElementById('export-excel-btn').addEventListener('click', function() {
    // Tạo link tải file
    const link = document.createElement('a');
    link.href = '/export-excel';
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});