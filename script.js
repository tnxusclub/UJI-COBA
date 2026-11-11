// ===== KONFIGURASI =====
const API_URL = "https://script.google.com/macros/s/AKfycbxxxxxxxxxxxx/exec"; // Ganti URL deploy Apps Script kamu
let keranjang = JSON.parse(localStorage.getItem("keranjangKaos") || "[]");
let voucherDiskon = 0;
let daftarSlide = [];
let slideIndex = 0;

// ===== INISIALISASI =====
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  initSidebar();
  initKeranjang();
  
  if (document.getElementById("sliderWrapper")) initSlider();
  if (document.getElementById("kaosGrid")) loadProduk();
});

// ===== MENU SIDEBAR =====
function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  
  document.getElementById("menuToggle").onclick = () => {
    sidebar.classList.add("open");
    overlay.classList.add("show");
  };
  
  document.querySelector(".close-sidebar").onclick = closeSidebar;
  overlay.onclick = closeSidebar;
  
  function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  }
}

// ===== KERANJANG =====
function initKeranjang() {
  const cartSidebar = document.getElementById("cartSidebar");
  const cartOverlay = document.getElementById("cartOverlay");
  
  document.getElementById("cartIcon").onclick = () => {
    cartSidebar.classList.add("open");
    cartOverlay.classList.add("show");
    renderKeranjang();
  };
  
  document.querySelector(".close-cart").onclick = closeCart;
  cartOverlay.onclick = closeCart;
  
  function closeCart() {
    cartSidebar.classList.remove("open");
    cartOverlay.classList.remove("show");
  }
  
  // Voucher
  document.getElementById("pakaiVoucher").onclick = () => {
    const kode = document.getElementById("voucherInput").value.toUpperCase().trim();
    if (kode === "DISKON10") {
      voucherDiskon = 10;
      alert("✅ Voucher diterima! Diskon 10%");
    } else if (kode === "HEMAT5") {
      voucherDiskon = 5;
      alert("✅ Voucher diterima! Diskon 5%");
    } else if (kode) {
      alert("❌ Kode voucher tidak valid");
      voucherDiskon = 0;
    }
    hitungTotal();
  };
  
  // Kirim Pesanan
  document.getElementById("btnPesan").onclick = kirimPesanan;
}

function updateCartBadge() {
  document.getElementById("cartBadge").textContent = keranjang.reduce((sum, item) => sum + item.jumlah, 0);
}

