# Pemetaan Dinamika PM2.5 di Jakarta Melalui Prediksi Spasial-Temporal Menggunakan CNN-LSTM

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2+-black.svg?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15+-FF6F00.svg?style=flat&logo=TensorFlow&logoColor=white)](https://tensorflow.org)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black.svg?style=flat&logo=vercel&logoColor=white)](https://vercel.com)

Repositori ini berisi implementasi sistem end-to-end berbasis skripsi:
> **"Pemetaan Dinamika PM2.5 di Jakarta Melalui Prediksi Spasial-Temporal Menggunakan CNN-LSTM"**

Sistem dirancang untuk melakukan peramalan konsentrasi polutan partikulat halus PM2.5 satu jam ke depan ($y_{t+1}$) pada 5 wilayah strategis Jabodetabek (**DKI Jakarta, Kota Bogor, Kota Depok, Kota Tangerang, dan Kota Bekasi**) berdasarkan data historis Januari–Juli 2023.

---

## 1. Ringkasan Arsitektur & Metodologi (Bab 3 Skripsi)

### A. Data & Preprocessing Pipeline
- **Sumber Data:** Open-Meteo Air Quality Historical API (5.088 observasi per jam per kota).
- **Interpolasi Nilai Hilang:** Linear interpolation diikuti *backward/forward fill* untuk batas data.
- **Pencegahan Data Leakage:** Min-Max Scaling $[0, 1]$ di mana nilai $x_{min}$ dan $x_{max}$ dihitung **hanya dari 70% data latih**.
- **Pembagian Data Kronologis (No Shuffle):**
  - **70% Data Latih** (~3.561 baris)
  - **15% Data Validasi** (~763 baris)
  - **15% Data Uji** (~764 baris)
- **Sliding Window Framing:** Jendela waktu $W=24$ jam (tersedia opsi 12, 24, 48 jam) untuk memprediksi 1 jam ke depan ($y_{t+1}$).

### B. Arsitektur Model Deep Learning (8-Layer Keras)
1. **InputLayer:** Shape `(W, 1)`
2. **Conv1D:** 64 filter, kernel size 3, aktivasi ReLU, padding `'same'` (ekstraksi pola temporal lokal).
3. **MaxPooling1D:** Pool size 2 (subsampling & penonjolan fitur).
4. **Dropout:** Rate 0.2 (regularisasi).
5. **LSTM:** 64 unit, `return_sequences=True` (dependensi temporal jangka panjang).
6. **Scaled Dot-Product Attention:**
   $$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$
   Membobot ulang langkah waktu paling informatif sebelum terjadi perubahan tajam konsentrasi PM2.5.
7. **GlobalAveragePooling1D:** Merangkum sekuens menjadi vektor representasi 1D.
8. **Dense Output Layer:** 1 unit linear ($y_{t+1}$ ternormalisasi) yang di-invers kembali ke satuan asli $\mu g/m^3$.

### C. Baseline Pembanding & Protokol Evaluasi
- **Baseline 1:** Persistence Model ($\hat{y}_{t+1} = y_t$).
- **Baseline 2:** Moving Average ($k \in \{3, 6, 12\}$).
- **Metrik Regresi:** RMSE, MAE, MAPE.
- **Deteksi Lonjakan Ekstrem (P95 Spike Detection):**
  - Ambang batas $P_{95}$ dihitung dari data latih.
  - Evaluasi klasifikasi: Confusion Matrix (TP, FP, FN, TN), Precision, Recall, dan F1-Score.

---

## 2. Struktur Direktori Proyek

```
skripsi/
├── backend/                           # Backend Python & ML Pipeline
│   ├── data/
│   │   ├── raw/                       # Dataset mentah CSV per kota (Jan-Jul 2023)
│   │   └── processed/
│   ├── saved_models/                  # Bobot model TensorFlow (.keras) & parameter scaler
│   ├── exports/                       # JSON hasil benchmark
│   ├── src/
│   │   ├── config.py                  # Koordinat 5 kota, rasio split, hyperparams
│   │   ├── data_fetcher.py            # Pengunduh Open-Meteo API + fallback otomatis
│   │   ├── preprocessor.py            # Linear interpolation, MinMax scaler, sliding window
│   │   ├── model.py                   # Arsitektur 8-layer CNN-LSTM-Attention
│   │   ├── baselines.py               # Persistence & Moving Average (k=3, 6, 12)
│   │   ├── evaluator.py               # RMSE, MAE, MAPE, dan P95 Spike Detection
│   │   ├── predictor.py               # Engine inferensi satu langkah ke depan
│   │   └── train.py                   # Skrip training 5 kota & ekspor JSON
│   ├── api/
│   │   └── main.py                    # Endpoint FastAPI (/api/cities, /api/metrics, /api/predict)
│   ├── Dockerfile                     # Siap deploy ke Render / Hugging Face Spaces
│   ├── requirements.txt               # Dependensi Python backend
│   └── test_pipeline.py               # Unit test otomatis pipeline
│
└── frontend/                          # Dashboard Next.js (App Router, Tailwind CSS, Recharts)
    ├── public/
    │   └── data/                      # Data benchmark statis (siap Vercel Zero-Config)
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx             # Root layout & navbar
    │   │   ├── page.tsx               # Dashboard utama: peta, metrik, grafik time series
    │   │   ├── spikes/page.tsx        # Studio deteksi lonjakan ekstrem P95
    │   │   ├── predict/page.tsx       # Playground simulator 1 jam ke depan
    │   │   └── methodology/page.tsx   # Dokumentasi lengkap Bab 3 skripsi
    │   ├── components/                # Komponen UI modular
    │   └── lib/                       # Types & dual-mode API bridge
    ├── package.json
    ├── tailwind.config.js
    └── vercel.json                    # Konfigurasi deployment Vercel
```

---

## 3. Panduan Menjalankan Sistem Secara Lokal

### Prasyarat:
- Python 3.10+
- Node.js 18+ & npm

### Langkah 1: Setup Backend & Uji Pipeline
```bash
# Masuk ke direktori root proyek
cd skripsi

# Install dependensi backend
pip install -r backend/requirements.txt

# Jalankan Unit Test untuk memverifikasi pipeline
python backend/test_pipeline.py

# Latih model untuk ke-5 kota Jabodetabek (otomatis mengekspor data benchmark ke frontend)
python backend/src/train.py --epochs 18 --batch_size 32

# Jalankan Backend FastAPI Server
uvicorn backend.api.main:app --reload --port 8000
```
Akses dokumentasi Swagger API di: `http://localhost:8000/docs`

### Langkah 2: Setup Frontend Dashboard
```bash
# Buka terminal baru dan masuk ke folder frontend
cd frontend

# Install package npm
npm install

# Jalankan local development server
npm run dev
```
Buka peramban di: `http://localhost:3000`

---

## 4. Panduan Deployment ke Vercel

Sistem ini dirancang dengan arsitektur **Dual-Mode Zero-Config** agar dapat di-deploy ke Vercel secara instan:

1. **Push Proyek ke GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: complete PM2.5 CNN-LSTM-Attention forecasting system"
   git branch -M main
   git remote add origin <URL_REPOSITORY_ANDA>
   git push -u origin main
   ```

2. **Deploy di Vercel**:
   - Masuk ke dashboard [vercel.com](https://vercel.com).
   - Klik **"Add New Project"** dan pilih repositori Anda.
   - Pada pengaturan **Root Directory**, pilih: `frontend`.
   - Biarkan Build Command (`next build`) dan Output Directory secara default.
   - (Opsional) Jika Anda mendeploy backend FastAPI ke Render / Hugging Face Spaces, tambahkan Environment Variable:
     - `NEXT_PUBLIC_API_URL` = `https://url-backend-anda.onrender.com`
     - Jika variabel ini tidak diisi, frontend akan otomatis menggunakan dataset benchmark skripsi yang telah tersedia di `frontend/public/data/` secara **100% fungsional**.
   - Klik **"Deploy"**.

3. **Deploy Backend ke Render / Hugging Face Spaces (Opsional untuk Live Inference API)**:
   - Hubungkan repositori ke **Render.com** (pilih Web Service -> Docker Environment).
   - Arahkan ke `backend/Dockerfile`.
   - Set Port ke `8000`.
