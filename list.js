// Daftar kata kotor
const kataKotor = [
  "kontol",
  "kntol",
  "kntl",
  "memek",
  "mmk",
  "anjing",
  "anjg",
  "ajg",
  "babi",
  "goblok",
  "gblk",
  "gblg",
  "tolol",
  "tll",
  "tololl",
  "bangsat",
  "bgst",
  "bangs",
  "ashu",
  "pepek",
  "ppk",
  "pepk",
  "jembut",
  "jmbt",
  "jmbut",
  "pantek",
  "pantk",
  "pntk",
  "puki",
  "pky",
  "pqi",
  "puqi",
  "ngentot",
  "ngntt",
  "ngentod",
  "ngntd",
  "kentod",
  "kntd",
  "kimak",
  "woy",
  "wkwk",
  "wlee", // bisa kamu sesuaikan, kalau 'we' dianggap kasar
];

const simpleReplies = {
  ".ping": "Pong!",
  ".hai": "Halo! Aku adalah bot whatsapp yang dibuat oleh Alif Fajriadi",
  ".halo": "Halo! Aku adalah bot whatsapp yang dibuat oleh Alif Fajriadi",
  iya: "Ketik .menu untuk cek menu",
  apa: "Ketik .menu untuk cek menu",
  ya: "Ketik .menu untuk cek menu",
  dc: "ayo aja gw mah 😁",
  "dc kuy": "ayo aja gw mah 😁",
  "ayok dc": "ayo aja gw mah 😁",
  "kuy dc": "ayo aja gw mah 😁",
  "dc we": "ayo aja gw mah 😁",
  "dc lee": "ayo aja gw mah 😁",
  "dc le": "ayo aja gw mah 😁",
  padim: "tekno le",
  "tamor": "tamor trusss kuntulll"
};
const jadwal = {
  ".senin": `📌 *Senin - IF 2D*
  
  1. DRPL - UM - Online  
  🕘 07.‌50 sd 08.‌40  
  ====================
  2. PBO - HW - Online  
  🕘 08.‌40 sd 10.‌20  
  ====================
  3. PROWEB - DE - Online  
  🕘 10.‌20 sd 12.‌00  
  ====================
  4. Basis Data - DW - Online  
  🕘 13.‌40 sd 15.‌20`,

  ".selasa": `📌 *Selasa - IF 2D*
  
  1. Jaringan Komputer - DP - Online  
  🕘 07.‌50 sd 09.‌30  
  ====================
  2. Pembuatan Prototype - MS - GU 805  
  🕘 12.‌50 sd 16.‌10`,

  ".rabu": `📌 *Rabu - IF 2D*
  
  1. Basis Data (Prak) - BN - GU 702  
  🕘 10.‌20 sd 12.‌50`,

  ".kamis": `📌 *Kamis - IF 2D*
  
  1. PBO (Prak) - BN - GU 702  
  🕘 07.‌50 sd 09.‌30  
  ====================
  2. PROWEB (Prak) - NN - GU 805  
  🕘 10.‌20 sd 12.‌10  
  ====================
  3. Jaringan Komputer (Prak) - DP - TA 10.3  
  🕘 13.‌40 sd 17.‌00`,

  ".jumaat": `📌 *Jumat - IF 2D*
  
  1. DRPL (Prak) - UM - GU 704  
  🕘 07.‌50 sd 10.‌20  
  ====================
  2. BIngKom - BY - GU 701  
  🕘 14.‌30 sd 17.‌00`,
};



