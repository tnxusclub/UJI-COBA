// ⚠️ Ganti dengan LINK WEB APP GOOGLE APPS SCRIPT kamu di sini
const GS_URL = "👉 TEMPEL LINK WEB APP GOOGLE SCRIPTS DI SINI 👈";

// === FUNGSI TAB ===
function bukaTab(tabId) {
  // Sembunyikan semua konten
  document.querySelectorAll('.tab-konten').forEach(t => t.classList.remove('aktif'));
  // Hapus status aktif dari semua tombol
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('aktif'));
  // Tampilkan tab yang dipilih
  document.getElementById(tabId).classList.add('aktif');
  event.target.classList.add('aktif');
  
  // Muat data sesuai tab
  if (tabId === 'produk-tab') muatProdukAdmin();
  if (tabId === 'slide-tab') muatSlideAdmin();
  if (tabId === 'riwayat-tab') muatRiwayatAdmin();
}

// === PRODUK ===
async function muatProdukAdmin() {
  const el = document.getElementById('daftarProdukAdmin');
  try {
    const res = await fetch(`${GS_URL}?action=getProduk`);
    const json = await res.json();
    if (!json.ok || !json.data.length) {
      el.innerHTML = '<p style="color:#888">Belum ada produk. Silakan tambah produk pertama di atas.</p>';
      return;
    }
    
    el.innerHTML = `
      <table>
        <tr>
          <th>Nama</th>
          <th>Kategori</th>
          <th>Harga</th>
          <th>Stok</th>
          <th>Aksi</th>
        </tr>
      ${json.data.map(p => `
        <tr>
          <td><strong>${p.nama}</strong><br><small style="color:#888">${p.deskripsi||''}</small></td>
          <td>${p.kategori === 'aksesoris' ? 'Aksesori' : 'Kaos'}</td>
          <td>Rp${Number(p.harga).toLocaleString('id-ID')}</td>
          <td>${p.stok||0}</td>
          <td>
            <button class="kuning" style="padding:4px 8px;font-size:12px;margin:2px;" onclick="editProduk('${p.id}','${p.nama}','${p.deskripsi||''}','${p.kategori}','${p.ukuran}','${p.harga}','${p.stok}','${p.foto}')">Ubah</button>
            <button class="hapus" onclick="hapusProduk('${p.id}')">Hapus</button>
          </td>
        </tr>
      `).join('')}
      </table>
    `;
  } catch(e) {
    el.innerHTML = `<p style="color:red">❌ Gagal memuat data. Pastikan link Google Script sudah benar.</p>`;
    console.error(e);
  }
}

async function simpanProduk() {
  const id = document.getElementById('editProdukId').value;
  const data = {
    nama: document.getElementById('namaProduk').value.trim(),
    deskripsi: document.getElementById('deskripsiProduk').value.trim(),
    kategori: document.getElementById('kategoriProduk').value,
    ukuran: document.getElementById('ukuranProduk').value.trim(),
    harga: document.getElementById('hargaProduk').value,
    stok: document.getElementById('stokProduk').value,
    foto: document.getElementById('fotoProduk').value.trim()
  };

  if (!data.nama || !data.harga) return alert('Nama dan Harga wajib diisi!');

  try {
    const action = id ? 'editProduk' : 'tambahProduk';
    const res = await fetch(GS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data: id ? { ...data, id } : data })
    });
    const json = await res.json();
    
    if (json.ok) {
      alert(id ? '✅ Produk berhasil diperbarui!' : '✅ Produk berhasil ditambahkan!');
      resetFormProduk();
      muatProdukAdmin();
    } else {
      alert('❌ Gagal menyimpan produk');
    }
  } catch(e) {
    alert('❌ Terjadi kesalahan. Cek koneksi internet atau link Google Script.');
    console.error(e);
  }
}

function editProduk(id, nama, deskripsi, kategori, ukuran, harga, stok, foto) {
  document.getElementById('editProdukId').value = id;
  document.getElementById('namaProduk').value = nama;
  document.getElementById('deskripsiProduk').value = deskripsi;
  document.getElementById('kategoriProduk').value = kategori;
  document.getElementById('ukuranProduk').value = ukuran;
  document.getElementById('hargaProduk').value = harga;
  document.getElementById('stokProduk').value = stok;
  document.getElementById('fotoProduk').value = foto;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetFormProduk() {
  document.getElementById('editProdukId').value = '';
  document.getElementById('namaProduk').value = '';
  document.getElementById('deskripsiProduk').value = '';
  document.getElementById('ukuranProduk').value = '';
  document.getElementById('hargaProduk').value = '';
  document.getElementById('stokProduk').value = '';
  document.getElementById('fotoProduk').value = '';
}

async function hapusProduk(id) {
  if (!confirm('⚠️ Yakin ingin menghapus produk ini? Tindakan ini tidak bisa dibatalkan!')) return;
  
  try {
    const res = await fetch(GS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'hapusProduk', data: { id } })
    });
    const json = await res.json();
    if (json.ok) {
      alert('✅ Produk berhasil dihapus!');
      muatProdukAdmin();
    } else {
      alert('❌ Gagal menghapus produk');
    }
  } catch(e) {
    alert('❌ Terjadi kesalahan');
    console.error(e);
  }
}

