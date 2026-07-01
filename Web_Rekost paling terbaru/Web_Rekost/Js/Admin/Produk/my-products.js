document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    const listNode = document.getElementById('products-list');
    const emptyNode = document.getElementById('empty-state');
    const searchInput = document.getElementById('product-search');
    const statusFilter = document.getElementById('status-filter');

    if (!listNode || !emptyNode) return;

    const currentUser = getCurrentUser();
    const allProducts = getProducts();
    const favoriteIds = getFavoriteIds(allProducts);

    let visibleProducts = page === 'favorites'
        ? allProducts.filter((product) => favoriteIds.includes(product.id))
        : getMyProducts(allProducts, currentUser);

    if (page === 'my-products') {
        updateSummary(visibleProducts);
    }

    function render() {
        const query = (searchInput?.value || '').toLowerCase().trim();
        const status = statusFilter?.value || 'all';

        const filtered = visibleProducts.filter((product) => {
            const matchesQuery = [product.title, product.campus, product.description]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(query));
            const matchesStatus = status === 'all' || normalizeStatus(product.status) === status;
            return matchesQuery && matchesStatus;
        });

        listNode.innerHTML = filtered.map((product) => createCard(product, page)).join('');
        emptyNode.hidden = filtered.length > 0;
    }

    listNode.addEventListener('click', (event) => {
        const removeButton = event.target.closest('[data-remove-id]');
        if (!removeButton) return;

        const productId = removeButton.dataset.removeId;

        if (page === 'favorites') {
            const nextIds = favoriteIds.filter((id) => id !== productId);
            localStorage.setItem('re_kost_favorites', JSON.stringify(nextIds));
            visibleProducts = visibleProducts.filter((product) => product.id !== productId);
        } else {
            const nextProducts = allProducts.filter((product) => product.id !== productId);
            localStorage.setItem('re_kost_products', JSON.stringify(nextProducts));
            visibleProducts = visibleProducts.filter((product) => product.id !== productId);
            updateSummary(visibleProducts);
        }

        render();
    });

    searchInput?.addEventListener('input', render);
    statusFilter?.addEventListener('change', render);
    render();
});

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('current_user')) || {};
    } catch {
        return {};
    }
}

function getProducts() {
    let storedProducts = [];

    try {
        storedProducts = JSON.parse(localStorage.getItem('re_kost_products')) || [];
    } catch {
        storedProducts = [];
    }

    if (storedProducts.length > 0) return storedProducts;

    return [
        {
            id: 'sample-desk',
            title: 'Meja Belajar Lipat Minimalis',
            sellerName: 'Ahmad Jaelani',
            campus: 'Kukusan, Depok',
            price: 85000,
            status: 'active',
            facilities: ['FURNITUR', 'Verified Student'],
            description: 'Meja lipat kondisi baik, cocok untuk kamar kos.',
            image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop'
        },
        {
            id: 'sample-rice-cooker',
            title: 'Rice Cooker Mini Anak Kos',
            sellerName: 'Ahmad Jaelani',
            campus: 'Margonda, Depok',
            price: 120000,
            status: 'pending',
            facilities: ['ELEKTRONIK', 'Verified Student'],
            description: 'Rice cooker mini hemat listrik, masih normal.',
            image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop'
        },
        {
            id: 'sample-bookshelf',
            title: 'Rak Buku 3 Susun',
            sellerName: 'Mahasiswa RE-KOST',
            campus: 'Beji, Depok',
            price: 95000,
            status: 'active',
            facilities: ['FURNITUR'],
            description: 'Rak buku kecil untuk kamar kos.',
            image: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600&auto=format&fit=crop'
        }
    ];
}

function getMyProducts(products, currentUser) {
    if (!currentUser.name) {
        return products.filter((product) => product.sellerName === 'Ahmad Jaelani' || product.sellerName === 'Mahasiswa RE-KOST');
    }

    const userName = currentUser.name.toLowerCase();
    return products.filter((product) => (product.sellerName || '').toLowerCase() === userName);
}

function getFavoriteIds(products) {
    try {
        const raw = localStorage.getItem('re_kost_favorites');
        if (raw !== null) {
            return JSON.parse(raw) || [];
        }
    } catch {
        return [];
    }

    return products.slice(0, 2).map((product) => product.id);
}

function createCard(product, page) {
    const category = Array.isArray(product.facilities) && product.facilities.length > 0
        ? product.facilities[0]
        : 'BARANG KOS';
    const status = normalizeStatus(product.status);
    const statusText = getStatusText(status);
    const detailHref = `../product-detail.html?id=${encodeURIComponent(product.id)}`;
    const removeLabel = page === 'favorites' ? 'Hapus Favorit' : 'Hapus';

    return `
        <article class="product-card">
            <a href="${detailHref}" class="product-img-wrapper" aria-label="Lihat ${escapeHtml(product.title)}">
                <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" class="product-img">
                <span class="product-status">${statusText}</span>
                <span class="label-trusted">TRUSTED</span>
            </a>
            <div class="product-info">
                <span class="product-category">${escapeHtml(category)}</span>
                <h2 class="product-name">${escapeHtml(product.title)}</h2>
                <p class="product-price">${formatRupiah(product.price)}</p>
                <p class="product-location">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>${escapeHtml(product.campus || 'Area kampus')}</span>
                </p>
                <div class="product-actions">
                    <a href="${detailHref}">Detail</a>
                    <button type="button" class="danger" data-remove-id="${escapeHtml(product.id)}">${removeLabel}</button>
                </div>
            </div>
        </article>
    `;
}

function updateSummary(products) {
    const totalNode = document.getElementById('total-products');
    const pendingNode = document.getElementById('pending-products');
    const activeNode = document.getElementById('active-products');

    if (totalNode) totalNode.textContent = products.length;
    if (pendingNode) pendingNode.textContent = products.filter((product) => normalizeStatus(product.status) === 'pending').length;
    if (activeNode) activeNode.textContent = products.filter((product) => normalizeStatus(product.status) === 'active').length;
}

function normalizeStatus(status) {
    const normalized = String(status || 'active').toLowerCase();
    if (['pending', 'sold', 'ditolak'].includes(normalized)) return normalized;
    return 'active';
}

function getStatusText(status) {
    return {
        active: 'Aktif',
        pending: 'Review',
        sold: 'Terjual',
        ditolak: 'Ditolak'
    }[status] || 'Aktif';
}

function formatRupiah(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
