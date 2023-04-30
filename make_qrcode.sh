#!/bin/bash

QR=qr
OPTIONS="--error-correction=L --factory=png"


# 対象URLが記載されたテキストファイルのパス
url_file="urls.txt"
zip_file="qrcodes.zip"


# ダウンロードしたファイルを保存するディレクトリのパス
qrcode_dir="qrcode"

mkdir ${qrcode_dir}
rm ${qrcode_dir}/*
rm ${zip_file}

# ダウンロード先のファイル名のプレフィックス
filename_prefix=""
filename_suffix=".png"


# URLを1行ずつ読み込む
while read url; do
    # ファイル名を生成
    filename="${filename_prefix}$(echo $url | tr -c '[:alnum:]._-' '_')${filename_suffix}"
    
    # ファイルをダウンロード
    $QR $OPTIONS "$url" > "${qrcode_dir}/${filename}"
#    echo $filename
done < "${url_file}"

zip -r ${zip_file} ${qrcode_dir} ${url_file}
