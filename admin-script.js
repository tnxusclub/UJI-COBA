const API_URL = "https://script.google.com/macros/s/AKfycbxxxxxxxxxxxx/exec"; // Ganti URL yang sama

document.addEventListener("DOMContentLoaded", () => {
  // Tab Switching
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
      
      if (btn.dataset.tab === "produk-tab") loadDaftarProduk();
      if (btn.dataset.tab === "slide-tab") loadDaftarSlide();
    };
  });
  
  // Form Produk
  document.getElementById("formProduk").onsubmit = async e => {
    e.preventDefault();
    
    const data = {
      action: "adminSimpanProduk",
      nama: document.getElementById("prodNama").value,
      kategori: document.getElementById("prodKategori").value,
      foto: document.getElementById("prodFoto").value,
      deskripsi: document.getElementById("prodDeskripsi").value,
      ukuran: document.getElementById("prodUkuran").value,
      harga: parseInt(document.getElementById("prodHarga").value),
      stok: parseInt(document.getElementById("prodStok").value)
    };
    
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    
    e.target.reset();
    document.getElementById("prodUkuran").value = "S,M,L,XL";
        document.getElementById("prodStok").value = "100";
    alert("✅ Produk berhasil disimpan!");
    loadDaftarProduk();
  };
  
  // Form Slide
  document.getElementById("formSlide").onsubmit = async e => {
    e.preventDefault();
    
    const data = {
      action: "adminSimpanSlide",
      urutan: parseInt(document.getElementById("slideUrutan").value),
      foto: document.getElementById("slideFoto").value,
      keterangan: document.getElementById("slideKeterangan").value
    };
    
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    
    e.target.reset();
    document.getElementById("slideUrutan").value = "1";
    alert("✅ Slide berhasil disimpan!");
    loadDaftarSlide();
  };
  
  loadDaftarProduk();
  loadDaftarSlide();
});

// ===== LOAD DAFTAR PRODUK =====
async function loadDaftarProduk() {
  const container = document.getElementById("daftarProduk");
  container.innerHTML = `<p>Memuat data...</p>`;
  
  try {
    const res = await fetch(API_URL + "?action=getProduk");
    const json = await res.json();
    const data = json.data;
    
    if (!data.length) {
      container.innerHTML = `<p class="text-center">Belum ada produk.</p>`;
      return;
    }
    
    container.innerHTML = data.map(item => `
      <div class="admin-item">
        <img src="${item[3]}" alt="${item[2]}" class="admin-item-img" onerror="this.src='https://via.placeholder.com/60'">
        <div class="admin-item-info">
          <h4>${item[2]}</h4>
          <p>${item[1]} — Rp${parseInt(item[6]).toLocaleString("id-ID")} | Stok: ${item[7]}</p>
          <p style="font-size:0.75rem; color:#999;">Ukuran: ${item[5]}</p>
        </div>
        <div class="admin-item-actions">
          <button class="btn-hapus" onclick="hapusProduk(${item[0]})">
            <i class="fa-solid fa-trash"></i> Hapus
          </button>
        </div>
      </div>
    `).join("");
  } catch (e) {
    container.innerHTML = `<p class="text-center">❌ Gagal memuat data</p>`;
  }
}

// ===== HAPUS PRODUK =====
async function hapusProduk(id) {
  if (!confirm("Yakin ingin menghapus produk ini?")) return;
  
  await fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "adminHapusProduk", id: id })
  });
  
  alert("✅ Produk berhasil dihapus!");
  loadDaftarProduk();
}

// ===== LOAD DAFTAR SLIDE =====
async function loadDaftarSlide() {
  const container = document.getElementById("daftarSlide");
  container.innerHTML = `<p>Memuat data...</p>`;
  
  try {
    const res = await fetch(API_URL + "?action=getSlides");
    const json = await res.json();
    const data = json.data;
    
    if (!data.length) {
      container.innerHTML = `<p class="text-center">Belum ada slide.</p>`;
      return;
    }
    
    container.innerHTML = data.map(item => `
      <div class="admin-item">
        <img src="${item[1]}" alt="${item[2]}" class="admin-item-img" onerror="this.src='https://via.placeholder.com/60'">
        <div class="admin-item-info">
          <h4>Urutan: ${item[0]}</h4>
          <p>${item[2] || "-"}</p>
        </div>
        <div class="admin-item-actions">
          <button class="btn-hapus" onclick="hapusSlide(${item[0]})">
            <i class="fa-solid fa-trash"></i> Hapus
          </button>
        </div>
      </div>
    `).join("");
  } catch (e) {
    container.innerHTML = `<p class="text-center">❌ Gagal memuat data</p>`;
  }
}

// ===== HAPUS SLIDE =====
async function hapusSlide(id) {
  if (!confirm("Yakin ingin menghapus slide ini?")) return;
  
  await fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "adminHapusSlide", id: id })
  });
  
  alert("✅ Slide berhasil dihapus!");
  loadDaftarSlide();
}
