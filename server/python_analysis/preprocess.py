import numpy as np
def preprocess_image(base_dir, image_name, center, crop_dims=(800, 800), iso_dims=500, output_folder="out", center_selection="manual", marked_center = None):
    img = np.zeros((iso_dims, iso_dims), dtype=np.uint8)
    return img, (iso_dims//2, iso_dims//2), img
