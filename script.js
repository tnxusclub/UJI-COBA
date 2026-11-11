// ====================================
// KONFIGURASI GOOGLE SHEETS
// ====================================
// 🔽 GANTI ID SHEET DENGAN MILIKMU 🔽
const SHEET_ID = "1v1mCoA4FBRUw6_qP2PzTwXoZmfWqGWx_ZNo5GxXpe7c";
const API_KEY = "TNXUS";

// Nama Sheet di Google Sheets
const SHEETS = {
  products: "Produk",
  slides: "Slide",
  orders: "Pesanan",
  vouchers: "Voucher"
};

// Cache data lokal
let products = [];
let slides = [];
let cart = [];
let orders = JSON.parse(localStorage.getItem("orders") || "[]");
let currentSlide = 0;
let discountPercent = 0;

// ====================================
// FUNGSI BANTUAN — FORMAT UANG
// ====================================
function formatRupiah(angka) {
  return "Rp " + parseInt(angka).toLocaleString("id-ID");
}

// ====================================
// NAVIGASI ANTAR HALAMAN
// ====================================
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const page = link.dataset.page;
    switchPage(page);
  });
});

function switchPage(pageName) {
  // Sembunyikan semua halaman
  document.querySelectorAll(".page-section").forEach(p => p.classList.remove("active"));
  // Tampilkan halaman yang dipilih
  document.getElementById(pageName).classList.add("active");
  // Update menu aktif
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
  document.querySelector(`[data-page="${pageName}"]`).classList.add("active");
  window.scrollTo(0, 0);
  
  if (pageName === "riwayat") renderRiwayat();
}

// ====================================
// SLIDER FOTO BERANDA
// ====================================
async function loadSlides() {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEETS.slides}?key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    slides = data.values ? data.values.slice(1).map(row => ({ url: row[0] })) : [];
  } catch (e) {
    // Data contoh jika belum ada sheet
    slides = [
      { url: "https://picsum.photos/id/21/400/400" },
      { url: "https://picsum.photos/id/22/400/400" },
      { url: "https://picsum.photos/id/23/400/400" },
      { url: "https://picsum.photos/id/24/400/400" }
    ];
  }
  renderSlider();
}

function renderSlider() {
  const wrapper = document.getElementById("sliderWrapper");
  const dotsContainer = document.getElementById("sliderDots");
  
  wrapper.innerHTML = slides.map(s => `
    <div class="slide-item">
      <img src="${s.url}" alt="Slide">
    </div>
  `).join("");
  
  dotsContainer.innerHTML = slides.map((_, i) => `
    <div class="dot ${i === 0 ? "active" : ""}" data-index="${i}"></div>
  `).join("");
  
  dotsContainer.querySelectorAll(".dot").forEach(dot => {
    dot.addEventListener("click", () => {
      goToSlide(parseInt(dot.dataset.index));
    });
  });
  
  // Auto slide setiap 5 detik
  setInterval(() => {
    currentSlide = (currentSlide + 1) % slides.length;
    goToSlide(currentSlide);
  }, 5000);
}

function goToSlide(index) {
  currentSlide = index;
  const wrapper = document.getElementById("sliderWrapper");
  wrapper.style.transform = `translateX(-${index * 100}%)`;
  document.querySelectorAll(".dot").forEach((d, i) => 
    d.classList.toggle("active", i === index)
  );
}

// ====================================
// MUAT PRODUK DARI GOOGLE SHEETS
// ====================================
async function loadProducts() {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEETS.products}?key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.values) {
      products = data.values.slice(1).map((row, i) => ({
        id: row[0] || `prod-${i}`,
        name: row[1],
        category: row[2] || "baju",
        image: row[3],
        description: row[4] || "",
        price: parseInt(row[5]) || 0,
        stock: parseInt(row[6]) || 0,
        sizes: row[7] ? row[7].split(",").map(s => s.trim()) : []
      }));
    }
  } catch (e) {
    // Data contoh
    products = [
      { id: "p1", name: "Kaos Keren Basic", category: "baju", image: "https://picsum.photos/id/96/400/400", description: "Bahan katun 30s, adem dipakai", price: 95000, stock: 50, sizes: ["S","M","L","XL"] },
      { id: "p2", name: "Kaos Street Style", category: "baju", image: "https://picsum.photos/id/1011/400/400", description: "Desain modern, nyaman seharian", price: 115000, stock: 30, sizes: ["M","L","XL","XXL"] },
      { id: "a1", name: "Topi Baseball", category: "aksesori", image: "https://picsum.photos/id/26/400/400", description: "Bahan berkualitas", price: 45000, stock: 100, sizes: [] },
      { id: "a2", name: "Tas Kanvas", category: "aksesori", image: "https://picsum.photos/id/193/400/400", description: "Kuat dan awet", price: 65000, stock: 45, sizes: [] }
    ];
  }
  
  renderProducts();
}

