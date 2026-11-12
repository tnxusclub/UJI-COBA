// === KONFIGURASI ===
const API_URL = "https://script.google.com/macros/s/AKfycbxzjSiycQgBwx9mGVqoTHQrtotSsfAn3rWzOc6V5lEiq_9uSHS41rgeubeWWRSxjg8bgQ/exec"; // Ganti dengan URL Deploy-mu
let keranjang = [];
let slides = [];
let produkList = [];
let slideIndex = 0;
let diskon = 0;

// === ELEMEN DOM ===
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const sidebarClose = document.getElementById("sidebarClose");
const cartToggle = document.getElementById("cartToggle");
const cartSidebar = document.getElementById("cartSidebar");
const cartOverlay = document.getElementById("cartOverlay");
const cartClose = document.getElementById("cartClose");
const pageLinks = document.querySelectorAll("[data-page]");

// === NAVIGASI & SIDEBAR ===
menuToggle.addEventListener("click", () => {
  sidebar.classList.add("active");
  sidebarOverlay.classList.add("active");
});
sidebarClose.addEventListener("click", tutupSidebar);
sidebarOverlay.addEventListener("click", tutupSidebar);
function tutupSidebar() {
  sidebar.classList.remove("active");
  sidebarOverlay.classList.remove("active");
}

cartToggle.addEventListener("click", () => {
  cartSidebar.classList.add("active");
  cartOverlay.classList.add("active");
  renderKeranjang();
});
cartClose.addEventListener("click", tutupKeranjang);
cartOverlay.addEventListener("click", tutupKeranjang);
function tutupKeranjang() {
  cartSidebar.classList.remove("active");
  cartOverlay.classList.remove("active");
}

// GANTI HALAMAN
pageLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const halaman = link.dataset.page;
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
    document.getElementById(`page-${halaman}`).classList.add("active-page");
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    tutupSidebar();
    if (halaman === "riwayat") muatRiwayat();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

// === SLIDER OTOMATIS BERANDA ===
function initSlider() {
  const slider = document.getElementById("heroSlider");
  const dotsContainer = document.getElementById("sliderDots");
  if (!slides.length) return;
  
  dotsContainer.innerHTML = "";
  slides.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = `dot ${i === 0 ? "active" : ""}`;
    dot.addEventListener("click", () => pindahSlide(i));
    dotsContainer.appendChild(dot);
  });
  
  setInterval(() => {
    slideIndex = (slideIndex + 1) % slides.length;
    pindahSlide(slideIndex);
  }, 4000);
}

function pindahSlide(index) {
  slideIndex = index;
  const slider = document.getElementById("heroSlider");
  if (slider) slider.style.transform = `translateX(${-index * 100}%)`;
  document.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === index));
}

// === MUAT DATA DARI GOOGLE SHEETS ===
async function muatSlide() {
  try {
    const res = await fetch(`${API_URL}?action=getSlide`);
    slides = await res.json();
    const slider = document.getElementById("heroSlider");
    if (slider && slides.length) {
      slider.innerHTML = slides.map(s => `<div class="slide"><img src="${s.foto}" alt=""></div>`).join("");
    }
    initSlider();
  } catch (e) {
    console.log("Gagal muat slide:", e);
  }
}

async function muatProduk() {
  try {
    const res = await fetch(`${API_URL}?action=getProduk`);
    produkList = await res.json();
    
    const bajuGrid = document.getElementById("bajuGrid");
    const aksesorisGrid = document.getElementById("aksesorisGrid");
    
    const baju = produkList.filter(p => p.kategori === "baju");
    const aksesoris = produkList.filter(p => p.kategori === "aksesoris");
    
    renderProduk(bajuGrid, baju);
    renderProduk(aksesorisGrid, aksesoris);
  } catch (e) {
    console.log("Gagal muat produk:", e);
  }
}

