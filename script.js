const API_URL = 'https://api.escuelajs.co/api/v1/products';

// State quản lý dữ liệu và bộ lọc
let allProducts = [];
let currentPage = 1;
let pageSize = 10;
let searchTerm = '';
let sortType = ''; // 'price-asc', 'price-desc', 'name-asc', 'name-desc'

// Hàm lấy dữ liệu từ API
async function fetchProducts() {
    try {
        const response = await fetch(API_URL);

        // Kiểm tra nếu request thành công
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        allProducts = await response.json();
        processAndRender(); // Xử lý và hiển thị dữ liệu lần đầu
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        document.getElementById('tableBody').innerHTML = '<tr><td colspan="5" style="color:red; text-align:center">Không thể tải dữ liệu.</td></tr>';
    }
}

// Hàm xử lý dữ liệu (Lọc -> Sắp xếp -> Phân trang) và gọi render
function processAndRender() {
    // 1. Lọc theo tên (Search)
    let filtered = allProducts.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Sắp xếp (Sort)
    if (sortType) {
        filtered.sort((a, b) => {
            if (sortType === 'price-asc') return a.price - b.price;
            if (sortType === 'price-desc') return b.price - a.price;
            if (sortType === 'name-asc') return a.title.localeCompare(b.title);
            if (sortType === 'name-desc') return b.title.localeCompare(a.title);
            return 0;
        });
    }

    // 3. Phân trang (Pagination)
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Đảm bảo currentPage hợp lệ
    if (currentPage > totalPages) currentPage = totalPages || 1;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    renderTable(paginatedItems);
    renderPagination(totalPages);
}

// Hàm hiển thị bảng
function renderTable(products) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Không tìm thấy sản phẩm nào.</td></tr>';
        return;
    }

    products.forEach(product => {
        let imagesHtml = '';

        if (product.images && Array.isArray(product.images)) {
            // Duyệt qua từng item trong mảng images
            imagesHtml = product.images.map(img => {
                let finalUrl = img;

                // Kiểm tra nếu img là chuỗi và trông giống JSON (bắt đầu bằng [ )
                if (typeof img === 'string' && img.startsWith('[')) {
                    try {
                        const parsed = JSON.parse(img);
                        // Nếu sau khi parse ra một mảng, lấy phần tử đầu tiên
                        finalUrl = Array.isArray(parsed) ? parsed[0] : img;
                    } catch (e) {
                        // Nếu lỗi parse, giữ nguyên url gốc
                        finalUrl = img;
                    }
                }

                // Làm sạch các ký tự dư thừa như dấu ngoặc kép hoặc dấu xuyệt nếu có
                finalUrl = finalUrl.replace(/[\[\]"\\]/g, '');

                return `
                <img src="${finalUrl}" 
                     class="table-img" 
                     referrerpolicy="no-referrer" 
                     onerror="this.src='https://via.placeholder.com/100'">
            `;
            }).join('');
        }

        // Nếu sau tất cả vẫn không có ảnh nào, dùng ảnh mặc định
        if (!imagesHtml) {
            imagesHtml = `<img src="https://via.placeholder.com/100" class="table-img">`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
        <td><div class="image-gallery">${imagesHtml}</div></td>
        <td><strong>${product.title}</strong></td>
        <td>${product.category ? product.category.name : 'Uncategorized'}</td>
        <td style="color: #e63946; font-weight: bold;">$${product.price}</td>
        <td class="desc-cell">${product.description}</td>
    `;
        tbody.appendChild(row);
    });
}

// Hàm hiển thị nút phân trang
function renderPagination(totalPages) {
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        if (i === currentPage) btn.classList.add('active');

        btn.addEventListener('click', () => {
            currentPage = i;
            processAndRender();
        });

        paginationDiv.appendChild(btn);
    }
}

// --- Event Listeners ---

document.getElementById('searchInput').addEventListener('input', (e) => {
    searchTerm = e.target.value;
    currentPage = 1; // Reset về trang 1 khi tìm kiếm
    processAndRender();
});

document.getElementById('pageSizeSelect').addEventListener('change', (e) => {
    pageSize = parseInt(e.target.value);
    currentPage = 1; // Reset về trang 1 khi đổi số lượng hiển thị
    processAndRender();
});

document.getElementById('sortSelect').addEventListener('change', (e) => {
    sortType = e.target.value;
    processAndRender();
});

// Gọi hàm khi trang web tải xong
fetchProducts();