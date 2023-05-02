#!/usr/bin/env python
# coding: utf-8
"""PDFファイルからQRコードを生成する"""

import os
import re
import shutil
import sys
import urllib.parse
import zipfile
from typing import Dict, List

import fitz
import pikepdf
import qrcode
from dictdiffer import diff

qrcode_dir = "qrcode"
more_files = ["urls.txt"]
zip_file = "qrcodes.zip"

url_regrex = re.compile(r"https?://(?:[-\w\/\:\?\=\~\&\#.]|(?:%[\da-fA-F]{2}))+")


# QRコードの設定
qr = qrcode.QRCode(
    version=1,  # 1〜40までの値を指定できる。Noneの場合は自動的に最小の値が選択される
    error_correction=qrcode.constants.ERROR_CORRECT_L,  # 7%のデータ復元が可能
    # error_correction=qrcode.constants.ERROR_CORRECT_M,  # 15%のデータ復元が可能
    # error_correction=qrcode.constants.ERROR_CORRECT_Q,  # 25%のデータ復元が可能
    # error_correction=qrcode.constants.ERROR_CORRECT_H,  # 30%のデータ復元が可能
    box_size=2,  # 1セルのサイズ
    border=4,    # QRコードの周囲の余白
    image_factory=qrcode.image.pure.PyPNGImage,    # 画像生成種別の指定: PNG (デフォルト)
    # image_factory = qrcode.image.svg.SvgImage,     # SVG生成 四角形の集合のみ
    # image_factory = qrcode.image.svg.SvgFragmentImage, # SVG生成 フラグメントを利用
    # image_factory = qrcode.image.svg.SvgPathImage,     # SVG生成 path要素1つ ポイント間の空白を削除
    # image_factory=qrcode.image.pil.PilImage,          # PILを利用 デフォルトはPNG
    # module_drawer=GappedSquareModuleDrawer(),  # モジュール描画種別の指定 通常の描画
    # module_drawer=CircleModuleDrawer(),  # モジュール描画種別の指定 円形の描画
    # module_drawer=RoundedModuleDrawer(), # モジュール描画種別の指定 角丸の描画
    # module_drawer=VerticalBarsDrawer(),  # モジュール描画種別の指定 縦棒の描画
    # module_drawer=HorizontalBarsDrawer(),# モジュール描画種別の指定 横棒の描画
)

def read_url_from_pdftext(filename: str) -> Dict[str, int]:
    """PDF本文のテキストからURL風の文字列を抽出する
    
    Args:
        filename (str): PDFファイル名
    Returns:
        Dict[str, int]: URL風の文字列とその出現回数
    """
    text = ""
    # PDFを読み込む
    with fitz.open(filename) as doc:
        # １ページずつテキストを抽出して連結
        for page in range(len(doc)):
            text += doc[page].get_text()

    # URLを検索する
    urls = url_regrex.findall(text)
    print(f"Url: {len(urls)}")

    # 重複チェック
    return count_duplecated(urls)


def count_duplecated(urls: List[str]) -> Dict[str, int]:
    """与えられた文字列の出現回数チェック

    Args:
        urls (List[str]): 重複チェックする文字列のリスト
    Returns:
        Dict[str, int]: 文字列とその出現回数
    """
    urls_pickuped = {}
    counter = 0
    for url in urls:
        if url in urls_pickuped:
            urls_pickuped[url] += 1
        else:
            urls_pickuped[url] = 1
            counter += 1
            # print(url)
    print(f"Unique url: {counter}")
    return urls_pickuped


def read_url_from_pdflink(filename: str) -> Dict[str, int]:
    """PDFのリンクからURLの文字列を抽出する

    Args:
        filename (str): PDFファイル名
    Returns:
        Dict[str, int]: URLの文字列とその出現回数
    """
    urls = []
    with pikepdf.Pdf.open(filename) as doc:
        # 各ページのリンクを抽出する
        for page in doc.pages:
            if not page.get("/Annots"):
                continue
            for annot in page.get("/Annots"):
                if not annot or not annot.get("/A"):
                    continue
                uri = annot.get("/A").get("/URI")
                if uri is not None:
                    urls.append(uri)
    print(f"Url: {len(urls)}")

    # 重複チェック
    return count_duplecated(urls)


def make_qrcodes(urls: List[str], qrcode_dir: str) -> None:
    """URLのリストからQRコードを生成する

    Args:
        urls (List[str]): URLのリスト
        qrcode_dir (str): QRコードを保存するディレクトリ名
    """
    for url in urls:
        qr.clear()
        qr.add_data(url)
        qr.make(fit=True)
        image = qr.make_image(fill_color="black", back_color="white")
        if image:
            image.save(qrcode_dir + "/" + re.sub(r"[^a-zA-Z0-9._-]+", "_", url) + ".png")
        else:
            print(f"image empty {image} {url}")


def clear_dir(dirname: str) -> None:
    """ディレクトリを削除して再作成する

    Args:
        dirname (str): ディレクトリ名
    """
    if os.path.exists(dirname):
        shutil.rmtree(dirname)
    os.makedirs(dirname)


def zip_dir(zip_file: str, dirname: str, more_files: List[str]) -> None:
    """ディレクトリと追加ファイルをzipに圧縮する

    Args:
        zip_file (str): zipファイル名
        dirname (str): 圧縮対象のディレクトリ名
        more_files (List[str]): 追加ファイルのリスト
    """
    with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # ディレクトリ内のファイルをzipに追加する
        for foldername, subfolders, filenames in os.walk(dirname):
            for filename in filenames:
                filepath = os.path.join(foldername, filename)
                zipf.write(filepath, os.path.relpath(filepath, dirname))
        # 追加のファイルをzipに追加する
        for file in more_files:
            zipf.write(file, os.path.basename(file))


if __name__ == "__main__":
    filename = sys.argv[1]
    urls_pickuped = read_url_from_pdftext(filename)
    urls_linked = read_url_from_pdflink(filename)

    result = {
        x: _list for (x, y, _list) in (diff(urls_pickuped, urls_linked))
    }
    print(result)

    # マージ
    urls = [x for x in urls_pickuped.keys()]
    #urls.append(str(result["add"][0][0]))
    for (url, count) in result["add"]:
        decoded = urllib.parse.unquote(str(url))
        if decoded in urls:
            print(f"{decoded} found")
        else:
            print(f"{decoded} not found")
            urls.append(str(url))

    # url保存
    with open("urls.txt", mode="w") as _fp:
        for url in urls:
            _fp.write(url)
            _fp.write("\n")

    clear_dir(qrcode_dir)
    clear_dir(zip_file)
    make_qrcodes(urls)
    zip_dir(zip_file, qrcode_dir, more_files)