function renderProducts() {
  const bajuContainer = document.getElementById("bajuContainer");
  const aksesoriContainer = document.getElementById("aksesoriContainer");
  
  const baju = products.filter(p => p.category === "baju");
  const aksesori = products.filter(p => p.category === "aksesori");
  
  bajuContainer.innerHTML = baju.map(p => renderProductCard(p)).join("");
  aksesoriContainer.innerHTML = aksesori.map(p => renderProductCard(p)).join("");
  
  // Tambahkan event listener ke tombol ukuran & keranjang
  attachProductEvents();
}

function renderProductCard(product) {
  const sizeBtns = product.sizes.length > 0 
    ? `<div class="size-options">
        ${product.sizes.map(s => `<button class="size-btn" data-size="${s}">${s}</button>`).join("")}
       </div>`
    : "";

  return `
    <div class="product-card" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}" class="product-img">
        <div class="product-info">
            <div class="product-name">${product.name}</div>
            <div class="product-desc">${product.description}</div>
            <div class="product-price">${formatRupiah(product.price)}</div>
            ${sizeBtns}
            <button class="add-cart-btn" data-id="${product.id}">
                <i class="fas fa-shopping-cart"></i> Tambah
            </button>
        </div>
    </div>
  `;
}

function attachProductEvents() {
  // Pilih ukuran
  document.querySelectorAll(".size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.parentElement.querySelectorAll(".size-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });

  // Tambah ke keranjang
  document.querySelectorAll(".add-cart-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const prodId = btn.dataset.id;
      const card = btn.closest(".product-card");
      const product = products.find(p => p.id === prodId);
      
      let selectedSize = "";
      const selectedBtn = card.querySelector(".size-btn.selected");
      if (selectedBtn) selectedSize = selectedBtn.dataset.size;

      addToCart(product, selectedSize);
    });
  });
}

// ====================================
// KERANJANG BELANJA
// ====================================
const cartBtn = document.getElementById("cartBtn");
const cartOverlay = document.getElementById("cartOverlay");
const cartSidebar = document.getElementById("cartSidebar");
const closeCart = document.getElementById("closeCart");

cartBtn.addEventListener("click", openCart);
cartOverlay.addEventListener("click", closeCartSidebar);
closeCart.addEventListener("click", closeCartSidebar);

function openCart() {
  cartOverlay.classList.add("show");
  cartSidebar.classList.add("show");
  renderCart();
}

function closeCartSidebar() {
  cartOverlay.classList.remove("show");
  cartSidebar.classList.remove("show");
}

function addToCart(product, size = "") {
  const existingIndex = cart.findIndex(item => item.id === product.id && item.size === size);
  
  if (existingIndex > -1) {
    cart[existingIndex].quantity += 1;
  } else {
    cart.push({
      ...product,
      size: size,
      quantity: 1
    });
  }
  
  updateCartCount();
  openCart();
}

function updateCartCount() {
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cartCount").textContent = total;
}