// === SLIDE BERANDA ===
async function muatSlideAdmin() {
  const el = document.getElementById('daftarSlideAdmin');
  try {
    const res = await fetch(`${GS_URL}?action=getSlide`);
    const json = await res.json();
    if (!json.ok || !json.data.length) {
      el.innerHTML = '<p style="color:#888">Belum ada slide. Tambahkan foto pertama di atas.</p>';
      return;
    }
    
    el.innerHTML = json.data.map(s => `
      <div style="display:flex;gap:15px;align-items:center;background:#333;padding:10px;border-radius:6px;margin-bottom:8px;">
        <img src="${s.foto}" style="width:80px;height:80px;object-fit:cover;border-radius:4px;" alt="Slide">
        <div>
          <div><strong>Urutan: ${s.urutan}</strong></div>
          <div style="font-size:12px;color:#888;word-break:break-all;max-width:300px;">${s.foto}</div>
        </div>
        <button class="hapus" style="margin-left:auto;" onclick="hapusSlide('${s.id}')">Hapus</button>
      </div>
    `).join('');
  } catch(e) {
    el.innerHTML = `<p style="color:red">❌ Gagal memuat data slide</p>`;
    console.error(e);
  }
}

async function tambahSlide() {
  const foto = document.getElementById('fotoSlide').value.trim();
  const urutan = document.getElementById('urutanSlide').value;
  
  if (!foto || !urutan) return alert('Link foto dan urutan wajib diisi!');
  
  try {
    const res = await fetch(GS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'tambahSlide', data: { foto, urutan } })
    });
    const json = await res.json();
    
    if (json.ok) {
      alert('✅ Slide berhasil ditambahkan!');
      document.getElementById('fotoSlide').value = '';
      document.getElementById('urutanSlide').value = '';
      muatSlideAdmin();
    } else {
      alert('❌ Gagal menambahkan slide');
    }
  } catch(e) {
    alert('❌ Terjadi kesalahan');
    console.error(e);
  }
}

async function hapusSlide(id) {
  if (!confirm('⚠️ Yakin ingin menghapus slide ini?')) return;
  
  try {
    const res = await fetch(GS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'hapusSlide', data: { id } })
    });
    const json = await res.json();
    
    if (json.ok) {
      alert('✅ Slide berhasil dihapus!');
      muatSlideAdmin();
    } else {
      alert('❌ Gagal menghapus slide');
    }
  } catch(e) {
    alert('❌ Terjadi kesalahan');
    console.error(e);
  }
}

// === RIWAYAT PESANAN ===
async function muatRiwayatAdmin() {
  const el = document.getElementById('daftarRiwayatAdmin');
  try {
    const res = await fetch(`${GS_URL}?action=getPesanan`);
    const json = await res.json();
    if (!json.ok || !json.data.length) {
      el.innerHTML = '<p style="color:#888">Belum ada pesanan masuk.</p>';
      return;
    }
    
    el.innerHTML = json.data.reverse().map(p => {
      let pesananList = [];
      try { pesananList = JSON.parse(p.pesanan); } catch(e) {}
      
      return `
        <div style="background:#333;padding:15px;border-radius:8px;margin-bottom:12px;border-left:3px solid #E50914;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
            <div>
              <strong>ID: ${p.id}</strong><br>
              <small style="color:#888">${new Date(p.tanggal).toLocaleString('id-ID')}</small>
            </div>
            <span style="background:#E50914;color:white;padding:2px 8px;border-radius:10px;font-size:12px;">${p.status || 'Baru'}</span>
          </div>
          <div style="margin-bottom:8px;">
            👤 <strong>${p.nama}</strong><br>
            📱 ${p.wa}<br>
            📍 ${p.alamat}
          </div>
          <div style="background:#222;padding:8px;border-radius:4px;margin-bottom:8px;">
            📦 <strong>Rincian:</strong><br>
            ${pesananList.length ? pesananList.map((item,i) => 
              `${i+1}. ${item.nama} (${item.ukuran}) — Rp${Number(item.harga).toLocaleString('id-ID')}`
            ).join('<br>') : 'Data tidak terbaca'}
          </div>
          <div style="display:flex;justify-content:space-between;font-weight:bold;">
            <span>🎫 Voucher: ${p.voucher || '-'}</span>
            <span style="color:#FFD700">💰 Rp${Number(p.total).toLocaleString('id-ID')}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch(e) {
    el.innerHTML = `<p style="color:red">❌ Gagal memuat riwayat pesanan</p>`;
    console.error(e);
  }
}

// === JALAN SAAT HALAMAN DIBUKA ===
document.addEventListener('DOMContentLoaded', () => {
  muatProdukAdmin();
});
