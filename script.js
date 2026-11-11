const GS_URL = "👉 TEMPEL LINK WEB APP GOOGLE SCRIPTS DI SINI 👈";
let currentPage = 'beranda';
let cart = [];
let slideIndex = 0;
let slideTimer = null;
let diskonPersen = 0;

// === NAVIGASI ===
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  currentPage = page;
  toggleMenu(false);
  if (page === 'produk') muatProduk();
  if (page === 'riwayat') muatRiwayat();
  window.scrollTo(0,0);
}

function toggleMenu(show) {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  if (show === false || sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('show');
  }
}

// === SLIDE SHOW BERANDA ===
function initSlider() {
  const slides = document.querySelectorAll('.slide-item');
  const dotsContainer = document.getElementById('slideDots');
  dotsContainer.innerHTML = '';
  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = `dot ${i===0?'active':''}`;
    dot.onclick = () => goToSlide(i);
    dotsContainer.appendChild(dot);
  });
  mulaiAutoSlide();
}

function goToSlide(idx) {
  const wrapper = document.getElementById('slideWrapper');
  const slides = document.querySelectorAll('.slide-item');
  if (idx >= slides.length) idx = 0;
  if (idx < 0) idx = slides.length - 1;
  slideIndex = idx;
  wrapper.style.transform = `translateX(${-idx * 100}%)`;
  document.querySelectorAll('.dot').forEach((d,i) => d.classList.toggle('active', i===idx));
}

function mulaiAutoSlide() {
  if (slideTimer) clearInterval(slideTimer);
  slideTimer = setInterval(() => goToSlide(slideIndex + 1), 4000);
}

// === PRODUK ===
async function muatProduk() {
  try {
    const res = await fetch(`${GS_URL}?action=getProduk`);
    const json = await res.json();
    if (!json.ok) return;
    const produk = json.data.filter(p => p.kategori !== 'aksesoris');
    const aksesoris = json.data.filter(p => p.kategori === 'aksesoris');
    tampilkanProduk(produk, 'daftarProduk');
    tampilkanProduk(aksesoris, 'daftarAksesoris');
  } catch(e) {
    console.log('Gagal ambil produk, pakai contoh data');
    tampilkanProduk(contohProduk(), 'daftarProduk');
  }
}

function tampilkanProduk(list, containerId) {
  const el = document.getElementById(containerId);
  if (!list.length) { el.innerHTML = '<p class="text-center">Belum ada produk</p>'; return; }
  el.innerHTML = list.map(p => `
    <div class="produk-card">
      <img src="${p.foto}" alt="${p.nama}" class="produk-foto" loading="lazy">
      <div class="produk-nama">${p.nama}</div>
      <div class="produk-desc">${p.deskripsi}</div>
      <div class="produk-harga">Rp${formatRupiah(p.harga)}</div>
      <div class="produk-ukuran">
        ${(p.ukuran||'S,M,L,XL').split(',').map(u => 
          `<button class="ukuran-btn" onclick="pilihUkuran(this, '${p.id}', '${u}', '${p.nama}', ${p.harga}, '${p.foto}')">${u.trim()}</button>`
        ).join('')}
      </div>
    </div>
  `).join('');
}

