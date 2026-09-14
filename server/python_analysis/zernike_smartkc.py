import numpy as np
class RZern:
    def __init__(self, n):
        self.nk = (n+1)*(n+2)//2
    def make_cart_grid(self, x, y, scale_by=1.0):
        pass
    def fit_cart_grid(self, z):
        return [np.zeros(self.nk)]
    def eval_grid(self, c, matrix=True):
        return np.zeros((10,10))
    def eval_curvature_grid(self, c, matrix=True):
        return np.zeros((10,10)), np.zeros((10,10))