function renderKeranjang() {
  const container = document.getElementById("cartItems");
  
  if (keranjang.length === 0) {
    container.innerHTML = `<p class="cart-empty">Keranjang kamu masih kosong</p>`;
    hitungTotal();
    return;
  }
  
  container.innerHTML = keranjang.map((item, idx) => `
    <div class="cart-item">
      <img src="${item.foto}" alt="${item.nama}" class="cart-item-img">
      <div class="cart-item-info">
        <h4>${item.nama}</h4>
        <p>Ukuran: ${item.ukuran}</p>
        <p>Rp${item.harga.toLocaleString("id-ID")} × ${item.jumlah}</p>
      </div>
      <button class="cart-item-hapus" onclick="hapusDariKeranjang(${idx})">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join("");
  
  hitungTotal();
}

function hapusDariKeranjang(index) {
  keranjang.splice(index, 1);
  simpanKeranjang();
  renderKeranjang();
  updateCartBadge();
}

function simpanKeranjang() {
  localStorage.setItem("keranjangKaos", JSON.stringify(keranjang));
}

function hitungTotal() {
  const subtotal = keranjang.reduce((sum, item) => sum + (item.harga * item.jumlah), 0);
  const diskon = Math.floor(subtotal * voucherDiskon / 100);
  const total = subtotal - diskon;
  
  document.getElementById("subtotal").textContent = `Rp${subtotal.toLocaleString("id-ID")}`;
  document.getElementById("diskon").textContent = `Rp${diskon.toLocaleString("id-ID")}`;
  document.getElementById("totalBayar").textContent = `Rp${total.toLocaleString("id-ID")}`;
}

async function kirimPesanan() {
  const nama = document.getElementById("namaPembeli").value.trim();
  const wa = document.getElementById("noWA").value.trim();
  const alamat = document.getElementById("alamat").value.trim();
  
  if (!nama || !wa || !alamat || keranjang.length === 0) {
    alert("❌ Lengkapi semua data dan pastikan keranjang tidak kosong!");
    return;
  }
  
  const subtotal = keranjang.reduce((sum, item) => sum + (item.harga * item.jumlah), 0);
  const diskon = Math.floor(subtotal * voucherDiskon / 100);
  const total = subtotal - diskon;
  
  // Susun pesanan untuk WhatsApp
  let teks = `🛒 *PESANAN BARU*\n\n`;
  teks += `Nama: ${nama}\n`;
  teks += `WhatsApp: ${wa}\n`;
  teks += `Alamat: ${alamat}\n\n`;
  teks += `📦 *Detail Pesanan:*\n`;
  
  keranjang.forEach(item => {
    teks += `• ${item.nama} (${item.ukuran}) — ${item.jumlah} pcs × Rp${item.harga.toLocaleString("id-ID")} = Rp${(item.harga * item.jumlah).toLocaleString("id-ID")}\n`;
  });
  
  teks += `\nSubtotal: Rp${subtotal.toLocaleString("id-ID")}\n`;
  teks += `Diskon: Rp${diskon.toLocaleString("id-ID")}\n`;
  teks += `💰 *Total Bayar: Rp${total.toLocaleString("id-ID")}*`;
  
  // Simpan ke Google Sheets
  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "simpanPesanan",
        nama, wa, alamat,
        items: keranjang,
        total
      })
    });
  } catch (e) {
    console.log("Tersimpan lokal saja");
  }
  
  // Kirim ke WhatsApp
  const nomorWA = "6281234567890"; // Ganti nomor WhatsApp kamu
  window.open(`https://wa.me/${nomorWA}?text=${encodeURIComponent(teks)}`, "_blank");
  
  // Kosongkan keranjang
  keranjang = [];
  simpanKeranjang();
  voucherDiskon = 0;
  document.getElementById("voucherInput").value = "";
  document.getElementById("namaPembeli").value = "";
  document.getElementById("noWA").value = "";
  document.getElementById("alamat").value = "";
  renderKeranjang();
  updateCartBadge();
  
  alert("✅ Pesanan dikirim via WhatsApp! Terima kasih telah berbelanja.");
}

// ===== SLIDER BERANDA =====
async function initSlider() {
  try {
    const res = await fetch(API_URL + "?action=getSlides");
    const json = await res.json();
    daftarSlide = json.data.length ? json.data : [
      [1, "https://raw.githubusercontent.com/USERNAME/REPO/main/assets/slide1.jpg", "Kaos Premium"],
      [2, "https://raw.githubusercontent.com/USERNAME/REPO/main/assets/slide2.jpg", "Desain Eksklusif"],
      [3, "https://raw.githubusercontent.com/USERNAME/REPO/main/assets/slide3.jpg", "Harga Terjangkau"],
      [4, "https://raw.githubusercontent.com/USERNAME/REPO/main/assets/slide4.jpg", "Bahan Nyaman"]
    ];
  } catch {
    daftarSlide = [
      [1, "https://raw.githubusercontent.com/USERNAME/REPO/main/assets/slide1.jpg", "Kaos Premium"],
      [2, "https://raw.githubusercontent.com/USERNAME/REPO/main/assets/slide2.jpg", "Desain Eksklusif"],
      [3, "https://raw.githubusercontent.com/USERNAME/REPO/main/assets/slide3.jpg", "Harga Terjangkau"],
      [4, "https://raw.githubusercontent.com/USERNAME/REPO/main/assets/slide4.jpg", "Bahan Nyaman"]
    ];
  }
  
  renderSlides();
  slideIndex = 0;
  updateSlidePosition();
  
  document.getElementById("slidePrev").onclick = () => {
    slideIndex = (slideIndex - 1 + daftarSlide.length) % daftarSlide.length;
    updateSlidePosition();
  };
  
  document.getElementById("slideNext").onclick = () => {
    slideIndex = (slideIndex + 1) % daftarSlide.length;
    updateSlidePosition();
  };
  
  setInterval(() => {
    slideIndex = (slideIndex + 1) % daftarSlide.length;
    updateSlidePosition();
  }, 4000);
}

function renderSlides() {
  const wrapper = document.getElementById("sliderWrapper");
  const dots = document.getElementById("sliderDots");
  
  wrapper.innerHTML = daftarSlide.map(slide => `
    <div class="slide-item">
      <img src="${slide[1]}" alt="${slide[2] || 'Slide'}">
    </div>
  `).join("");
  
  dots.innerHTML = daftarSlide.map((_, i) => `
    <span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
  `).join("");
  
  document.querySelectorAll(".dot").forEach(dot => {
    dot.onclick = () => {
      slideIndex = parseInt(dot.dataset.index);
      updateSlidePosition();
    };
  });
}

function updateSlidePosition() {
  document.getElementById("sliderWrapper").style.transform = `translateX(-${slideIndex * 100}%)`;
  document.querySelectorAll(".dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === slideIndex);
  });
}

