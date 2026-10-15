/* ==========================================================================
   D.R Florist : perilaku sisi klien
   Tanpa pustaka luar, tanpa emoji.
   ========================================================================== */
(function () {
  'use strict';

  var WA_NUMBER = '628139526151';

  /* ------------------------------------------------------------------
     Generator tautan WhatsApp
     Menyusun pesan yang sudah berisi konteks produk sehingga penjual
     langsung tahu produk mana yang dimaksud pembeli.
     ------------------------------------------------------------------ */
  function waLink(opts) {
    var lines = [];

    if (opts && opts.product) {
      lines.push('Halo D.R Florist, saya mau pesan:');
      lines.push('');
      lines.push('Produk: ' + opts.product);
      if (opts.variant) lines.push('Pilihan: ' + opts.variant);
      if (opts.price)   lines.push('Harga: ' + opts.price);
      if (opts.url)     lines.push('Link: ' + opts.url);
      lines.push('');
      lines.push('Apakah stoknya tersedia?');
    } else if (opts && opts.message) {
      lines.push(opts.message);
    } else {
      lines.push('Halo D.R Florist, saya mau tanya mengenai rangkaian bunga.');
    }

    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  function absUrl(path) {
    try { return new URL(path, window.location.origin).href; }
    catch (e) { return path; }
  }

  /* ------------------------------------------------------------------
     Pasang tautan WhatsApp pada elemen ber-atribut data-wa-*
     ------------------------------------------------------------------ */
  function initWaLinks() {
    var nodes = document.querySelectorAll('[data-wa-product]');
    Array.prototype.forEach.call(nodes, function (el) {
      var product = el.getAttribute('data-wa-product') || '';
      var price   = el.getAttribute('data-wa-price') || '';
      var url     = el.getAttribute('data-wa-url') || '';

      var href = waLink({
        product: product,
        price: price,
        url: url ? absUrl(url) : absUrl(window.location.pathname)
      });

      el.setAttribute('href', href);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    });

    // Tautan WhatsApp umum (tanpa konteks produk)
    var generic = document.querySelectorAll('[data-wa-generic]');
    Array.prototype.forEach.call(generic, function (el) {
      var msg = el.getAttribute('data-wa-generic') || '';
      el.setAttribute('href', waLink({ message: msg }));
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    });
  }

  /* ------------------------------------------------------------------
     Menu navigasi untuk layar kecil
     ------------------------------------------------------------------ */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Tutup menu ketika tautan dipilih
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Tutup dengan tombol Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------------
     Katalog: penyaring kategori dan pencarian nama
     ------------------------------------------------------------------ */
  function initCatalog() {
    var root = document.querySelector('[data-catalog]');
    if (!root) return;

    var chips    = root.querySelectorAll('.chip');
    var select   = root.querySelector('#catalog-cat');
    var cards    = root.querySelectorAll('[data-product]');
    var search   = root.querySelector('#catalog-search');
    var counter  = root.querySelector('[data-result-count]');
    var emptyBox = root.querySelector('[data-empty-state]');
    var activeCat = 'all';

    function apply() {
      var term = search ? search.value.trim().toLowerCase() : '';
      var shown = 0;

      Array.prototype.forEach.call(cards, function (card) {
        var cat = card.getAttribute('data-category') || '';
        var name = (card.getAttribute('data-name') || '').toLowerCase();
        var text = (card.getAttribute('data-search') || '').toLowerCase();

        var catOk = activeCat === 'all' || cat === activeCat;
        var termOk = !term || name.indexOf(term) !== -1 || text.indexOf(term) !== -1;

        if (catOk && termOk) {
          card.hidden = false;
          shown++;
        } else {
          card.hidden = true;
        }
      });

      if (counter) {
        counter.textContent = shown === 0
          ? 'Tidak ada produk yang cocok'
          : 'Menampilkan ' + shown + ' produk';
      }
      if (emptyBox) emptyBox.hidden = shown !== 0;
    }

    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener('click', function () {
        activeCat = chip.getAttribute('data-cat') || 'all';
        Array.prototype.forEach.call(chips, function (c) {
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });
        // Jaga agar dropdown dan tombol tidak pernah berbeda keadaan
        if (select) select.value = activeCat;
        apply();
      });
    });

    // Dropdown kategori dipakai di layar kecil. Keadaannya disamakan dengan
    // tombol kategori supaya keduanya selalu menunjuk saringan yang sama.
    if (select) {
      select.addEventListener('change', function () {
        activeCat = select.value || 'all';
        Array.prototype.forEach.call(chips, function (c) {
          c.setAttribute('aria-pressed',
            (c.getAttribute('data-cat') || 'all') === activeCat ? 'true' : 'false');
        });
        apply();
      });
    }

    if (search) {
      search.addEventListener('input', apply);
      // Enter tidak mengirim formulir, cukup menyaring
      search.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') e.preventDefault();
      });
    }

    apply();
  }

  /* ------------------------------------------------------------------
     Kemunculan saat digulir
     Menambah kelas .is-in ketika elemen masuk layar. Bila pengamat tidak
     tersedia, semua elemen langsung ditampilkan supaya tidak ada isi yang
     tertinggal tersembunyi.
     ------------------------------------------------------------------ */
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    function showAll() {
      Array.prototype.forEach.call(items, function (el) {
        el.classList.add('is-in');
      });
    }

    if (!('IntersectionObserver' in window)) {
      showAll();
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.08 });

    Array.prototype.forEach.call(items, function (el) {
      observer.observe(el);
    });

    // Jaring pengaman: bila karena sebab apa pun pengamat tidak pernah
    // melapor, tampilkan semua setelah tiga detik agar isi tidak hilang.
    window.setTimeout(function () {
      var sisa = document.querySelectorAll('[data-reveal]:not(.is-in)');
      if (sisa.length === items.length) showAll();
    }, 3000);
  }

  /* ------------------------------------------------------------------
     Gambar menyusup halus setelah selesai dimuat
     ------------------------------------------------------------------ */
  function initImages() {
    var imgs = document.querySelectorAll('.prod-media img, .cat-card-media img');
    Array.prototype.forEach.call(imgs, function (img) {
      function done() { img.classList.add('is-loaded'); }
      if (img.complete && img.naturalWidth > 0) done();
      else {
        img.addEventListener('load', done);
        img.addEventListener('error', done);
      }
    });
  }

  /* ------------------------------------------------------------------
     Kepala halaman: bayangan tipis saat halaman digulir
     ------------------------------------------------------------------ */
  function initHeader() {
    var head = document.querySelector('.site-header');
    if (!head) return;

    var ticking = false;
    function update() {
      head.classList.toggle('is-scrolled', window.pageYOffset > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------
     Gambar beranda yang berganti
     Rangkaian unggulan tampil bergantian agar beranda terasa hidup.
     Bila JavaScript gagal dimuat, gambar pertama tetap tampil karena
     sudah ditandai aktif di dalam HTML. Titik navigasi baru muncul
     setelah skrip inti benar-benar berjalan, sehingga tidak ada
     kendali mati yang bisa ditekan tanpa hasil.
     ------------------------------------------------------------------ */
  function initHero() {
    var root = document.querySelector('[data-hero]');
    if (!root) return;

    var slides  = root.querySelectorAll('[data-hero-slide]');
    var dots    = root.querySelectorAll('[data-hero-goto]');
    var caption = root.querySelector('[data-hero-caption]');
    if (slides.length < 2) return;

    var idx = 0;
    var timer = null;
    var kurangiGerak = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    function tampil(i) {
      idx = ((i % slides.length) + slides.length) % slides.length;

      Array.prototype.forEach.call(slides, function (s, k) {
        s.classList.toggle('is-aktif', k === idx);
        // Slide yang tidak tampil dikeluarkan dari urutan Tab dan disembunyikan
        // dari pembaca layar. Selama gambar memudar (0,9 detik) lapisan lama
        // masih terlihat oleh peramban, jadi tanpa penanda ini pengunjung
        // papan ketik bisa mendarat di gambar yang sudah tidak tampak.
        if (k === idx) {
          s.removeAttribute('tabindex');
          s.removeAttribute('aria-hidden');
        } else {
          s.setAttribute('tabindex', '-1');
          s.setAttribute('aria-hidden', 'true');
        }
      });
      Array.prototype.forEach.call(dots, function (d, k) {
        d.classList.toggle('is-aktif', k === idx);
        d.setAttribute('aria-current', k === idx ? 'true' : 'false');
      });
      if (caption) {
        var nama = slides[idx].getAttribute('data-nama');
        if (nama) caption.textContent = nama;
      }
    }

    function henti() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }

    function mulai() {
      // Pengunjung yang meminta gerak diminimalkan tidak diberi rotasi
      // otomatis. Gambar tetap dapat dipilih sendiri lewat titik navigasi.
      if (kurangiGerak || document.hidden) return;
      henti();
      timer = window.setInterval(function () { tampil(idx + 1); }, 7000);
    }

    var prev = root.querySelector('[data-hero-prev]');
    var next = root.querySelector('[data-hero-next]');
    var panggung = root.querySelector('.hero-slides');

    // Tampilkan slide lain lalu mulai lagi hitungan mundur, supaya slide
    // yang baru dipilih tidak langsung tergeser beberapa detik kemudian.
    function lompat(arah) { tampil(idx + arah); mulai(); }

    Array.prototype.forEach.call(dots, function (d, k) {
      d.addEventListener('click', function () { tampil(k); mulai(); });
    });
    if (prev) prev.addEventListener('click', function () { lompat(-1); });
    if (next) next.addEventListener('click', function () { lompat(1); });

    /* Geser gambar dengan jari atau tetikus. Ambang 40 piksel dipakai agar
       sentuhan tidak sengaja tidak langsung mengganti gambar, dan gerak
       mendatar dibedakan dari gerak tegak supaya menggulir halaman tetap
       terasa wajar. */
    if (panggung) {
      var mulaiX = 0, mulaiY = 0, geserX = 0, menyeret = false;
      var abaikanKlik = false, ditangkap = false;

      panggung.addEventListener('pointerdown', function (ev) {
        if (ev.pointerType === 'mouse' && ev.button !== 0) return;
        menyeret = true; abaikanKlik = false; ditangkap = false;
        mulaiX = ev.clientX; mulaiY = ev.clientY; geserX = 0;
        henti();
      });

      panggung.addEventListener('pointermove', function (ev) {
        if (!menyeret) return;
        geserX = ev.clientX - mulaiX;
        var geserY = ev.clientY - mulaiY;
        // Bila pengunjung jelas menggulir tegak, lepaskan agar halaman
        // yang bergerak, bukan gambar.
        if (Math.abs(geserY) > Math.abs(geserX) && Math.abs(geserY) > 12) {
          menyeret = false;
          return;
        }
        // Penangkapan baru dilakukan setelah jari benar-benar bergeser
        // mendatar. Dengan begitu ketukan biasa tetap membuka halaman
        // produk seperti seharusnya.
        if (!ditangkap && Math.abs(geserX) > 8 &&
            Math.abs(geserX) > Math.abs(geserY) && panggung.setPointerCapture) {
          ditangkap = true;
          try { panggung.setPointerCapture(ev.pointerId); } catch (e) {}
        }
      });

      // Dua ambang dipakai. Di atas 10 piksel, gerakan sudah dianggap
      // sapuan sehingga klik tidak diteruskan (pengunjung tidak sengaja
      // terbawa ke halaman produk karena menyapu terlalu pelan). Di atas
      // 40 piksel, sapuan cukup jauh sehingga gambar benar-benar berganti.
      function lepas(ev) {
        if (!menyeret) return;
        menyeret = false;
        var selesaiX = ev.clientX - mulaiX;
        var mendatar = Math.abs(selesaiX) > Math.abs(ev.clientY - mulaiY);
        if (Math.abs(selesaiX) > 10 && mendatar) {
          abaikanKlik = true;
          // Batas waktu dipasang supaya pengabaian ini tidak ikut menahan
          // klik yang sah bila peramban tidak mengirim peristiwa klik.
          window.setTimeout(function () { abaikanKlik = false; }, 400);
        }
        if (Math.abs(selesaiX) >= 40 && mendatar) {
          lompat(selesaiX < 0 ? 1 : -1);
        } else {
          mulai();
        }
      }
      panggung.addEventListener('pointerup', lepas);
      panggung.addEventListener('pointercancel', function () { menyeret = false; mulai(); });

      // Penjaga tambahan. Bila peramban tetap memulai seret bawaan,
      // batalkan agar sapuan mendatar tidak terputus di tengah jalan.
      panggung.addEventListener('dragstart', function (ev) { ev.preventDefault(); });

      // Geseran yang sudah mengganti gambar tidak boleh ikut membuka
      // halaman produk yang kebetulan berada di bawah jari.
      panggung.addEventListener('click', function (ev) {
        if (abaikanKlik) { abaikanKlik = false; ev.preventDefault(); ev.stopPropagation(); }
      }, true);
    }

    // Papan ketik: panah kiri dan kanan memindahkan gambar saat fokus
    // berada di dalam galeri.
    root.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowLeft')  { ev.preventDefault(); lompat(-1); }
      else if (ev.key === 'ArrowRight') { ev.preventDefault(); lompat(1); }
    });

    // Berhenti sejenak saat gambar disorot atau dijangkau papan ketik,
    // supaya pengunjung punya waktu melihat rangkaian yang dipilihnya.
    root.addEventListener('mouseenter', henti);
    root.addEventListener('mouseleave', mulai);
    root.addEventListener('focusin', henti);
    root.addEventListener('focusout', mulai);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) henti(); else mulai();
    });

    // Muat gambar sisanya saat peramban menganggur, agar pergantian
    // pertama tidak menampilkan gambar kosong.
    function pramuat() {
      Array.prototype.forEach.call(slides, function (s) {
        var im = s.querySelector('img');
        if (im && im.getAttribute('loading') === 'lazy') {
          im.setAttribute('loading', 'eager');
        }
      });
    }
    if ('requestIdleCallback' in window) window.requestIdleCallback(pramuat);
    else window.setTimeout(pramuat, 1500);

    tampil(0);
    mulai();
  }

  /* ------------------------------------------------------------------
     Siapkan
     ------------------------------------------------------------------ */
  function boot() {
    initWaLinks();
    initNav();
    initCatalog();
    initReveal();
    initImages();
    initHeader();
    initHero();
    // Tanda bahwa skrip inti sudah berjalan. Pengaman di dalam <head>
    // memakai tanda ini untuk memutuskan perlu tidaknya memaksa isi tampil.
    document.documentElement.setAttribute('data-reveal-siap', 'ya');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Dipakai juga oleh skrip lain bila diperlukan
  window.DRFlorist = { waLink: waLink, waNumber: WA_NUMBER };
})();
