import sys
import logging
from backend.src.data_fetcher import fetch_all_cities
from backend.src.config import DATA_RAW_DIR
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

logger.info("Executing force refresh download from Open-Meteo API for all 5 cities...")
results = fetch_all_cities(force_refresh=True)

logger.info("\n=== VERIFIKASI DATASET 5 KOTA JABODETABEK ===")
summary = []
for city_key, df in results.items():
    s = {
        "city": city_key,
        "records": len(df),
        "mean_pm25": round(float(df["pm2_5"].mean()), 3),
        "min_pm25": round(float(df["pm2_5"].min()), 3),
        "max_pm25": round(float(df["pm2_5"].max()), 3),
        "std_pm25": round(float(df["pm2_5"].std()), 3),
        "sample_head": df["pm2_5"].head(3).tolist(),
        "sample_tail": df["pm2_5"].tail(3).tolist()
    }
    summary.append(s)
    logger.info(
        f"[{city_key.upper()}] Rows: {s['records']} | Mean: {s['mean_pm25']} | "
        f"Min: {s['min_pm25']} | Max: {s['max_pm25']} | Std: {s['std_pm25']}"
    )

# Forensic pairwise difference check
logger.info("\n=== ANALISIS PAIRWISE PERBEDAAN ANTAR KOTA (5.088 JAM) ===")
cities = list(results.keys())
for i in range(len(cities)):
    for j in range(i + 1, len(cities)):
        c1, c2 = cities[i], cities[j]
        diff = (results[c1]["pm2_5"] != results[c2]["pm2_5"]).sum()
        abs_diff_max = (results[c1]["pm2_5"] - results[c2]["pm2_5"]).abs().max()
        abs_diff_mean = (results[c1]["pm2_5"] - results[c2]["pm2_5"]).abs().mean()
        logger.info(
            f"{c1.capitalize()} vs {c2.capitalize()}: "
            f"Jumlah Jam Berbeda = {diff}/{len(results[c1])} ({diff/len(results[c1])*100:.1f}%) | "
            f"Max Selisih = {abs_diff_max:.2f} µg/m³ | Mean Selisih = {abs_diff_mean:.2f} µg/m³"
        )
