import cv2
import numpy as np
import os

print("OpenCV availability check...")
try:
    import cv2
    print("OpenCV is available:", cv2.__version__)
except ImportError:
    print("OpenCV not installed, testing JS image filters directly.")