function renderProduk(container, list) {
  if (!list.length) {
    container.innerHTML = `<div class="loading">Belum ada produk.</div>`;
    return;
  }
  container.innerHTML = list.map(p => `
    <div class="product-card">
      <img src="${p.foto}" alt="${p.nama}" class="product-img">
      <div class="product-info">
        <h3 class="product-name">${p.nama}</h3>
        <p class="product-desc">${p.deskripsi}</p>
        <div class="product-sizes">
          ${p.ukuran.map(u => `<span class="size-btn" data-ukuran="${u}">${u}</span>`).join("")}
        </div>
        <div class="product-bottom">
          <span class="product-price">Rp ${p.harga.toLocaleString("id-ID")}</span>
          <button class="add-cart-btn" data-id="${p.id}"><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>
    </div>
  `).join("");
  
  container.querySelectorAll(".add-cart-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const card = btn.closest(".product-card");
      const selectedSize = card.querySelector(".size-btn.selected")?.dataset.ukuran || p.ukuran[0];
      tambahKeKeranjang(id, selectedSize);
    });
  });
  
  container.querySelectorAll(".size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.parentElement.querySelectorAll(".size-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });
}

// === KERANJANG ===
function tambahKeKeranjang(id, ukuran) {
  const produk = produkList.find(p => p.id === id);
  if (!produk) return;
  
  const ada = keranjang.findIndex(k => k.id === id && k.ukuran === ukuran);
  if (ada >= 0) {
    keranjang[ada].jumlah++;
  } else {
    keranjang.push({ ...produk, ukuran, jumlah: 1 });
  }
  updateJumlahKeranjang();
  tutupKeranjang();
}

function updateJumlahKeranjang() {
  document.getElementById("cartCount").textContent = keranjang.reduce((s, i) => s + i.jumlah, 0);
}

function renderKeranjang() {
  const container = document.getElementById("cartItems");
  if (!keranjang.length) {
    container.innerHTML = `<p style="text-align:center;color:#888;padding:1rem;">Keranjang kosong</p>`;
  } else {
    container.innerHTML = keranjang.map((item, idx) => `
      <div class="cart-item">
        <img src="${item.foto}" alt="">
        <div class="cart-item-info">
          <h4>${item.nama}</h4>
          <p>Ukuran: ${item.ukuran} • x${item.jumlah}</p>
          <p class="cart-item-harga">Rp ${(item.harga * item.jumlah).toLocaleString("id-ID")}</p>
        </div>
        <span class="cart-item-hapus" data-idx="${idx}"><i class="fa-solid fa-trash"></i></span>
      </div>
    `).join("");
    
    container.querySelectorAll(".cart-item-hapus").forEach(btn => {
      btn.addEventListener("click", () => {
        keranjang.splice(btn.dataset.idx, 1);
        renderKeranjang();
        updateJumlahKeranjang();
      });
    });
  }
  hitungTotal();
}

function hitungTotal() {
  const subtotal = keranjang.reduce((s, i) => s + (i.harga * i.jumlah), 0);
  const total = Math.max(0, subtotal - diskon);
  document.getElementById("subtotal").textContent = `Rp ${subtotal.toLocaleString("id-ID")}`;
  document.getElementById("diskon").textContent = `- Rp ${diskon.toLocaleString("id-ID")}`;
  document.getElementById("totalBayar").textContent = `Rp ${total.toLocaleString("id-ID")}`;
}

// VOUCHER
document.getElementById("applyVoucher").addEventListener("click", () => {
  const kode = document.getElementById("voucherInput").value.trim().toUpperCase();
  if (kode === "TNXUS10") {
    diskon = keranjang.reduce((s, i) => s + (i.harga * i.jumlah), 0) * 0.1;
    alert("✅ Voucher diterima! Diskon 10%");
  } else if (kode === "TNXUS50") {
    diskon = 50000;
    alert("✅ Voucher diterima! Diskon Rp 50.000");
  } else {
    diskon = 0;
    alert("❌ Kode voucher tidak valid");
  }
  hitungTotal();
});