// ===== LOAD PRODUK =====
async function loadProduk() {
  try {
    const res = await fetch(API_URL + "?action=getProduk");
    const json = await res.json();
    const semuaProduk = json.data;
    
    const kaos = semuaProduk.filter(p => p[1] === "Kaos");
    const aksesoris = semuaProduk.filter(p => p[1] === "Aksesoris");
    
    renderProduk("kaosGrid", kaos);
    renderProduk("aksesorisGrid", aksesoris);
  } catch (e) {
    document.getElementById("kaosGrid").innerHTML = `<p class="loading">Gagal memuat data</p>`;
  }
}

function renderProduk(containerId, daftarProduk) {
  const container = document.getElementById(containerId);
  
  if (!daftarProduk.length) {
    container.innerHTML = `<p class="loading">Belum ada produk</p>`;
    return;
  }
  
  container.innerHTML = daftarProduk.map(prod => {
    const id = prod[0];
    const nama = prod[2];
    const foto = prod[3];
    const deskripsi = prod[4] || "";
    const ukuran = (prod[5] || "S,M,L,XL").split(",");
    const harga = parseInt(prod[6]) || 0;
    const stok = prod[7] || 0;
    
    return `
      <div class="product-card">
        <img src="${foto}" alt="${nama}" class="product-img" loading="lazy">
        <div class="product-body">
          <h3>${nama}</h3>
          <p class="desc">${deskripsi}</p>
          <div class="product-sizes" data-id="${id}">
            ${ukuran.map(u => `<button class="size-btn" data-size="${u.trim()}">${u.trim()}</button>`).join("")}
          </div>
          <div class="product-footer">
            <span class="price">Rp${harga.toLocaleString("id-ID")}</span>
            <button class="add-cart-btn" data-id="${id}" data-nama="${nama}" data-foto="${foto}" data-harga="${harga}" data-stok="${stok}">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
  
  // Event listener tombol ukuran & tambah keranjang
  container.querySelectorAll(".size-btn").forEach(btn => {
    btn.onclick = function() {
      this.parentElement.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
      this.classList.add("active");
    };
  });
  
  container.querySelectorAll(".add-cart-btn").forEach(btn => {
    btn.onclick = function() {
      const id = this.dataset.id;
      const nama = this.dataset.nama;
      const foto = this.dataset.foto;
      const harga = parseInt(this.dataset.harga);
      
      const sizeContainer = this.parentElement.parentElement.querySelector(".product-sizes");
      const activeSize = sizeContainer.querySelector(".size-btn.active");
      const ukuran = activeSize ? activeSize.dataset.size : "S";
      
      const idx = keranjang.findIndex(item => item.id === id && item.ukuran === ukuran);
      if (idx > -1) {
        keranjang[idx].jumlah += 1;
      } else {
        keranjang.push({ id, nama, foto, harga, ukuran, jumlah: 1 });
      }
      
      simpanKeranjang();
      updateCartBadge();
      
      // Animasi
      this.style.transform = "scale(1.2)";
      setTimeout(() => this.style.transform = "", 200);
    };
  });
}
