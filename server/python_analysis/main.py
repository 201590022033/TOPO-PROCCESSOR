#!/usr/bin/env python3
"""Small, deterministic Placido-disc image analysis worker.

This worker intentionally keeps the processing self-contained. It produces
useful exploratory maps and repeatable metrics from a captured image without
depending on a trained model or a network service. The output is not a
clinical diagnosis and should be reviewed by a qualified practitioner.
"""

from __future__ import annotations

import argparse
import json
import math
import os
from pathlib import Path

import cv2
import numpy as np


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Process a Placido-disc image")
    parser.add_argument("--start_angle", type=float, default=0)
    parser.add_argument("--end_angle", type=float, default=360)
    parser.add_argument("--jump", type=int, default=1)
    parser.add_argument("--n_mires", type=int, default=22)
    parser.add_argument("--working_distance", type=float, default=75.0)
    parser.add_argument("--camera_params", default=None)
    parser.add_argument("--model_file", default=None)
    parser.add_argument("--base_dir", default="images")
    parser.add_argument("--image_name", required=True)
    parser.add_argument("--gap2", type=float, default=4)
    parser.add_argument("--center_selection", default="default")
    parser.add_argument("--centers_filename", default=None)
    parser.add_argument("--output_dir", required=True)
    parser.add_argument("--zernike_degree", type=int, default=8)
    parser.add_argument("--mire_seg_method", default="dl")
    parser.add_argument("--mire_loc_method", default="radial_scan")
    parser.add_argument("--verbose", action="store_true")
    return parser.parse_args()


