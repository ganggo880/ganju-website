import urllib.request
import urllib.parse
import json
import base64

# Test image text
print("Testing OCR.Space Traditional Chinese API...")

url = "https://api.ocr.space/parse/image"

# Create a small test image with Chinese text using PIL or raw data
from PIL import Image, ImageDraw, ImageFont
import io

img = Image.new('RGB', (600, 150), color=(255, 255, 255))
d = ImageDraw.Draw(img)
# Draw some text
d.text((20, 30), "港居不動產 租賃委託管理合約 統編96797997", fill=(0, 0, 0))

buf = io.BytesIO()
img.save(buf, format='PNG')
b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode('utf-8')

data = {
    'base64Image': b64,
    'language': 'cht',
    'isOverlayRequired': 'false',
    'OCREngine': '2', # Engine 2 is AI Deep Learning OCR
    'apikey': 'helloworld'
}

encoded_data = urllib.parse.urlencode(data).encode('utf-8')
req = urllib.request.Request(url, data=encoded_data, headers={'User-Agent': 'Mozilla/5.0'})

try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print("OCR.Space Response:")
        parsed_results = res.get('ParsedResults', [])
        if parsed_results:
            text = parsed_results[0].get('ParsedText', '')
            print("Extracted Text:\n", text)
        else:
            print("No parsed results:", res)
except Exception as e:
    print("API Error:", e)