function renderCart() {
  const cartItemsEl = document.getElementById("cartItems");
  
  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="empty-cart">Keranjang masih kosong</p>';
    updatePriceSummary();
    return;
  }

  cartItemsEl.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
        <img src="${item.image}" class="cart-item-img" alt="${item.name}">
        <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-detail">Ukuran: ${item.size || "-"} × ${item.quantity}</div>
            <div class="cart-item-price">${formatRupiah(item.price * item.quantity)}</div>
        </div>
        <button class="remove-item" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
    </div>
  `).join("");

  // Hapus item dari keranjang
  document.querySelectorAll(".remove-item").forEach(btn => {
    btn.addEventListener("click", () => {
      cart.splice(parseInt(btn.dataset.index), 1);
      updateCartCount();
      renderCart();
    });
  });

  updatePriceSummary();
}

function updatePriceSummary() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = Math.floor(subtotal * discountPercent / 100);
  const grandTotal = subtotal - discountAmount;

  document.getElementById("subtotal").textContent = formatRupiah(subtotal);
  document.getElementById("discountAmount").textContent = formatRupiah(discountAmount);
  document.getElementById("grandTotal").textContent = formatRupiah(grandTotal);
}

// Voucher
document.getElementById("applyVoucher").addEventListener("click", async () => {
  const code = document.getElementById("voucherCode").value.trim().toUpperCase();
  discountPercent = 0;
  
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEETS.vouchers}?key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const vouchers = data.values ? data.values.slice(1) : [];
    
    const found = vouchers.find(v => v[0] === code && parseInt(v[2]) > 0);
    if (found) {
      discountPercent = parseInt(found[1]) || 0;
      document.getElementById("discountText").style.display = "block";
      document.getElementById("discountText").textContent = `Diskon ${discountPercent}% diterapkan!`;
    } else {
      document.getElementById("discountText").style.display = "block";
      document.getElementById("discountText").textContent = "Kode voucher tidak valid";
      document.getElementById("discountText").style.color = "var(--danger)";
    }
  } catch {
    // Demo voucher
    if (code === "KAOS10") {
      discountPercent = 10;
      document.getElementById("discountText").style.display = "block";
      document.getElementById("discountText").textContent = `Diskon ${discountPercent}% diterapkan!`;
    } else {
      document.getElementById("discountText").style.display = "block";
      document.getElementById("discountText").textContent = "Kode voucher tidak valid";
      document.getElementById("discountText").style.color = "var(--danger)";
    }
  }
  
  updatePriceSummary();
});

// Kirim pesanan via WhatsApp
document.getElementById("sendOrder").addEventListener("click", sendOrder);

function sendOrder() {
  const name = document.getElementById("buyerName").value.trim();
  const wa = document.getElementById("buyerWA").value.trim();
  const address = document.getElementById("buyerAddress").value.trim();

  if (!name || !wa || !address) {
    alert("Harap lengkapi data diri kamu!");
    return;
  }

  if (cart.length === 0) {
    alert("Keranjang masih kosong!");
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = Math.floor(subtotal * discountPercent / 100);
  const grandTotal = subtotal - discountAmount;
  const orderId = "ORD-" + Date.now();
  const date = new Date().toLocaleString("id-ID");

  // Susun pesan WA
  let message = `🛒 *PESANAN BARU*\n`;
  message += `ID Pesanan: ${orderId}\n`;
  message += `Tanggal: ${date}\n\n`;
  message += `👤 Data Pembeli:\nNama: ${name}\nNo. WA: ${wa}\nAlamat: ${address}\n\n`;
  message += `📦 Detail Pesanan:\n`;
  
  cart.forEach(item => {
    message += `- ${item.name} ${item.size ? `(${item.size})` : ""} × ${item.quantity} = ${formatRupiah(item.price * item.quantity)}\n`;
  });

  message += `\nSubtotal: ${formatRupiah(subtotal)}\n`;
  if (discountAmount > 0) message += `Diskon: -${formatRupiah(discountAmount)}\n`;
  message += `💰 TOTAL: *${formatRupiah(grandTotal)}*\n\n`;
  message += `Silakan konfirmasi pesanan ini. Terima kasih! 😊`;

  // Simpan ke riwayat
  const order = {
    id: orderId,
    date: date,
    items: [...cart],
    subtotal: subtotal,
    discount: discountAmount,
    total: grandTotal,
    buyer: { name, wa, address }
  };
  
  orders.unshift(order);
  localStorage.setItem("orders", JSON.stringify(orders));

  // Buka WhatsApp
  const waNumber = "6281234567890"; // Ganti nomor WA-mu di sini
  window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, "_blank");

  // Reset keranjang
  cart = [];
  discountPercent = 0;
  updateCartCount();
  closeCartSidebar();
  renderCart();
  
  // Reset form
  document.getElementById("buyerName").value = "";
  document.getElementById("buyerWA").value = "";
  document.getElementById("buyerAddress").value = "";
  document.getElementById("voucherCode").value = "";
  document.getElementById("discountText").style.display = "none";

  alert("Pesanan berhasil dikirim! Terima kasih sudah berbelanja 😊");
}

// ====================================
// RIWAYAT PESANAN
// ====================================
function renderRiwayat() {
  const container = document.getElementById("riwayatContainer");
  
  if (orders.length === 0) {
    container.innerHTML = '<p class="empty-text">Belum ada pesanan. Yuk belanja dulu!</p>';
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="riwayat-card">
        <div class="riwayat-header">
            <span class="riwayat-id">#${order.id}</span>
            <span class="riwayat-date">${order.date}</span>
        </div>
        <div class="riwayat-items">
            ${order.items.map(i => `${i.name} ${i.size ? `(${i.size})` : ""} × ${i.quantity}`).join("<br>")}
        </div>
        <div class="riwayat-total">Total: ${formatRupiah(order.total)}</div>
    </div>
  `).join("");
}