let selectedItem = null;
function pilihUkuran(btn, id, ukuran, nama, harga, foto) {
  document.querySelectorAll('.ukuran-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedItem = { id, nama, ukuran, harga: Number(harga), foto };
  if (!document.querySelector('.tambah-btn')) {
    const card = btn.closest('.produk-card');
    card.insertAdjacentHTML('beforeend', 
      `<button class="tambah-keranjang tambah-btn" onclick="tambahKeKeranjang()">+ Masukkan Keranjang</button>`
    );
  }
}

function tambahKeKeranjang() {
  if (!selectedItem) return alert('Pilih ukuran dulu ya!');
  cart.push({ ...selectedItem, qty: 1 });
  updateKeranjangUI();
  selectedItem = null;
  document.querySelectorAll('.tambah-btn').forEach(b => b.remove());
  document.querySelectorAll('.ukuran-btn').forEach(b => b.classList.remove('selected'));
}

// === KERANJANG ===
function openCart() {
  document.getElementById('cartModal').classList.add('show');
  updateKeranjangUI();
}
function closeCart() {
  document.getElementById('cartModal').classList.remove('show');
  diskonPersen = 0;
  document.getElementById('voucherCode').value = '';
}

function updateKeranjangUI() {
  const badge = document.getElementById('cartBadge');
  const itemsEl = document.getElementById('cartItems');
  const subtotalEl = document.getElementById('subtotal');
  const diskonEl = document.getElementById('diskon');
  const totalEl = document.getElementById('grandTotal');
  
  badge.textContent = cart.length;
  
  if (!cart.length) {
    itemsEl.innerHTML = '<p style="text-align:center;color:#888;padding:16px;">Keranjang masih kosong</p>';
    subtotalEl.textContent = 'Rp0';
    diskonEl.textContent = 'Rp0';
    totalEl.textContent = 'Rp0';
    return;
  }
  
  itemsEl.innerHTML = cart.map((item, i) => `
    <div class="cart-item">
      <img src="${item.foto}" class="cart-foto">
      <div class="cart-info">
        <div class="cart-nama">${item.nama}</div>
        <div class="cart-ukuran">Ukuran: ${item.ukuran}</div>
        <div class="cart-harga">Rp${formatRupiah(item.harga)}</div>
      </div>
      <button class="cart-hapus" onclick="hapusDariKeranjang(${i})">✕</button>
    </div>
  `).join('');
  
  const subtotal = cart.reduce((sum, i) => sum + i.harga, 0);
  const diskon = Math.floor(subtotal * diskonPersen / 100);
  subtotalEl.textContent = `Rp${formatRupiah(subtotal)}`;
  diskonEl.textContent = `- Rp${formatRupiah(diskon)}`;
  totalEl.textContent = `Rp${formatRupiah(subtotal - diskon)}`;
}

function hapusDariKeranjang(idx) {
  cart.splice(idx, 1);
  updateKeranjangUI();
}

function applyVoucher() {
  const kode = document.getElementById('voucherCode').value.trim().toUpperCase();
  if (kode === 'DISKON10') diskonPersen = 10;
  else if (kode === 'HEMAT20') diskonPersen = 20;
  else diskonPersen = 0;
  alert(diskonPersen ? `✅ Voucher berlaku! Diskon ${diskonPersen}%` : '❌ Kode voucher tidak valid');
  updateKeranjangUI();
}

// === KIRIM VIA WHATSAPP ===
async function kirimPesananWA() {
  const nama = document.getElementById('namaPembeli').value.trim();
  const wa = document.getElementById('waPembeli').value.trim();
  const alamat = document.getElementById('alamatPembeli').value.trim();
  
  if (!nama || !wa || !alamat || !cart.length) {
    return alert('Lengkapi data dan keranjang dulu!');
  }
  
  const subtotal = cart.reduce((sum, i) => sum + i.harga, 0);
  const diskon = Math.floor(subtotal * diskonPersen / 100);
  const total = subtotal - diskon;
  const kodeVoucher = document.getElementById('voucherCode').value.trim() || '-';
  
  const teks = `
📦 *PESANAN BARU*

👤 Nama: ${nama}
📱 WhatsApp: ${wa}
📍 Alamat: ${alamat}

🛒 *Rincian Pesanan:*
${cart.map((item, i) => `${i+1}. ${item.nama} — Ukuran: ${item.ukuran} — Rp${formatRupiah(item.harga)}`).join('\n')}

💵 Subtotal: Rp${formatRupiah(subtotal)}
🎫 Voucher: ${kodeVoucher}
🔻 Diskon: Rp${formatRupiah(diskon)}
💰 *TOTAL: Rp${formatRupiah(total)}*

Terima kasih sudah berbelanja! 😊
  `.trim();
  
  // Simpan ke Google Sheets
  try {
    await fetch(GS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'simpanPesanan',
        data: { nama, wa, alamat, keranjang: cart, total, voucher: kodeVoucher }
      })
    });
  } catch(e) { console.log('Gagal simpan ke sheet'); }
  
  // Buka WhatsApp
  const nomorWA = '6281234567890'; // Ganti nomor WA toko kamu
  window.open(`https://wa.me/${nomorWA}?text=${encodeURIComponent(teks)}`, '_blank');
  
  // Reset
  cart = [];
  diskonPersen = 0;
  document.getElementById('namaPembeli').value = '';
  document.getElementById('waPembeli').value = '';
  document.getElementById('alamatPembeli').value = '';
  document.getElementById('voucherCode').value = '';
  closeCart();
  alert('✅ Pesanan dikirim! Terima kasih 😊');
}

// === RIWAYAT ===
async function muatRiwayat() {
  const el = document.getElementById('daftarRiwayat');
  try {
    const res = await fetch(`${GS_URL}?action=getPesanan`);
    const json = await res.json();
    if (!json.ok || !json.data.length) throw Error();
    el.innerHTML = json.data.map(p => `
      <div class="riwayat-card">
        <div class="riwayat-id">${p.id} — ${new Date(p.tanggal).toLocaleString('id-ID')}</div>
        <span class="riwayat-status">${p.status || 'Baru'}</span>
        <div class="riwayat-item">📦 ${JSON.parse(p.pesanan).map(i => `${i.nama} (${i.ukuran})`).join(', ')}</div>
        <div class="riwayat-total">💰 Rp${formatRupiah(p.total)}</div>
      </div>
    `).join('');
  } catch(e) {
    el.innerHTML = '<p class="text-center">Belum ada riwayat pesanan</p>';
  }
}

// === FUNGSI BANTUAN ===
function formatRupiah(angka) {
  return Number(angka).toLocaleString('id-ID');
}

function contohProduk() {
  return [
    { id:'P1', nama:'Kaos Polos Premium', deskripsi:'Katun 30s adem', kategori:'produk', ukuran:'S,M,L,XL', harga:85000, foto:'https://via.placeholder.com/400x400/111/E50914?text=Kaos+Polos' },
    { id:'P2', nama:'Kaos Motif Keren', deskripsi:'Sablon awet', kategori:'produk', ukuran:'M,L,XL,XXL', harga:99000, foto:'https://via.placeholder.com/400x400/111/FFD700?text=Kaos+Motif' },
    { id:'A1', nama:'Topi Trucker', deskripsi:'Nyaman dipakai', kategori:'aksesoris', ukuran:'Sekali Ukuran', harga:45000, foto:'https://via.placeholder.com/400x400/222/E50914?text=Topi' },
    { id:'A2', nama:'Gantungan Kunci', deskripsi:'Aksesori lucu', kategori:'aksesoris', ukuran:'Sekali Ukuran', harga:15000, foto:'https://via.placeholder.com/400x400/222/FFD700?text=Gantungan' }
  ];
}

// === JALAN SAAT HALAMAN DIBUKA ===
document.addEventListener('DOMContentLoaded', () => {
  initSlider();
  muatProduk();
});
