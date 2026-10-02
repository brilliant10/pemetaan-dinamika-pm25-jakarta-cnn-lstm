import { BookOpen, CheckCircle, Database, GitMerge, Cpu, BarChart2, Server } from "lucide-react";

export default function MethodologyPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          Dokumentasi Metodologi Riset Skripsi
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Pemetaan Dinamika PM2.5 di Jakarta Melalui Prediksi Spasial-Temporal Menggunakan CNN-LSTM
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
          Halaman ini merangkum secara presisi metodologi penelitian dari <strong>Bab 3 Skripsi</strong>,
          mencakup pipeline data, formula matematis attention, arsitektur 8-layer deep learning, baseline pembanding, serta protokol evaluasi.
        </p>
      </div>

      {/* 1. Sumber & Karakteristik Data */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
          <Database className="w-5 h-5 text-cyan-400" />
          1. Kebutuhan Data &amp; Sumber (Data Acquisition)
        </h2>
        <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed">
          <p>
            Data yang digunakan merupakan deret waktu konsentrasi polutan partikulat halus (<strong>PM2.5</strong> dalam satuan µg/m³) per jam untuk 5 kota di kawasan metropolitan Jabodetabek:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
              <strong className="text-white">DKI Jakarta</strong>
              <div className="text-xs text-slate-400 mt-0.5 font-mono">Lat -6.2088, Lon 106.8456</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
              <strong className="text-white">Kota Bogor</strong>
              <div className="text-xs text-slate-400 mt-0.5 font-mono">Lat -6.5971, Lon 106.8060</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
              <strong className="text-white">Kota Depok</strong>
              <div className="text-xs text-slate-400 mt-0.5 font-mono">Lat -6.4025, Lon 106.7942</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
              <strong className="text-white">Kota Tangerang</strong>
              <div className="text-xs text-slate-400 mt-0.5 font-mono">Lat -6.1783, Lon 106.6319</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
              <strong className="text-white">Kota Bekasi</strong>
              <div className="text-xs text-slate-400 mt-0.5 font-mono">Lat -6.2383, Lon 106.9756</div>
            </div>
          </div>
          <p>
            <strong>Periode Waktu:</strong> 1 Januari 2023 00:00 s/d 31 Juli 2023 23:00 (total <strong>5.088 observasi per kota</strong>).
            Sumber data diambil melalui Open-Meteo Air Quality API. Pendekatan bersifat <em>univariat</em> murni berbasis lag PM2.5 tanpa menyertakan variabel meteorologis tambahan pada model inti.
          </p>
          <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-1.5 text-xs text-amber-200/90">
            <strong className="text-amber-300 font-semibold block">Temuan Karakteristik Spasial API (Catatan Keterbatasan Bab 4/5):</strong>
            <p className="leading-relaxed">
              Open-Meteo Air Quality menggunakan model reanalisis global Copernicus CAMS dengan resolusi spasial ~0.4° × 0.4° (~40 km). Berdasarkan uji empiris, koordinat Jakarta (-6.20°, 106.85°), Bogor (-6.60°, 106.81°), Depok (-6.40°, 106.79°), dan Bekasi (-6.24°, 106.98°) terpetakan pada grid cell reanalisis yang sama (lat ≈ -6.20°, lon ≈ 106.80°). Sedangkan Kota Tangerang (-6.18°, 106.63°) berada di grid cell barat yang berbeda (lon ≈ 106.60°, 99.6% jam berbeda dengan selisih puncak hingga 106.4 µg/m³). Temuan ini didokumentasikan secara transparan sebagai batasan data reanalisis makro dibandingkan sensor mikro-stasiun darat.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Pra-pemrosesan Data */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
          <GitMerge className="w-5 h-5 text-blue-400" />
          2. Pra-pemrosesan &amp; Pipeline Data
        </h2>
        <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Penanganan Nilai Hilang (Missing Values):</strong> Menggunakan interpolasi linier (<em>linear interpolation</em>) secara bertahap pada rentang jam yang terputus, diikuti <em>forward-fill</em> dan <em>backward-fill</em> pada tepi data.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Pencegahan Data Leakage (Min-Max Scaling):</strong> Normalisasi skala [0, 1] di mana nilai x_min dan x_max dihitung <em>hanya</em> dari 70% data latih (training set). Formula:
                <div className="p-2.5 bg-slate-950 rounded-lg font-mono text-cyan-300 my-1.5 text-center text-xs">
                  x_norm = (x - x_min_train) / (x_max_train - x_min_train)
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Pembagian Data Kronologis Ketat (No Shuffle):</strong> 70% Data Latih (~3.561 baris), 15% Data Validasi (~763 baris), dan 15% Data Uji (~764 baris).
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Pembentukan Jendela Waktu (Sliding Window):</strong> Panjang jendela W=24 jam (dengan opsi W=12 atau W=48 jam) untuk memprediksi 1 jam ke depan (y_t+1).
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Arsitektur CNN-LSTM-Attention */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-purple-400" />
          3. Arsitektur Model Deep Learning (8 Layers)
        </h2>
        <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed">
          <p>
            Masing-masing dari 5 kota memiliki model independen dengan konfigurasi 8 layer terintegrasi:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Layer</th>
                  <th className="py-2 px-3">Tipe Komponen</th>
                  <th className="py-2 px-3">Bentuk Output</th>
                  <th className="py-2 px-3">Fungsi / Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                <tr>
                  <td className="py-2 px-3 font-sans text-cyan-400">1</td>
                  <td className="py-2 px-3 text-white">InputLayer</td>
                  <td className="py-2 px-3">(None, 24, 1)</td>
                  <td className="py-2 px-3 font-sans text-slate-400">Jendela riwayat 24 jam PM2.5</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-cyan-400">2</td>
                  <td className="py-2 px-3 text-white">Conv1D</td>
                  <td className="py-2 px-3">(None, 24, 64)</td>
                  <td className="py-2 px-3 font-sans text-slate-400">Ekstraksi fitur pola lokal jangka pendek (kernel=3, ReLU)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-cyan-400">3</td>
                  <td className="py-2 px-3 text-white">MaxPooling1D</td>
                  <td className="py-2 px-3">(None, 12, 64)</td>
                  <td className="py-2 px-3 font-sans text-slate-400">Subsampling reduksi temporal (pool_size=2)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-cyan-400">4</td>
                  <td className="py-2 px-3 text-white">Dropout</td>
                  <td className="py-2 px-3">(None, 12, 64)</td>
                  <td className="py-2 px-3 font-sans text-slate-400">Regularisasi pencegah overfitting (rate=0.2)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-cyan-400">5</td>
                  <td className="py-2 px-3 text-white">LSTM Layer</td>
                  <td className="py-2 px-3">(None, 12, 64)</td>
                  <td className="py-2 px-3 font-sans text-slate-400">Menangkap ketergantungan temporal urutan (units=64)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-cyan-400">6</td>
                  <td className="py-2 px-3 text-white">Scaled Dot-Product Attention</td>
                  <td className="py-2 px-3">(None, 12, 32)</td>
                  <td className="py-2 px-3 font-sans text-slate-400">
                    Membobot ulang langkah waktu paling informatif via Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-cyan-400">7</td>
                  <td className="py-2 px-3 text-white">GlobalAveragePooling1D</td>
                  <td className="py-2 px-3">(None, 32)</td>
                  <td className="py-2 px-3 font-sans text-slate-400">Merangkum sekuens hasil attention menjadi representasi 1D</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-cyan-400">8</td>
                  <td className="py-2 px-3 text-white">Dense Layer</td>
                  <td className="py-2 px-3">(None, 1)</td>
                  <td className="py-2 px-3 font-sans text-slate-400">Estimasi konsentrasi y_t+1 (linear activation)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Model Pembanding & Metrik Evaluasi */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
          <BarChart2 className="w-5 h-5 text-amber-400" />
          4. Model Pembanding (Baselines) &amp; Metrik Evaluasi
        </h2>
        <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed">
          <p>
            Untuk membuktikan signifikansi kontribusi arsitektur CNN-LSTM-Attention, model diuji terhadap dua baseline standar time-series:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300">
            <li>
              <strong>Persistence Model (Naive):</strong> y_hat(t+1) = y(t) (mengasumsikan kondisi 1 jam ke depan identik dengan kondisi saat ini).
            </li>
            <li>
              <strong>Moving Average (MA):</strong> y_hat(t+1) = rata-rata k nilai terakhir dengan k in 3, 6, 12.
            </li>
          </ul>

          <div className="pt-2">
            <strong className="text-white">Protokol Evaluasi:</strong>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                <span className="text-cyan-400 font-bold">Metrik Regresi Kontinu:</span>
                <p className="text-slate-400 text-xs mt-1">
                  Root Mean Squared Error (RMSE), Mean Absolute Error (MAE), dan Mean Absolute Percentage Error (MAPE).
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                <span className="text-amber-400 font-bold">Deteksi Lonjakan Ekstrem (P95 Spike):</span>
                <p className="text-slate-400 text-xs mt-1">
                  Ambang batas persentil ke-95 dihitung dari data latih, dievaluasi melalui Confusion Matrix (TP, FP, FN, TN), Precision, Recall, dan F1-Score.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Deployment Guide */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
          <Server className="w-5 h-5 text-emerald-400" />
          5. Panduan Menjalankan &amp; Deployment Vercel
        </h2>
        <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed">
          <p>
            Sistem ini dibangun dengan arsitektur <em>Dual-Mode Production</em>:
          </p>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-2 font-mono text-xs text-slate-300">
            <div className="text-emerald-400 font-bold font-sans">1. Menjalankan Dashboard Next.js (Lokal):</div>
            <div className="bg-slate-900 p-2 rounded">
              cd frontend<br />
              npm install<br />
              npm run dev
            </div>
            <div className="text-emerald-400 font-bold font-sans mt-3">2. Menjalankan Backend FastAPI (Lokal):</div>
            <div className="bg-slate-900 p-2 rounded">
              uvicorn backend.api.main:app --reload --port 8000
            </div>
            <div className="text-emerald-400 font-bold font-sans mt-3">3. Deploy ke Vercel:</div>
            <div className="text-slate-400 font-sans leading-normal">
              Folder <code className="text-cyan-300">frontend/</code> siap di-push ke GitHub dan di-import langsung di dashboard Vercel dengan Root Directory diset ke <code className="text-cyan-300">frontend</code>. Seluruh data benchmark telah tersedia di <code className="text-cyan-300">frontend/public/data/</code> sehingga aplikasi berjalan 100% tanpa konfigurasi tambahan di Vercel.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