// OSC 2025 ================================================================================
const panduan = {
  mascot: `2 | Mascot Design

A. Deskripsi Lomba
Lomba Desain Maskot merupakan salah satu cabang kompetisi dalam rangkaian Open Source Competition (OSC) 2025, yang berfokus pada tantangan kreativitas individu dalam menciptakan karakter maskot yang orisinal dan menarik. Maskot yang dibuat diharapkan mampu merepresentasikan semangat, nilai-nilai, atau karakter dari dunia open source maupun komunitas teknologi secara visual. Lomba ini terbuka untuk umum dan dapat diikuti oleh siapa saja yang memiliki ketertarikan di bidang desain grafis.

B. Timeline
• Pendaftaran: 29 Juli – 4 Agustus 2025
• Technical Meeting: 5 Agustus 2025
• Pengerjaan dan Deadline Submit Design: 5 - 14 Agustus 2025
• Upload Instagram: 15 - 16 Agustus 2025
• Presentasi Hasil Design: 17 Agustus 2025

C. Mekanisme Pendaftaran
1. Periode pendaftaran OSC 2025 akan dibuka mulai tanggal 29 Juli – 4 Agustus 2025 pukul 23.59 WIB.
2. Seluruh peserta wajib mengisi data diri secara lengkap pada formulir pendaftaran yang tersedia melalui link berikut: https://polibatam.id/osc2025.
3. Tim yang telah melengkapi seluruh berkas pendaftaran akan melalui proses verifikasi oleh panitia dalam waktu maksimal 2x24 jam (2 hari kerja).
4. Jika belum ada konfirmasi dalam waktu tersebut, peserta dapat menghubungi contact person atau menyampaikan kendala melalui grup WhatsApp resmi OSC 2025.

D. Peraturan Lomba
1. Peserta merupakan individu (1 orang) dan terbuka untuk umum.
2. Wajib mendaftar sesuai jadwal yang ditentukan.
3. Wajib mengikuti Technical Meeting (tema lomba diumumkan saat TM).
4. Wajib bergabung di grup WhatsApp resmi (tautan tersedia di formulir pendaftaran).
5. Wajib mengikuti akun Instagram @batamlinux.
6. Karya tidak mengandung unsur SARA, pornografi, politik, kekerasan, atau provokasi.
7. Karya harus orisinal, belum pernah dipublikasikan atau diikutkan lomba lain.
8. Bebas menggunakan aplikasi desain apapun.
9. Setiap peserta hanya boleh mengirimkan satu karya.
10. Hak cipta atas karya yang dikumpulkan menjadi milik penuh panitia (BLUG).
11. Keputusan juri bersifat mutlak dan tidak dapat diganggu gugat.

E. Mekanisme Perlombaan
1. Tema diumumkan saat Technical Meeting pada tanggal 5 Agustus 2025.
2. Pengerjaan desain berlangsung selama 8 hari dari tanggal 6 Agustus – 14 Agustus 2025.
3. Desain harus diunggah ke Instagram peserta dan dikirim ke link pengumpulan (dibagikan saat Technical Meeting).
4. Waktu upload Instagram mulai dari tanggal 15 dan berakhir pada tanggal 16 Agustus 2025 pukul 23.59 WIB.
5. Presentasi offline diadakan pada 17 Agustus 2025 menggunakan file PPT.

F. Format Pengiriman
A. Format File Desain
• File PNG
Format nama : namapeserta.png (Contoh: kamisatoayato.png)
• File PDF (penjelasan tentang desain)
Format nama : namapeserta.pdf (Contoh: kamisatoayato.pdf)
• File Mentah (Raw)
Format asli sesuai software (.ai, .cdr, .eps, dll)

B. Ketentuan Isi PDF
• Gambar desain maskot di bagian atas
• Penjelasan konsep (maks. 150 kata)
• Format A4, font Arial, spasi 1.5

C. Format ZIP
• Nama: namapeserta.zip
• Contoh: kamisatoayato.zip
• Deadline: 14 Agustus 2025, pukul 23.59 WIB

G. Ketentuan Upload Instagram
• Tanggal Upload dimulai dari tanggal 15 – 16 Agustus 2025 (maks. pukul 23.59 WIB)
• Wajib tag @batamlinux
• Caption berisi deskripsi konsep desain
• Gunakan hashtag: #OSC2025 #DesainMaskotOSC2025 #BLUG #BatamLinux #Indonesia #GoOpenSource
• Akun tidak boleh di-private

H. Ketentuan Presentasi Offline
A. Format PPT (3–6 Slide)
• Slide 1: Judul + Nama Peserta + Judul Maskot
• Slide 2: Tampilan Desain (boleh PNG full)
• Slide 3: Penjelasan Konsep
• Slide 4–6 (opsional): Detail tambahan seperti warna, simbol, gaya, inspirasi

B. Pengumpulan PPT
• Dikirim terpisah (tidak perlu dimasukkan ZIP)
• Upload ke Google Drive (link disediakan saat TM)
• Pastikan akses: Anyone with the link can view

I. Pelaksanaan Lomba
• Technical Meeting: Online, 5 Agustus 2025
• Tahap Desain: Online, 6 – 14 Agustus 2025
• Presentasi: Offline, 17 Agustus 2025

J. Kriteria Penilaian
1. Kesesuaian dengan Tema
2. Orisinalitas
3. Konsep desain
4. Estetika dan kreativitas

K. Contact Person
1. Miftahur Rahmah (+62 857-6354-2044)
2. Ibnu (+62 896-2325-6645)

J. Biaya Lomba
Peserta Wajib membayar 15K ,
Pembayaran:
082287690013 a.s NAYLAH AMIRAH AZ ZIKRA (Dana)

`,
  netsim: `2 | Network Simulation

A. Deskripsi Lomba
Network Simulation merupakan salah satu cabang lomba dari Open Source
Competition (OSC) yang bertujuan untuk menguji kemampuan peserta dalam
merancang dan mensimulasikan jaringan komputer secara efisien menggunakan
Cisco Packet Tracer.

B. Timeline

 Pendaftaran: 29 Juli – 15 Agustus 2025
 Technical Meeting: 13 Agustus 2025
 Hari-H: 16 Agustus 2025

C. Mekanisme Pendaftaran

1. Periode pendaftaran OSC 2025 akan dibuka mulai tanggal 29 Juli - 15 Agustus
2025 pukul 23.59 WIB.
2. Seluruh peserta wajib mengisi data diri secara lengkap pada formulir
pendaftaran yang tersedia melalui link berikut: https://polibatam.id/osc2025.
3. Tim yang telah melengkapi seluruh berkas pendaftaran akan melalui proses
verifikasi oleh panitia dalam waktu maksimal 2x24 jam (2 hari kerja).
4. Jika belum ada konfirmasi dalam waktu tersebut, peserta dapat menghubungi
contact person atau menyampaikan kendala melalui grup WhatsApp resmi OSC
2025.

3 | Network Simulation

D. Peraturan Lomba
1. Peserta wajib melakukan pendaftaran sesuai dengan jadwal yang telah
ditentukan oleh panitia.
2. Seluruh peserta diwajibkan mengikuti Technical Meeting pada waktu yang telah
ditentukan.
3. Peserta wajib bergabung di grup WhatsApp resmi, yang tautannya tersedia di
formulir pendaftaran, untuk mendapatkan informasi dan pengumuman terkait
lomba.
4. Semua simulasi dan konfigurasi harus dilakukan menggunakan cisco packet
tracer.
5. Kompetisi ini bersifat individu. setiap bentuk plagiarisme atau penggunaan
materi yang tidak sah akan mengakibatkan diskualifikasi.
6. Peserta harus menyerahkan solusi dan dokumentasi sebelum batas waktu yang
ditentukan. Tidak ada perpanjangan waktu yang akan diberikan setelah batas
waktu berakhir.
7. Keputusan juri bersifat final dan tidak dapat diganggu gugat.
8. Peserta wajib untuk mengikuti akun Instagram resmi @batamlinux.

E. Mekanisme Perlombaan
1. Verifikasi peserta saat registrasi ulang di lokasi lomba.
2. Sesi briefing untuk menjelaskan aturan, kriteria penilaian, dan skenario lomba.

4 | Network Simulation

3. Peserta menerima studi kasus atau skenario simulasi jaringan yang harus
diselesaikan.
4. Peserta tidak perlu membawa laptop
5. waktu pengerjaan dibatasi sesuai durasi yang ditentukan.
6. Panitia memonitor peserta dan menyediakan bantuan teknis jika diperlukan.
7. Peserta menyerahkan hasil pekerjaan sesuai format dan ketentuan yang
dijelaskan saat technical meeting.
8. Hasil pekerjaan dinilai berdasarkan efektivitas, efisiensi, dan kreativitas solusi.
9. Pemenang diumumkan pada acara penutupan dan diberikan sertifikat, hadiah,
serta penghargaan.
10. Sesi tanya jawab dan evaluasi setelah pengumuman pemenang.

F. Ketentuan Peserta
1. Kompetisi terbuka untuk siswa/i sma/k sederajat.
2. Kompetisi bersifat individu.
3. Peserta wajib membawa KTP/Kartu pelajar/Tanda pengenal, untuk verifikasi
identitas.
4. Formulir pendaftaran harus diisi dengan lengkap dan benar.
5. Peserta harus memiliki pengetahuan dasar tentang jaringan komputer,
perangkat lunak open source, serta kemampuan menggunakan Cisco Packet
Tracer untuk implementasi.
6. Peserta tidak perlu membawa laptop sendiri karena perangkat akan disediakan
oleh panitia.

5 | Network Simulation

7. Setiap peserta wajib mengikuti technical meeting sebelum kompetisi dimulai,
yang akan menjelaskan perlengkapan teknis dan peraturan tambahan.
8. Keputusan juri bersifat final dan tidak dapat diganggu gugat.
9. Kompetisi akan dilaksanakan secara offline di Politeknik Negeri Batam.
10. Peserta akan diberikan studi kasus atau skenario simulasi jaringan yang harus
diselesaikan dalam waktu yang ditentukan.
11. Peserta harus mampu merancang topologi jaringan, mengonfigurasi perangkat
jaringan, dan memecahkan masalah yang muncul.
12. Peserta diharapkan menjaga etika dan disiplin selama kompetisi berlangsung.
13. Dilarang keras melakukan kecurangan atau tindakan yang merugikan peserta
lain.
14. Pemenang akan mendapatkan sertifikat, hadiah, dan penghargaan dari blug.
15. Semua peserta yang mengikuti kompetisi akan mendapatkan sertifikat
partisipasi.
16. Informasi lebih lanjut tentang kompetisi dapat dilihat di instagram blug.
17. Peserta diharapkan mengenakan pakaian jurusan sekolah atau baju batik
selama acara berlangsung.

G. Spesifikasi Alat
• PC lengkap dengan aplikasinya sudah disediakan.
• Kertas sudah disediakan.
• Pena silahkan dibawa oleh masing-masing peserta.

6 | Network Simulation

H. Kriteria Penilaian
1. Efektivitas solusi
2. Masalah yang diselesaikan
3. Waktu pengerjaan

I. Contact Person
1. Syahdan Arif (+62 812-700-3162)
2. Shafiq (+62 859-7421-2462)

J. Biaya Lomba
Peserta Wajib membayar 15K ,
Pembayaran:
082287690013 a.s NAYLAH AMIRAH AZ ZIKRA (Dana)
`,
  webdesign: `Web Design

A. Deskripsi Lomba
Web Design adalah ajang bergengsi bagi siswa/i SMA/SMK sederajat untuk
menunjukkan keahlian mereka dalam bidang desain antarmuka web (front-end).
Peserta akan menghadapi tantangan untuk merancang dan membangun tampilan
web berbasis studi kasus yang diberikan.
Tujuan dari kompetisi ini adalah untuk:
● Mendorong penggunaan perangkat lunak open source.
● Mengembangkan keterampilan desain web yang dibutuhkan di dunia kerja.
● Meningkatkan kreativitas, efisiensi, dan ketepatan peserta dalam
menyelesaikan tantangan desain web.

B. Timeline
 Pendaftaran: 29 Juli - 15 Agustus 2025
 Technical Meeting: 13 Agustus 2025
 Hari-H: 16 Agustus 2025

C. Mekanisme Pendaftaran
1. Periode pendaftaran OSC 2025 akan dibuka mulai tanggal 29 Juli - 15 Agustus
2025 pukul 23.59 WIB.

3 | Web Design

2. Seluruh peserta wajib mengisi data diri secara lengkap pada formulir
pendaftaran yang tersedia melalui link berikut: https://polibatam.id/osc2025.
3. Tim yang telah melengkapi seluruh berkas pendaftaran akan melalui proses
verifikasi oleh panitia dalam waktu maksimal 2x24 jam (2 hari kerja).
4. Jika belum ada konfirmasi dalam waktu tersebut, peserta dapat menghubungi
contact person atau menyampaikan kendala melalui grup WhatsApp resmi OSC
2025.

D. Peraturan Lomba
1. Dilarang menggunakan AI untuk menyelesaikan soal. Jika terbukti melakukan
pelanggaran, peserta akan didiskualifikasi.
2. Dilarang mengaktifkan koneksi internet (WiFi).
3. Peserta menggunakan PC yang telah disediakan panitia.
4. Kompetisi khusus front-end menggunakan HTML dan CSS native.
5. Lomba berlangsung selama 2 jam sesuai dengan jadwal.
6. Keputusan juri bersifat final dan tidak dapat diganggu gugat.

E. Mekanisme Perlombaan

1. Verifikasi peserta dilakukan saat registrasi ulang di lokasi lomba.
2. Peserta mengikuti briefing teknis untuk memahami aturan dan studi kasus.
3. Peserta menerima studi kasus desain web untuk diselesaikan.
4. Tidak perlu membawa laptop, semua alat disediakan panitia.

4 | Web Design

5. Pengerjaan dibatasi dalam jangka waktu tertentu.
6. Panitia akan memonitor dan memberi bantuan teknis jika diperlukan.
7. Peserta menyerahkan hasil desain sesuai format yang ditentukan.
8. Pemenang diumumkan di acara penutupan dan akan mendapatkan:
• Medali
• Piala
• Sertifikat
• Hadiah

F. Kriteria Penilaian
1. Akurasi visual/output
2. Kecepatan waktu pengerjaan

G. Contact Person
1. Tomingse (+62 813-6236-3862)
2. Michael (+62 896-1230-5260)

Biaya Lomba
Peserta Wajib membayar 15K ,
Pembayaran:
082287690013 a.s NAYLAH AMIRAH AZ ZIKRA (Dana)`,
  sysadmin: `Linux System Administration

A. Deskripsi Lomba
Lomba Linux System Administrator adalah ajang bergengsi bagi siswa/i SMA/K
sederajat untuk menunjukkan keahlian mereka dalam bidang administrasi sistem
menggunakan perangkat lunak open source. Peserta akan menghadapi tantangan
untuk mengelola, mengonfigurasi, dan memecahkan masalah sistem operasi serta
jaringan komputer dalam skenario tertentu. Kompetisi ini tidak hanya menguji
pengetahuan teknis, tetapi juga kemampuan analitis.
Tujuan dari kompetisi ini adalah untuk mendorong penggunaan perangkat lunak
open source dan membantu siswa mengembangkan keterampilan yang dibutuhkan
di dunia kerja.

B. Timeline
 Pendaftaran: 29 Juli – 15 Agustus 2025
 Technical Meeting: 13 Agustus 2025
 Hari-H: 16 Agustus 2025

C. Gambaran Umum
Peserta diharapkan mampu mengelola sistem berbasis Linux secara menyeluruh
mulai dari instalasi, manajemen pengguna, konfigurasi sistem, jaringan, layanan,
hingga penggunaan container dan otomasi.

3 | Linux System Administration

1. Memahami alat dan perintah penting linux
• Membuka terminal shell dan mengetikkan perintah yang mengikuti sintaks
yang tepat.
• Mengarahkan input ke output dengan >, >>, |, 2>, dll.
• Untuk memeriksa teks, gunakan grep dan ekspresi reguler.
• Memanfaatkan SSH, mendapatkan akses ke sistem yang jauh.
• Mengakses target multiuser dengan masuk dan berpindah-pindah pengguna.
• Membuat dan memodifikasi file teks.
• Membuat, menghapus, menduplikasi, dan merelokasi file dan direktori.
• Membuat daftar, memodifikasi, dan mengatur izin ugo/rwx default.
• Menemukan, membuka, dan menggunakan dokumentasi man, info, dan
sistem file .
2. Manajemen pengguna dan grup
• Membuat, menghapus, dan mengubah akun pengguna secara lokal dan
menetapkan kata sandi.
• Membuat, menghapus, dan mengubah keanggotaan dalam grup utama atau
tambahan.
• Membuat, menghapus, dan mengubah keanggotaan dalam grup.
• Mencegah penghapusan direktori oleh user selain owner.

4 | Linux System Administration

• Memberikan akses spesifik ke file penting seperti /etc/passwd.
3. Bash Scripting
• Menulis dan memperbaiki bash script yang interaktif dan fungsional.
• Menyimpan script di /usr/local/bin/ agar dapat diakses semua user.
4. Menerapkan, mengonfigurasi, dan memelihara sistem
• Menjadwalkan pekerjaan, menggunakan cronjob.
• Mengedit bootloader sistem.
5. Manajemen Partisi dan LVM
• Membuat partisi biasa dan partisi berbasis LVM.
• Membuat physical volume, volume group, dan logical volume.
• Mount ke direktori spesifik dan buat mount persistent.
• Mengatur kepemilikan (owner) dan permission direktori hasil mount.
5. Mengelola kontainer
• Temukan dan dapatkan gambar kontainer dari registri lokal.
• Memeriksa jaringan dan citra container.
• Menggunakan docker untuk mengelola container.
• Melaksanakan tugas manajemen kontainer sederhana, seperti
mendaftarkan kontainer yang sedang berjalan.

5 | Linux System Administration

• kontainer yang sedang berjalan dan memulai, menghentikan, dan
menghentikannya.
• Memanfaatkan layanan di dalam kontainer.
• Menyiapkan kontainer sebagai layanan sistemd yang diluncurkan secara
otomatis.
• Melampirkan kontainer ke penyimpanan persisten.
6. Docker dan Kontainerisasi
• Menarik project dari GitHub dan membangun image dengan Dockerfile.
• Menjalankan container menggunakan image yang telah dibuat.
• Memastikan layanan berjalan di port tertentu dan bisa diakses.
• Menggunakan container sebagai service systemd dan storage persistensi.
7. NFS dan AutoFS
• Ekspor direktori dari machine1 via NFS dan akses dari machine2.
• Mengatur AutoFS di machine2 agar mount otomatis dari server.
• Menjaga struktur direktori dan izin akses sesuai ketentuan soal.
8. Cronjob dan Logging
• Mengaktifkan logging SSH.
• Membuat cronjob harian untuk membackup log ke direktori backup.
• Mengelola file log agar terjadwal secara otomatis dan efisien.

6 | Linux System Administration

9. Otomatisasi dengan Ansible
• Menulis file inventory dengan struktur benar.
• Menjalankan ad-hoc command dan playbook untuk semua atau sebagian
host.
• Memverifikasi konektivitas dan privilege sudo.
• Menyesuaikan playbook agar hanya menjalankan task tertentu pada host
tertentu.

D. Mekanisme Pendaftaran
1. Periode pendaftaran OSC 2025 akan dibuka mulai tanggal 29 Juli – 15 Agustus
2025 pukul 23.59 WIB.
2. Seluruh peserta wajib mengisi data diri secara lengkap pada formulir
pendaftaran yang tersedia melalui link berikut: https://polibatam.id/osc2025.
3. Tim yang telah melengkapi seluruh berkas pendaftaran akan melalui proses
verifikasi oleh panitia dalam waktu maksimal 2x24 jam (2 hari kerja).
4. Jika belum ada konfirmasi dalam waktu tersebut, peserta dapat menghubungi
contact person atau menyampaikan kendala melalui grup WhatsApp resmi OSC
2025.

7 | Linux System Administration

E. Peraturan Lomba
1. Peserta harus mengenakan pakaian sopan dan rapi. (Tidak diperkenankan
memakai celana pendek untuk pria atau rok mini untuk wanita.)
2. Peserta wajib membawa salah satu kartu identitas, seperti KTP, SIM, atau Kartu
Pelajar.
3. Peserta wajib membawa alat tulis pribadi (pulpen, pensil, dll).
4. Barang yang diperbolehkan dibawa masuk hanya kartu identitas dan alat tulis.
5. Dilarang membawa perangkat elektronik, catatan, atau materi bantu lainnya.
6. Peserta dilarang berbicara, bekerja sama, atau mengganggu peserta lain
selama kompetisi.
7. Peserta dilarang mengakses internet, merusak sistem, atau mengubah
konfigurasi jaringan yang disediakan.
8. Peserta dilarang meninggalkan ruangan selama kompetisi berlangsung.
9. Peserta yang melanggar aturan dapat didiskualifikasi.

F. Mekanisme Perlombaan
1. Peserta wajib hadir di depan ruang kompetisi minimal 15 menit sebelum waktu
mulai.
2. Setelah dipanggil, peserta masuk ke ruang kompetisi dan duduk sesuai arahan
proctor.
3. Peserta diberikan waktu 10–15 menit untuk persiapan awal.

8 | Linux System Administration

4. Setelah semua siap, proctor akan memberikan aba-aba "mulai", dan kompetisi
dimulai.
5. Waktu pengerjaan adalah 2 jam sejak aba-aba dimulai.
6. Selama kompetisi, peserta mengerjakan tantangan hands-on yang telah
disiapkan panitia.
7. Jika peserta selesai lebih awal, mereka harus melapor ke proctor untuk validasi
penyelesaian.
8. Peserta baru dapat meninggalkan ruangan setelah hasil divalidasi dan
diserahkan dengan benar.
9. Penilaian dilakukan 1 kali; peserta tidak dapat mengubah hasil setelah dinilai.
10. Jika nilai peserta sama, maka waktu submit tercepat digunakan sebagai
penentu pemenang.

G.Perangkat yang Digunakan untuk Kompetisi (Disediakan
oleh Panitia)
• CPU: i7 5th Gen or Equivalent
• RAM: 8 GB
• Storage: 20 GB free space
• Support virtualization using VMware or VirtualBox with VT-X nested VM enable

9 | Linux System Administration

H. Format Kompetisi
Kompetisi ini akan mengutamakan kegiatan hands-on, dimana peserta akan
diberikan tantangan konfigurasi yang sering dilakukan di dunia system
administrator. Kegiatan ini akan memakan waktu kurang lebih 2 jam dengan
lingkungan kompetisi yang akan ditangani oleh proctor. Adapun selama kompetisi
berlangsung, peserta tidak diperbolehkan membawa salinan materi apapun,
peserta dilarang keluar sebelum kompetisi selesai, peserta tidak diperkenankan
berbicara dengan peserta lain selama kompetisi berjalan, peserta wajib membawa
kartu identitas seperti KTP/SIM/Kartu Pelajar dan juga pulpen ke dalam ruangan
kompetisi, dilarang merubah jalur Local Network yang telah disiapkan.

I. Kriteria Penilaian
Peserta yang telah selesai mengerjakan tantangan kompetisi akan langsung dinilai
dengan satu kali penilaian, dalam artian setelah penilaian, peserta tidak lagi dapat
mengubah penilaian kompetisi untuk kedua kalinya. Rentang penilaian
kemenangan kompetisi ini diukur dari skor 1-100 poin. Persentase minimum untuk
mencapai nilai kelulusan adalah 70% atau 70 poin. Nilai akan dikumpulkan secara
proctored dan nantinya akan dirangking hingga peserta dengan poin tertinggi, jika
terdapat peserta dengan poin tinggi dan nilai yang sama, maka akan dilihat dari
waktu pengiriman nilai tercepat.

10 | Linux System Administration

J. Contact Person
1. Nohiro (+62 815-3435-2009)
2. Numa (+62 895-3706-77717)

Biaya Lomba
Peserta Wajib membayar 15K ,
Pembayaran:
082287690013 a.s NAYLAH AMIRAH AZ ZIKRA (Dana)
`
}


export { kataKotor, jadwal, simpleReplies, panduan }