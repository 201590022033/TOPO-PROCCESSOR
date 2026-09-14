import os
import math
import cv2
import numpy as np
from PIL import Image

colors_list = [
[0,0,255], [0,255,0], [255,0,0], [0,255,255], [255,0,255], [255,255,0],
[0,0,128], [128,128,255], [255,123,123], [0,102,255], [102,153,51],
[153,255,255], [204,204,51], [0,204,255], [150,150,150], [255, 255, 255], [0,0,0]
]

def check_angle(angle, skip_angles):
    return 2

def get_dist(p1, p2):
    return math.sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)

def plot_color_rb(img, points, flagged_points = []):
    return img

def plot_line(img, center, angle):                                          
    img = np.zeros_like(img)                                                
    x_min, y_min = 0, 0                                                     
    x_max, y_max = img.shape[1], img.shape[0]                               
    length = 500
    x = int(center[0] + length * math.cos(angle * np.pi / 180.0)) 
    y = int(center[1] + length * math.sin(angle * np.pi / 180.0)) 
    img = img.astype(np.uint8)                                              
    img = cv2.line(img, (center[0], center[1]), (x,y), (255,255, 255), 1)
    return img

def process_mires(img, center, angle, weights=None):
    mask = plot_line(img.copy(), center, angle)
    line = mask.copy()
    return [], line

def draw_circles(img, center, radii, angle, sim_k):
    for r in radii:
        img = cv2.circle(img, center, r, (5, 5, 5), 1)
    return img

def generate_colored_image(mires, out_path):
    pass

def median_filter_with_nans(data, win1, win2):
    return data
