import prisma from "../config/db.js";

/**
 * CREATE — Tambah data baru ke database.
 */
export const createData = async (newItem) => {
  return await prisma.apiKey.create({
    data: {
      key: newItem.key,    // mapping dari JSON
      owner: newItem.owner,
      token: newItem.token,
      createdAt: newItem.createdAt,
      id : String(newItem.id),
    },
  });
};

/**
 * READ ALL — Ambil semua data.
 */
export const readData = async () => {
  return prisma.apiKey.findMany();
};

/**
 * READ BY — Cari data berdasarkan field tertentu.
 */
export const readDataBy = async (field, value) => {
  return await prisma.apiKey.findFirst({
    where: {
      [field]: value,
    },
  });
};

/**
 * UPDATE — Update data berdasarkan field tertentu.
 */
export const updateData = async (field, value, updatedFields) => {
  return await prisma.apiKey.updateMany({
    where: { [field]: value },
    data: updatedFields,
  });
};

/**
 * DELETE — Hapus data berdasarkan field tertentu.
 */
export const deleteData = async (field, value) => {
  const result = await prisma.apiKey.deleteMany({
    where: { [field]: value },
  });
  return result.count > 0;
};
