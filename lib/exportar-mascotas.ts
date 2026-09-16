import "server-only";

import ExcelJS from "exceljs";
import JSZip from "jszip";

import {
  ETIQUETAS_ESPECIE,
  ETIQUETAS_ESTADO,
  ETIQUETAS_SEXO,
  ETIQUETAS_TAMANO,
  FUNDACION,
} from "@/lib/constants";
import { generarQrMascota, nombreArchivoQr, urlFichaMascota, urlQrMascota } from "@/lib/qr";
import type { Mascota } from "@/types";

/**
 * Archivos de exportación del panel de mascotas. Las rutas de
 * `/admin/mascotas/exportar-*` solo validan la sesión y delegan aquí.
 */

/** Zip con el QR de cada mascota, un PNG por ficha. */
export async function generarZipQr(mascotas: Mascota[]): Promise<ArrayBuffer> {
  const zip = new JSZip();
  const usados = new Set<string>();

  for (const mascota of mascotas) {
    // Dos mascotas con el mismo nombre no deben pisarse dentro del zip.
    let archivo = nombreArchivoQr(mascota.nombre);
    for (let n = 2; usados.has(archivo); n++) {
      archivo = nombreArchivoQr(`${mascota.nombre} ${n}`);
    }
    usados.add(archivo);

    zip.file(archivo, await generarQrMascota(mascota.id));
  }

  return zip.generateAsync({ type: "arraybuffer" });
}

/** Excel con una fila por mascota, con enlaces a su ficha y a su QR. */
export async function generarExcelMascotas(mascotas: Mascota[]): Promise<ArrayBuffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = FUNDACION.nombre;
  libro.created = new Date();

  const hoja = libro.addWorksheet("Mascotas", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  hoja.columns = [
    { header: "Nombre", key: "nombre", width: 20 },
    { header: "Especie", key: "especie", width: 10 },
    { header: "Sexo", key: "sexo", width: 10 },
    { header: "Raza", key: "raza", width: 18 },
    { header: "Edad (meses)", key: "edad", width: 13 },
    { header: "Tamaño", key: "tamano", width: 11 },
    { header: "Estado", key: "estado", width: 13 },
    { header: "Esterilizado", key: "esterilizado", width: 12 },
    { header: "Vacunado", key: "vacunado", width: 11 },
    { header: "Fecha de rescate", key: "fechaRescate", width: 16, style: { numFmt: "dd/mm/yyyy" } },
    { header: "Descripción", key: "descripcion", width: 50 },
    { header: "Enlace a su ficha pública", key: "ficha", width: 60 },
    { header: "Enlace a su QR", key: "qr", width: 63 },
  ];

  for (const mascota of mascotas) {
    const ficha = urlFichaMascota(mascota.id);
    const qr = urlQrMascota(mascota.id);

    hoja.addRow({
      nombre: mascota.nombre,
      especie: ETIQUETAS_ESPECIE[mascota.especie],
      sexo: ETIQUETAS_SEXO[mascota.sexo],
      raza: mascota.raza ?? "",
      edad: mascota.edad_meses,
      tamano: mascota.tamano ? ETIQUETAS_TAMANO[mascota.tamano] : "",
      estado: ETIQUETAS_ESTADO[mascota.estado],
      esterilizado: mascota.esterilizado ? "Sí" : "No",
      vacunado: mascota.vacunado ? "Sí" : "No",
      // "2025-03-14" se interpreta como medianoche UTC, que es como ExcelJS
      // escribe las fechas: la celda muestra el mismo día sin desfase.
      fechaRescate: mascota.fecha_rescate ? new Date(mascota.fecha_rescate) : null,
      descripcion: mascota.descripcion ?? "",
      ficha: { text: ficha, hyperlink: ficha },
      qr: { text: qr, hyperlink: qr },
    });
  }

  hoja.getColumn("descripcion").alignment = { wrapText: true, vertical: "top" };
  for (const clave of ["ficha", "qr"]) {
    hoja.getColumn(clave).eachCell((celda, fila) => {
      if (fila > 1) celda.font = { color: { argb: "FF0247B3" }, underline: true };
    });
  }

  // Al final, para que ningún estilo de columna pise la negrita del encabezado.
  hoja.getRow(1).font = { bold: true };

  return libro.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}
