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
 
![image](https://user-images.githubusercontent.com/84721916/236681489-eefc9dbd-baf7-4e68-be3b-1798afff6c04.png)

* 共通QRコード設定
  + エラー訂正レベル: [L: 7% M: 15% Q: 25% H: 30%の誤り訂正]
  + セル幅(px): QRコードの1セルのピクセルサイズ
  + 余白(px): QRコードの周囲の余白のピクセルサイズ
  + 画像フォーマット: PNGかSVGを選択
* 直接入力によるQRコード作成、描画  
  直接入力欄に文字列を入力、Enterを押す、フォーカスを移すなどの確定操作で画面右上にQRコードを生成
* URLリスト入力  
  QRコード対象の文字列を1行に表したテキストファイルを読みこみ  
  右側チェックボックスをチェックしている時は、行頭の数字+空白がある時はインデックスとして解釈 (無視)
* PDF入力 (未完成)  
  PDFファイルを読みこみ、URLのような文字列を抽出してQRコード対象としてリスト化  
  まだURL抽出のロジックに癖があり、適切に読み取れないケースが多い
* 表示中結果ダウンロード  
  描画中のQRコードを画像としてダウンロード  
  描画対象が無い場合は無視
* 一括作成Zipダウンロード  
  リスト内容を一括してQRコード作成し、Zipファイルとしてダウンロード  
  文字列をそのままファイル名として利用するが、ファイルパスに使えない記号類は _ に置換される  
  このため、違う文字列が同じファイル名になって被ってしまう場合は、「インデックス付き」のチェックを付加することでファイル名被りを回避可能  
  (例) "abc//", "abc??", "abc/////" など記号のみ違う文字列を一括作成する時、"1 abc_", "2 abc_", "3 abc_" となって区別可能)  
  多数の似た文字列があり、ファイル名では見分けがつきにくい場合にも「インデックス付き」の利用を推奨
* リストダウンロード  
  読み取ったリスト結果をテキストファイルとしてダウンロード  
  PDFからの読み取り結果を編集したい場合は、一度テキストファイルとしてダウンロードし、編集してからリスト入力としてアップロードすれば良い
* 読み取り結果の個別QRコード作成  
  テキストやPDFから読み取った結果はボタンのリストとして表示  
  各ボタンを押すことでその内容をQRコードとして作成し、画面右上に表示  
  表示中結果ダウンロード操作で、ダウンロード可能
