import logging
import numpy as np
import cv2
from constants import Constants
from utils import *

def detect_mires_img_proc(image_seg, image_orig, center, 
    jump=2, start_angle=0, end_angle=360):
    return [], center, [image_seg, image_seg, image_seg]

def clean_points(image_cent_list, image_gray, image_name, center, mire_loc_method,
    n_mires=20, jump=2, start_angle=0, end_angle=360, output_folder="out",
):
    return [], [], [], image_gray, []