// ====================================
// FUNGSI PANEL ADMIN
// ====================================
if (window.location.pathname.includes("admin.html")) {
  initAdmin();
}

function initAdmin() {
  loadProducts().then(() => renderAdminProductList());
  loadSlides().then(() => renderSliderEditor());

  // Form tambah/edit produk
  document.getElementById("productForm").addEventListener("submit", async e => {
    e.preventDefault();
    
    const id = document.getElementById("editProductId").value || `prod-${Date.now()}`;
    const name = document.getElementById("prodName").value;
    const category = document.getElementById("prodCategory").value;
    const image = document.getElementById("prodImage").value;
    const desc = document.getElementById("prodDesc").value;
    const price = parseInt(document.getElementById("prodPrice").value);
    const stock = parseInt(document.getElementById("prodStock").value);
    const sizes = document.getElementById("prodSizes").value;

    const newProduct = { id, name, category, image, description: desc, price, stock, sizes: sizes ? sizes.split(",").map(s => s.trim()) : [] };
    
    const editId = document.getElementById("editProductId").value;
    if (editId) {
      const idx = products.findIndex(p => p.id === editId);
      if (idx > -1) products[idx] = newProduct;
    } else {
      products.push(newProduct);
    }

    // Simpan ke Google Sheets (simulasi - kamu perlu buat Apps Script untuk simpan)
    alert("Produk tersimpan! Untuk menyimpan permanen, silakan hubungkan Google Apps Script ke sheet kamu.");
    
    document.getElementById("productForm").reset();
    document.getElementById("editProductId").value = "";
    renderAdminProductList();
  });

  // Tambah slide baru
  document.getElementById("addSlideBtn").addEventListener("click", () => {
    slides.push({ url: "" });
    renderSliderEditor();
  });
}

function renderAdminProductList() {
  const container = document.getElementById("productListAdmin");
  
  if (products.length === 0) {
    container.innerHTML = "<p>Belum ada produk.</p>";
    return;
  }

  container.innerHTML = products.map(p => `
    <div class="admin-product-item">
        <img src="${p.image}" class="admin-product-img" alt="${p.name}">
        <div class="admin-product-info">
            <div class="admin-product-name">${p.name}</div>
            <div class="admin-product-meta">${formatRupiah(p.price)} | Stok: ${p.stock} | ${p.category}</div>
        </div>
        <div class="admin-product-actions">
            <button class="edit-btn" data-id="${p.id}">Edit</button>
            <button class="delete-btn" data-id="${p.id}">Hapus</button>
        </div>
    </div>
  `).join("");

  // Event listener edit & hapus
  container.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const prod = products.find(p => p.id === btn.dataset.id);
      if (!prod) return;
      
      document.getElementById("editProductId").value = prod.id;
      document.getElementById("prodName").value = prod.name;
      document.getElementById("prodCategory").value = prod.category;
      document.getElementById("prodImage").value = prod.image;
      document.getElementById("prodDesc").value = prod.description;
      document.getElementById("prodPrice").value = prod.price;
      document.getElementById("prodStock").value = prod.stock;
      document.getElementById("prodSizes").value = prod.sizes.join(", ");
      
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  container.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (confirm("Yakin ingin menghapus produk ini?")) {
        products = products.filter(p => p.id !== btn.dataset.id);
        renderAdminProductList();
      }
    });
  });
}

function renderSliderEditor() {
  const container = document.getElementById("sliderEditContainer");
  
  container.innerHTML = slides.map((s, i) => `
    <div class="slider-edit-item">
        <label>Slide ${i + 1}:</label>
        <input type="url" value="${s.url}" placeholder="Masukkan link gambar" class="slide-url-input" data-index="${i}">
        <button class="delete-btn" data-slide-index="${i}"><i class="fas fa-times"></i></button>
    </div>
  `).join("");

  // Update nilai slide saat input berubah
  container.querySelectorAll(".slide-url-input").forEach(input => {
    input.addEventListener("input", () => {
      slides[parseInt(input.dataset.index)].url = input.value;
    });
  });

  // Hapus slide
  container.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      slides.splice(parseInt(btn.dataset.slideIndex), 1);
      renderSliderEditor();
    });
  });
}

// ====================================
// INISIALISASI SAAT HALAMAN DIMUAT
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  loadSlides();
  loadProducts();
});
