import { GoogleGenAI } from '@google/genai';
import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return res.status(503).json({
      success: false,
      error: 'GEMINI_API_KEY belum dikonfigurasi pada backend.',
    });
  }

  try {
    const { metrics = {}, locationName = 'Semua Lokasi', dateStr = 'Hari Ini' } = req.body ?? {};
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Anda adalah Asisten Eksekutif Peternakan Profesional untuk aplikasi TERNAK MONITOR.
Buat ringkasan singkat, faktual, profesional, dan dalam Bahasa Indonesia berdasarkan data berikut.

Tanggal: ${dateStr}
Lokasi: ${locationName}
Populasi aktif: ${metrics.totalActive ?? 0}
Sehat: ${metrics.healthy ?? 0}
Sakit: ${metrics.sick ?? 0}
Isolasi: ${metrics.isolation ?? 0}
Kelahiran: ${metrics.births ?? 0}
Kematian: ${metrics.deaths ?? 0}
Pembelian: ${metrics.purchases ?? 0}
Penjualan: ${metrics.sales ?? 0}
Pemasukan: Rp ${Number(metrics.income ?? 0).toLocaleString('id-ID')}
Pengeluaran: Rp ${Number(metrics.expenses ?? 0).toLocaleString('id-ID')}
Laba/rugi bersih: Rp ${Number(metrics.netProfit ?? 0).toLocaleString('id-ID')}
Laporan masuk: ${metrics.submittedReports ?? 0} dari ${metrics.totalLocations ?? 0} lokasi
Peringatan belum dibaca: ${metrics.alertsCount ?? 0}

Gunakan judul "Ringkasan Peternakan — ${dateStr}", lalu 5–8 poin penting dan satu rekomendasi tindak lanjut.
Jangan membuat diagnosis medis atau menambahkan fakta yang tidak tersedia.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return res.json({
      success: true,
      summary: response.text || 'Ringkasan tidak tersedia.',
    });
  } catch (error) {
    console.error('Owner daily brief error:', error);
    return res.status(502).json({
      success: false,
      error: 'Gagal menghasilkan ringkasan harian AI.',
    });
  }
});

export default router;
