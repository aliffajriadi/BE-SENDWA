import fs from "fs";
import path from "path";

// Lokasi file JSON
const filePath = path.join(process.cwd(), "key.json");

/**
 * Membaca file JSON dan mengembalikan array data.
 * Jika file belum ada → return [].
 *
 * Cara pakai:
 *   const data = readJSON();
 */
const readJSON = () => {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return []; // kosong jika file tidak ada
  }
};

/**
 * Menyimpan array data ke file JSON.
 *
 * Cara pakai:
 *   saveJSON([{ id: 1, name: "alif" }]);
 */
const saveJSON = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
};

// =======================================================
//                    CRUD FUNCTIONS
// =======================================================

/**
 * CREATE — Tambah data baru ke file JSON.
 *
 * Cara pakai:
 *   createData({ id: 1, name: "alif" });
 */
export const createData = (newItem) => {
  const data = readJSON();
  data.push(newItem);
  saveJSON(data);
  return newItem;
};

/**
 * READ ALL — Ambil semua isi JSON.
 *
 * Cara pakai:
 *   const semua = readData();
 *   console.log(semua);
 */
export const readData = () => {
  return readJSON();
};

/**
 * READ BY — Cari data berdasarkan field tertentu.
 * 
 * Cara pakai:
 *   readDataBy("id", 1);
 *   readDataBy("name", "alif");
 */
export const readDataBy = (key, value) => {
  const data = readJSON();
  return data.find((item) => item[key] === value) || null;
};

/**
 * UPDATE — Update item berdasarkan key & value tertentu.
 * 
 * Cara pakai:
 *   updateData("id", 1, { name: "fajriadi" });
 * 
 * Catatan:
 * - Hanya field yang diberikan saja yang berubah (partial update)
 */
export const updateData = (key, value, updatedFields) => {
  const data = readJSON();
  const index = data.findIndex((item) => item[key] === value);

  if (index === -1) return null;

  data[index] = {
    ...data[index],
    ...updatedFields,
  };

  saveJSON(data);
  return data[index];
};

/**
 * DELETE — Hapus data berdasarkan key & value.
 * 
 * Cara pakai:
 *   deleteData("id", 1);
 *   deleteData("name", "alif");
 * 
 * Return:
 *   true  → ada data yang dihapus
 *   false → tidak ada data cocok
 */
export const deleteData = (key, value) => {
  const data = readJSON();
  const newData = data.filter((item) => item[key] !== value);

  if (newData.length === data.length) return false;

  saveJSON(newData);
  return true;
};
