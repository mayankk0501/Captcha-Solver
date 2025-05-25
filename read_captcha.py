from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import requests
from PIL import Image
from io import BytesIO
import easyocr
import time
import numpy as np

chrome_options = Options()
# chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(options=chrome_options)

driver.get("https://2captcha.com/demo/normal")

img = driver.find_element(By.CSS_SELECTOR, "img._captchaImage_rrn3u_9")
image_url = img.get_attribute("src")

response = requests.get(image_url)
image = Image.open(BytesIO(response.content))
image = Image.open(BytesIO(response.content)).convert("L")  # grayscale
# image.save("captcha_original.png")

img_np = np.array(image)

reader = easyocr.Reader(['en'], gpu=False)
result = reader.readtext(img_np, detail=0)

text = ''.join(result).strip().upper()

print("OCR Result:", text)

driver.find_element(By.CSS_SELECTOR, "input#simple-captcha-field").send_keys(text)
time.sleep(2)
driver.find_element(By.CSS_SELECTOR, "button._actionsItem_1f3oo_41._button_1cbf7_1._buttonPrimary_1cbf7_40._buttonMd_1cbf7_30").click()
time.sleep(1)
try:
    print(driver.find_element(By.CSS_SELECTOR, "div._alertBody_bl73y_16").text)
except Exception as e:
    print(driver.find_element(By.CSS_SELECTOR, "p._successMessage_rrn3u_1").text)
driver.quit()
