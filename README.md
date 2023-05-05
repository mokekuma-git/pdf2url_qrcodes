# pdf2url_qrcodes
Read URLs from PDF file and make QR code images for them

## pdf2qr.py
PDFからURL類を読み込んでリスト化し、このURLを表すQRコードファイルを作成してzipファイルにまとめる

URLは文字列とリンクから読み込み、文字列から読んだリストを優先し、異なるURLがリンクにあれば追加する
```
usage: pdf2qr.py [-h] [--qr_version QR_VERSION] [--error_correction {L,M,Q,H}] [--box_size BOX_SIZE] [--border BORDER]
                 [--image_factory {PNG,SVG,SVGFragment,SVGPath}] [--qrcode_dir QRCODE_DIR] [--zip_file ZIP_FILE]
                 [--more_files [MORE_FILES ...]] [--url_file URL_FILE]
                 filename

positional arguments:
  filename              PDFファイル名

options:
  -h, --help            show this help message and exit
  --qr_version QR_VERSION
                        QRコードのバージョン (default: 1)
  --error_correction {L,M,Q,H}
                        QRコードの誤り訂正レベル [L: 7% M: 15% Q: 25% H: 30%の誤り訂正] (default: H)
  --box_size BOX_SIZE   QRコードのサイズ (default: 10)
  --border BORDER       QRコードの余白 (default: 4)
  --image_factory {PNG,SVG,SVGFragment,SVGPath}
                        QRコードの画像フォーマット (default: PNG)
  --qrcode_dir QRCODE_DIR
                        QRコードを保存するディレクトリ名 (default: qrcode)
  --zip_file ZIP_FILE   QRコードを保存するzipファイル名 (default: qrcodes.zip)
  --more_files [MORE_FILES ...]
                        追加ファイルのリスト (default: [])
  --url_file URL_FILE   URLリストを出力するファイル名 (default: urls.txt)
```
  
  
## url2qr.py
URLリストからQRコードファイルを作成し、zipファイルにまとめる

URLリストファイルは1行1つのURLを表すものとする
```
  usage: url2qr.py [-h] [--qr_version QR_VERSION] [--error_correction {L,M,Q,H}] [--box_size BOX_SIZE] [--border BORDER]
                 [--image_factory {PNG,SVG,SVGFragment,SVGPath}] [--qrcode_dir QRCODE_DIR] [--zip_file ZIP_FILE]
                 [--more_files [MORE_FILES ...]]
                 filename

positional arguments:
  filename              URLリストファイル名

options:
  -h, --help            show this help message and exit
  --qr_version QR_VERSION
                        QRコードのバージョン (default: 1)
  --error_correction {L,M,Q,H}
                        QRコードの誤り訂正レベル [L: 7% M: 15% Q: 25% H: 30%の誤り訂正] (default: H)
  --box_size BOX_SIZE   QRコードのサイズ (default: 10)
  --border BORDER       QRコードの余白 (default: 4)
  --image_factory {PNG,SVG,SVGFragment,SVGPath}
                        QRコードの画像フォーマット (default: PNG)
  --qrcode_dir QRCODE_DIR
                        QRコードを保存するディレクトリ名 (default: qrcode)
  --zip_file ZIP_FILE   QRコードを保存するzipファイル名 (default: qrcodes.zip)
  --more_files [MORE_FILES ...]
                        追加ファイルのリスト (default: [])
```


## pdf2url.js
PDFファイルからURL文字列を抜き出し、あるいはURLリストを直接与えてブラウザ上でQRコードを作成  
個別Downloadと一括Downloadの操作に対応
 
![image](https://user-images.githubusercontent.com/84721916/236431680-2d187d0d-a943-4c04-9a71-b6a01d23979f.png)

SVGはまだ実装中
