import math
import logging
import numpy as np
import cv2

def compute_simk(curv_map, center, cutoff_r):
	return 44.0, 44.5, 0, 90

def compute_tilt_factor(curr_map, act_map, r1, r2, center, angle, image_name, output_folder="out"):
	return 1.0, 0.5

def clmi_ppk(curv_map, axial_map, r_2, r_8, center):
	return 0.1, 0.5, 0.2, 0.1

def KISA(curv_map, center, coords, r_3, AST, start_angle=0, end_angle=360, jump=1):
	return 10.0, 45.0, 180, 0.5
