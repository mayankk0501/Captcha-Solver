const puppeteer = require('puppeteer');
const fs = require('fs');
const sharp = require('sharp');
const axios = require('axios');

const Tesseract = require('tesseract.js');


(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://2captcha.com/demo/normal');

  await page.waitForSelector("img._captchaImage_rrn3u_9");
  const imageUrl = await page.$eval("img._captchaImage_rrn3u_9", img => img.src);

  const axios = require('axios');
  const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const imageBuffer = Buffer.from(imageResponse.data, 'binary');

  // fs.writeFileSync('captcha_original.png', imageBuffer);

  const grayscaleImageBuffer = await sharp(imageBuffer)
  .resize({ width: 300 })   
  .grayscale()
  .normalize()    
  .threshold(120)
  .toBuffer();

  // fs.writeFileSync('captcha_grayscale.png', grayscaleImageBuffer);
  const { data: { text } } = await Tesseract.recognize(grayscaleImageBuffer, 'eng', {
    // logger: m => console.log(m),
    config: {
      tessedit_pageseg_mode: '7',
      classify_bln_numeric_mode: '1'
    }
  });
  console.log('OCR Result:', text.trim());
  
  await page.type('input#simple-captcha-field', text.trim());
  await new Promise(resolve => setTimeout(resolve, 2000));

  await page.click('button._actionsItem_1f3oo_41._button_1cbf7_1._buttonPrimary_1cbf7_40._buttonMd_1cbf7_30');
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
      const alertText = await page.$eval('div._alertBody_bl73y_16', el => el.innerText);
      console.log(alertText);
  } catch (err) {
      try {
          const successText = await page.$eval('p._successMessage_rrn3u_1', el => el.innerText);
          console.log(successText);
      } catch (e) {
          console.log('No success or alert message found.');
      }
  }
  await browser.close();

})();
