import math
import logging
import numpy as np
import cv2
from sklearn.cluster import KMeans
from sklearn.neighbors import KNeighborsRegressor

gt_pal = [
    [0,0,0],
    [2,5,81],
    [1,5,121],
    [2,1,161],
    [2,1,181],
    [1,1,213],
    [2,93,169],
    [2,141,121],
    [32,181,77],
    [44,241,49],
    [168,241,37],
    [244,241,37],
    [240,181,37],
    [248,125,37],
    [244,97,25],
    [248,37,33],
    [241,57,69],
    [242,89,101],
    [238,121,129],
    [237,133,145],
    [238,145,157],
    [237,161,173],
    [238,173,189],
    [238,185,201],
    [237,205,221],
    [237,233,249]
] 

gt_r = [40.6, 24.9, 18.1, 14.2, 11.7, 10.0, 9.1, 8.8, 8.4, 8.1, 7.9, 7.6, 7.3,
        7.1, 6.9, 6.6, 6.1, 5.6, 5.2, 4.8, 4.5, 4.2, 4.0, 3.7, 3.5, 3.4]

gt_p = [9, 14, 19, 24, 29, 33.9, 37, 38.5, 40, 41.5, 43, 44.5, 46, 47.5, 
        49, 51.4, 55.5, 60.5, 65.5, 70.5, 75.5, 80.5, 85.5, 90.5, 95.5, 100.5]

def generate_tan_map(blank, gt_pal, gt_r, center, normal_r, image, output_folder='out'):
    output = np.zeros((blank.shape[0], blank.shape[1], 3))
    for i in range(blank.shape[0]):
        for j in range(blank.shape[1]):
            r = math.sqrt((center[0]-j)**2 + (center[1]-i)**2)
            if r >= normal_r:
                continue
            idx = -1
            mn = 1e9
            curr = blank[i,j]
            for k, x in enumerate(gt_r):
                diff = abs(curr - x)
                if diff < mn:
                    mn = diff
                    idx = k
            output[i,j,:] = gt_pal[idx]

    output = output.astype(np.uint8)
    output = cv2.cvtColor(output, cv2.COLOR_RGB2BGR)
    return output

def generate_axial_map(curv_map, gt_pal, gt_p, center, normal_r, image, output_folder='out'):
    curv_axial_map = np.zeros((curv_map.shape[0], curv_map.shape[1]))
    for i in range(curv_map.shape[0]):
        for j in range(curv_map.shape[1]):
            r = math.sqrt((center[0]-j)**2 + (center[1]-i)**2)
            if r >= normal_r:
                continue
            curr_meridian = np.zeros((curv_map.shape[0], curv_map.shape[1], 3))
            curr_meridian = cv2.line(curr_meridian, (center[0], center[1]), (j,i), (255,255, 255), 1)
            curr_meridian = curr_meridian[:,:,0]
            curv_axial_map[i,j] = (curv_map[curr_meridian>0]).mean()

    axial_map = np.zeros((curv_map.shape[0], curv_map.shape[1], 3))
    for i in range(curv_map.shape[0]):
        for j in range(curv_map.shape[1]):
            r = math.sqrt((center[0]-j)**2 + (center[1]-i)**2)
            if r >= normal_r:
                continue
            idx = -1
            mn = 1e9
            curr = 337.5 * curv_axial_map[i,j]
            for k,x in enumerate(gt_p):
                diff = abs(curr - x)
                if diff < mn:
                    mn = diff
                    idx = k
            axial_map[i,j,:] = gt_pal[idx]

    axial_map = axial_map.astype(np.uint8)
    axial_map = cv2.cvtColor(axial_map, cv2.COLOR_RGB2BGR)
    return axial_map, curv_axial_map