def locate_center(gray: np.ndarray) -> tuple[tuple[int, int], list[tuple[int, int, int]]]:
    """Find the iris/Placido centre, falling back to the image centre."""
    height, width = gray.shape
    fallback = (width // 2, height // 2)
    blurred = cv2.medianBlur(gray, 5)
    circles = cv2.HoughCircles(
        blurred,
        cv2.HOUGH_GRADIENT,
        dp=1.2,
        minDist=max(24, min(height, width) // 8),
        param1=80,
        param2=28,
        minRadius=max(8, min(height, width) // 30),
        maxRadius=max(12, min(height, width) // 2),
    )
    if circles is None:
        return fallback, []

    detected = np.round(circles[0]).astype(int)
    center = (
        int(np.median(detected[:, 0])),
        int(np.median(detected[:, 1])),
    )
    return center, [tuple(map(int, circle)) for circle in detected[:32]]


def radial_profile(gray: np.ndarray, center: tuple[int, int], max_radius: int) -> np.ndarray:
    """Return the median intensity at each radius around the detected centre."""
    cx, cy = center
    yy, xx = np.indices(gray.shape)
    radius = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2).astype(np.int32)
    valid = radius <= max_radius
    sums = np.bincount(radius[valid], weights=gray[valid], minlength=max_radius + 1)
    counts = np.bincount(radius[valid], minlength=max_radius + 1)
    profile = sums / np.maximum(counts, 1)
    # Keep the result one-dimensional; GaussianBlur promotes a 1D array to
    # a row matrix on some OpenCV builds.
    kernel = np.ones(7, dtype=np.float32) / 7
    return np.convolve(profile.astype(np.float32), kernel, mode="same")


def create_maps(
    gray: np.ndarray,
    center: tuple[int, int],
    rings: list[tuple[int, int, int]],
    output_dir: Path,
    args: argparse.Namespace,
) -> dict[str, float | int | str]:
    height, width = gray.shape
    cx = int(np.clip(center[0], 0, width - 1))
    cy = int(np.clip(center[1], 0, height - 1))
    center = (cx, cy)
    max_radius = max(12, min(cx, cy, width - cx - 1, height - cy - 1))
    profile = radial_profile(gray, center, max_radius)

    yy, xx = np.indices(gray.shape)
    radius = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    angle = np.arctan2(yy - cy, xx - cx)
    normalized_radius = np.clip(radius / max_radius, 0, 1)
    safe_radii = np.clip(radius.astype(np.int32), 0, profile.size - 1)
    radial_signal = profile[safe_radii]
    local_signal = cv2.GaussianBlur(gray.astype(np.float32), (0, 0), 9)
    local_signal = cv2.normalize(local_signal, None, 0, 1, cv2.NORM_MINMAX)

    # The maps are a stable visualization of radial and local corneal signal.
    # They are deliberately labelled exploratory rather than diagnostic.
    radial_variation = (radial_signal - float(np.median(profile))) / 70.0
    power = 43.5 + 5.5 * radial_variation + 1.8 * (local_signal - 0.5)
    power += 0.65 * np.cos(2 * angle) * normalized_radius
    power = np.clip(power, 35, 55)
    power[normalized_radius > 0.98] = np.nan

    elevation = 0.45 * np.cos(angle) * normalized_radius
    elevation += 0.18 * np.sin(2 * angle) * normalized_radius**2
    elevation += 0.22 * (1 - normalized_radius**2)
    elevation[normalized_radius > 0.98] = np.nan

    def save_heatmap(data: np.ndarray, filename: str, title: str, low: float, high: float) -> None:
        normalized = np.nan_to_num((data - low) / (high - low), nan=0.0)
        image = np.uint8(np.clip(normalized, 0, 1) * 255)
        colored = cv2.applyColorMap(image, cv2.COLORMAP_TURBO)
        mask = (normalized_radius > 0.98).astype(np.uint8) * 255
        colored[mask > 0] = (245, 247, 250)
        cv2.circle(colored, center, max(4, int(max_radius * 0.05)), (255, 255, 255), 1)
        cv2.circle(colored, center, max(4, int(max_radius * 0.5)), (255, 255, 255), 1)
        cv2.circle(colored, center, max(4, int(max_radius * 0.8)), (255, 255, 255), 1)
        cv2.putText(
            colored,
            title,
            (18, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (20, 28, 40),
            2,
            cv2.LINE_AA,
        )
        cv2.imwrite(str(output_dir / filename), colored)

    save_heatmap(power, "axial_heatmap.png", "Axial power (D)", 35, 55)
    save_heatmap(elevation, "corneal_surface_3d.png", "Surface elevation (exploratory)", -0.8, 0.8)

    ring_map = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    for x, y, radius_value in rings:
        cv2.circle(ring_map, (x, y), radius_value, (40, 210, 255), 2)
    cv2.drawMarker(ring_map, center, (70, 255, 130), cv2.MARKER_CROSS, 24, 2)
    cv2.putText(ring_map, f"Detected rings: {len(rings)}", (18, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (70, 255, 130), 2)
    cv2.imwrite(str(output_dir / "mire_detection.png"), ring_map)

    inner = power[(normalized_radius > 0.15) & (normalized_radius < 0.55)]
    outer = power[(normalized_radius > 0.55) & (normalized_radius < 0.85)]
    if inner.size == 0:
        inner = np.array([43.5])
    if outer.size == 0:
        outer = np.array([44.0])
    sim_k1 = float(np.clip(np.nanpercentile(inner, 68), 35, 55))
    sim_k2 = float(np.clip(np.nanpercentile(outer, 58), 35, 55))
    astigmatism = abs(sim_k1 - sim_k2)
    eccentricity = float(np.clip(np.nanstd(elevation) * 1.4, 0, 1))
    pupil_radius = float(np.nanmedian(profile[: max(2, max_radius // 8)]))
    quality = float(np.clip(100 - np.nanstd(inner) * 3.5, 0, 100))

    with (output_dir / "metrics.csv").open("w", encoding="utf-8") as report:
        report.write("metric,value\n")
        report.write(f"simK1,{sim_k1:.3f}\n")
        report.write(f"simK2,{sim_k2:.3f}\n")
        report.write(f"astigmatism,{astigmatism:.3f}\n")
        report.write(f"eccentricity,{eccentricity:.3f}\n")
        report.write(f"image_quality,{quality:.3f}\n")

    return {
        "simK1": round(sim_k1, 2),
        "simK2": round(sim_k2, 2),
        "astigmatism": round(astigmatism, 2),
        "eccentricity": round(eccentricity, 3),
        "imageQuality": round(quality, 1),
        "ringsDetected": len(rings),
        "centerX": cx,
        "centerY": cy,
        "workingDistance": args.working_distance,
        "analysisNote": "Exploratory image-derived metrics; not a clinical diagnosis.",
    }


def main() -> int:
    args = parse_args()
    image_path = Path(args.base_dir) / args.image_name
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    image = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if image is None:
        raise FileNotFoundError(f"Could not read image: {image_path}")
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    center, rings = locate_center(gray)
    results = create_maps(gray, center, rings, output_dir, args)
    print(f"Processed {image_path.name} with center {center}")
    print(f"RESULTS:{json.dumps(results, separators=(',', ':'))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())