// === CHECKOUT KIRIM VIA WHATSAPP ===
document.getElementById("btnCheckout").addEventListener("click", async () => {
  if (!keranjang.length) return alert("Keranjang kosong!");
  
  const nama = document.getElementById("namaPembeli").value.trim();
  const noWA = document.getElementById("noWA").value.trim();
  const alamat = document.getElementById("alamat").value.trim();
  
  if (!nama || !noWA || !alamat) return alert("Lengkapi data pengiriman!");
  
  const subtotal = keranjang.reduce((s, i) => s + (i.harga * i.jumlah), 0);
  const total = Math.max(0, subtotal - diskon);
  const kodeVoucher = document.getElementById("voucherInput").value.trim() || "-";
  
  // Susun pesan WA
  let pesan = `🛒 *PESANAN BARU — TNXUS CLUB*%0A%0A`;
  pesan += `📝 *Data Pembeli*%0ANama: ${nama}%0ANO WA: ${noWA}%0AAlamat: ${alamat}%0A%0A`;
  pesan += `📦 *Detail Pesanan*%0A`;
  keranjang.forEach(i => {
    pesan += `• ${i.nama} | ${i.ukuran} | x${i.jumlah} | Rp ${(i.harga*i.jumlah).toLocaleString("id-ID")}%0A`;
  });
  pesan += `%0ASubtotal: Rp ${subtotal.toLocaleString("id-ID")}%0A`;
  pesan += `Voucher: ${kodeVoucher} (-Rp ${diskon.toLocaleString("id-ID")})%0A`;
  pesan += `*TOTAL: Rp ${total.toLocaleString("id-ID")}*%0A%0A`;
  pesan += `Terima kasih telah berbelanja di TNXUS CLUB! 🙏`;
  
    // Simpan ke riwayat Google Sheets
  try {
    await fetch(`${API_URL}?action=simpanPesanan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama, noWA, alamat,
        keranjang: keranjang.map(i => ({nama:i.nama, ukuran:i.ukuran, harga:i.harga, jumlah:i.jumlah})),
        voucher: kodeVoucher,
        total
      })
    });
  } catch (e) {
    console.log("Gagal simpan riwayat:", e);
  }

  // Buka WhatsApp
  window.open(`https://wa.me/6285188081275?text=${pesan}`, "_blank");

  // Reset keranjang
  keranjang = [];
  diskon = 0;
  renderKeranjang();
  updateJumlahKeranjang();
  tutupKeranjang();
  document.getElementById("namaPembeli").value = "";
  document.getElementById("noWA").value = "";
  document.getElementById("alamat").value = "";
  document.getElementById("voucherInput").value = "";
});

// === RIWAYAT PEMBELIAN ===
async function muatRiwayat() {
  try {
    const res = await fetch(`${API_URL}?action=getRiwayat`);
    const riwayat = await res.json();
    const container = document.getElementById("riwayatList");
    
    if (!riwayat.length) {
      container.innerHTML = `<p style="text-align:center;color:#888;padding:2rem;">Belum ada riwayat pesanan.</p>`;
      return;
    }
    
    container.innerHTML = riwayat.map(r => {
      let detail = "";
      try {
        const items = typeof r.detail === "string" ? JSON.parse(r.detail) : r.detail;
        detail = items.map(i => `${i.nama} (${i.ukuran}) × ${i.jumlah}`).join("<br>");
      } catch {
        detail = r.detail;
      }
      return `
        <div class="riwayat-card">
          <div class="riwayat-header">
            <span class="riwayat-id">${r.id}</span>
            <span class="riwayat-status">${r.status}</span>
          </div>
          <div class="riwayat-detail">
            <p><strong>Nama:</strong> ${r.nama}</p>
            <p><strong>Tanggal:</strong> ${r.tanggal}</p>
            <p><strong>Detail:</strong><br>${detail}</p>
          </div>
          <p class="riwayat-total">Total: Rp ${Number(r.total).toLocaleString("id-ID")}</p>
        </div>
      `;
    }).join("");
  } catch (e) {
    document.getElementById("riwayatList").innerHTML = `<p style="text-align:center;color:var(--merah);">Gagal memuat riwayat</p>`;
  }
}

// === INISIALISASI SAAT HALAMAN DIBUKA ===
document.addEventListener("DOMContentLoaded", () => {
  muatSlide();
  muatProduk();
});
