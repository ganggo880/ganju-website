import urllib.request
import json
import urllib.parse

text = "港居不動產 租賃住宅委託管理合約書"
url = f"https://api.mymemory.translated.net/get?q={urllib.parse.quote(text)}&langpair=zh-TW|en"

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("MyMemory Response Status:", data.get('responseStatus'))
        print("Response Details:", data.get('responseDetails'))
        print("Translated Text:", data.get('responseData', {}).get('translatedText'))
except Exception as e:
    print("Error:", e)
