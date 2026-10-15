/* ==========================================================================
   D.R Florist : penyalaan awal
   Tanpa pustaka luar, tanpa emoji.

   Berkas ini dimuat TANPA defer di dalam <head>, supaya dua hal terjadi
   sebelum cat pertama layar:

   1. Kelas .js dipasang. CSS memakai .js untuk menyembunyikan isi yang
      akan dianimasikan. Bila kelas ini dipasang setelah cat pertama,
      gambar akan tampak sebentar lalu berkedip hilang sebelum memudar
      masuk kembali.

   2. Pengaman waktu. Bila app.js gagal dimuat atau berhenti di tengah
      jalan, kelas .reveal-paksa dipasang setelah 2,5 detik agar tidak ada
      isi yang tertinggal tak terlihat. app.js menandai dirinya siap lewat
      atribut data-reveal-siap, jadi pengaman ini tidak aktif pada keadaan
      normal.

   Sengaja dipisahkan dari app.js: pengaman ini justru harus tetap berjalan
   ketika app.js gagal, sehingga tidak boleh ikut gagal bersamanya.
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.className += ' js';

  setTimeout(function () {
    if (!document.documentElement.hasAttribute('data-reveal-siap')) {
      document.documentElement.className += ' reveal-paksa';
    }
  }, 2500);
})();
