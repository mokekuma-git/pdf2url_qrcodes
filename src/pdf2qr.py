#!/usr/bin/env python
# coding: utf-8
"""PDFファイルからQRコードを生成する"""

import argparse
import os
import re
import shutil
import urllib.parse
import zipfile
from typing import Dict, List

import fitz
import pikepdf
from dictdiffer import diff
import qrcode
import qrcode.image.svg

URL_REGEX = re.compile(r"https?://(?:[-\w\/\:\?\=\~\&\#.]|(?:%[\da-fA-F]{2}))+")

ERROR_CORRECTION = {
    "L": qrcode.constants.ERROR_CORRECT_L,
    "M": qrcode.constants.ERROR_CORRECT_M,
    "Q": qrcode.constants.ERROR_CORRECT_Q,
    "H": qrcode.constants.ERROR_CORRECT_H,
}

IMAGE_FACTORY = {
    # "PIL": qrcode.image.pil.PilImage,  # Pillowが必要
    "PNG": qrcode.image.pure.PymagingImage,
    "SVG": qrcode.image.svg.SvgImage,
    "SVGPath": qrcode.image.svg.SvgPathImage,
    "SVGFragment": qrcode.image.svg.SvgFragmentImage,
}


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
        for page in doc:
            text += page.get_text()

    # URLを検索する
    urls = URL_REGEX.findall(text)
    print(f"Url [Text]: {len(urls)}")

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
    print(f"Url [Link]: {len(urls)}")

    # 重複チェック
    return count_duplecated(urls)


def make_qrcodes(urls: List[str], qrcode_dir: str, qr: qrcode.QRCode) -> None:  # pylint: disable=C0103
    """URLのリストからQRコードを生成する

    Args:
        urls (List[str]): URLのリスト
        qrcode_dir (str): QRコードを保存するディレクトリ名
        qr (qrcode.QRCode): QRコードのインスタンス
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
        for foldername, _, filenames in os.walk(dirname):
            for filename in filenames:
                filepath = os.path.join(foldername, filename)
                zipf.write(filepath, os.path.relpath(filepath, dirname))
        # 追加のファイルをzipに追加する
        for file in more_files:
            zipf.write(file, os.path.basename(file))


def make_zip_qrcodes(urls: List[str], qrcode_dir: str, zip_file: str,
                     more_files: List[str], qr: qrcode.QRCode) -> None:  # pylint: disable=C0103
    """URLのリストからQRコードファイルを生成してzipに圧縮する

    Args:
        urls (List[str]): URLのリスト
        qrcode_dir (str): QRコードを保存するディレクトリ名
        zip_file (str): zipファイル名
        more_files (List[str]): 追加ファイルのリスト
        qr (qrcode.QRCode): QRコードのインスタンス
    """
    clear_dir(qrcode_dir)
    if os.path.exists(zip_file):
        os.remove(zip_file)
    make_qrcodes(urls, qrcode_dir, qr)
    zip_dir(zip_file, qrcode_dir, more_files)


def make_argparse() -> argparse.ArgumentParser:
    """コマンドライン引数を解析するargparseを作成する"""
    parser = argparse.ArgumentParser(
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument("--qr_version", action="store", type=int, default=1,
                        help="QRコードのバージョン")
    parser.add_argument(
        "--error_correction", action="store", type=str, default="H",
        choices=["L", "M", "Q", "H"],
        help="QRコードの誤り訂正レベル [L: 7%% M: 15%% Q: 25%% H: 30%%の誤り訂正]")
    parser.add_argument("--box_size", action="store", type=int, default=10,
                        help="QRコードのサイズ")
    parser.add_argument("--border", action="store", type=int, default=4,
                        help="QRコードの余白")
    parser.add_argument(
        "--image_factory", action="store", type=str, default="PNG",
        choices=["PNG", "SVG", "SVGFragment", "SVGPath"],
        help="QRコードの画像フォーマット")
    parser.add_argument("--qrcode_dir", action="store", type=str, default="qrcode",
                        help="QRコードを保存するディレクトリ名")
    parser.add_argument("--zip_file", action="store", type=str, default="qrcodes.zip",
                        help="QRコードを保存するzipファイル名")
    parser.add_argument("--more_files", action="store", type=str, nargs="*", default=[],
                        help="追加ファイルのリスト")
    return parser


def make_qr_builder(args: argparse.ArgumentParser) -> qrcode.QRCode:
    """QRコードのインスタンスを作成する

    Args:
        args (argparse.ArgumentParser): コマンドライン引数
    """
    return qrcode.QRCode(
        version=args.qr_version,  # 1〜40までの値を指定できる。Noneの場合は自動的に最小の値が選択される
        error_correction=ERROR_CORRECTION[args.error_correction],  # 誤り訂正レベル
        # error_correction=qrcode.constants.ERROR_CORRECT_L,  # 7%のデータ復元が可能
        # error_correction=qrcode.constants.ERROR_CORRECT_M,  # 15%のデータ復元が可能
        # error_correction=qrcode.constants.ERROR_CORRECT_Q,  # 25%のデータ復元が可能
        # error_correction=qrcode.constants.ERROR_CORRECT_H,  # 30%のデータ復元が可能
        box_size=args.box_size,  # 1セルのサイズ
        border=args.border,  # QRコードの周囲の余白
        image_factory=IMAGE_FACTORY[args.image_factory],   # 画像生成種別の指定
        # image_factory = qrcode.image.pure.PyPNGImage,    # PNG生成 (デフォルト)
        # image_factory = qrcode.image.svg.SvgImage,       # SVG生成 四角形の集合のみ
        # image_factory = qrcode.image.svg.SvgFragmentImage, # SVG生成 フラグメントを利用
        # image_factory = qrcode.image.svg.SvgPathImage,   # SVG生成 path要素1つ ポイント間の空白を削除
        # image_factory=qrcode.image.pil.PilImage,         # PILを利用
        # module_drawer=GappedSquareModuleDrawer(),  # モジュール描画種別の指定 通常の描画
        # module_drawer=CircleModuleDrawer(),  # モジュール描画種別の指定 円形の描画
        # module_drawer=RoundedModuleDrawer(), # モジュール描画種別の指定 角丸の描画
        # module_drawer=VerticalBarsDrawer(),  # モジュール描画種別の指定 縦棒の描画
        # module_drawer=HorizontalBarsDrawer(),# モジュール描画種別の指定 横棒の描画
    )


def get_more_files(more_files: List[str], url_file: str) -> List[str]:
    """追加ファイルのリストを取得する"""
    if not more_files:
        more_files = [url_file]
    else:
        more_files.append(url_file)
    return more_files


if __name__ == "__main__":
    _parser = make_argparse()
    _parser.add_argument("filename", type=str, help="PDFファイル名")
    _parser.add_argument("--url_file", action="store", type=str, default="urls.txt",
                        help="URLリストを出力するファイル名")
    _args = _parser.parse_args()

    # QRコードの設定
    _qr = make_qr_builder(_args)

    _filename = _args.filename
    _qrcode_dir = _args.qrcode_dir
    _zip_file = _args.zip_file
    _url_file = _args.url_file
    _more_files = get_more_files(_args.more_files, _url_file)

    # PDFテキストからURLを抽出
    urls_text = read_url_from_pdftext(_filename)
    # PDFリンクからURLを抽出
    urls_linked = read_url_from_pdflink(_filename)

    # 両URLリストの差分を確認
    result = {
        x: _list for (x, _y, _list) in (diff(urls_text, urls_linked))
    }
    print(result)

    # マージ
    # pickuped優先
    _urls = list(urls_text.keys())
    # linkedにあって、URLデコードしてもtextにないものを追加
    # リンクにURLエンコードされた結果が入っていたケースに対応したが、
    # 選択ポリシーは要検討
    for (_url, _count) in result["add"]:
        decoded = urllib.parse.unquote(str(_url))
        if decoded in _urls:
            print(f"{decoded} found")
        else:
            print(f"{decoded} not found")
            _urls.append(str(_url))

    # url保存
    with open(_url_file, mode="w", encoding="utf-8") as _fp:
        for _url in _urls:
            _fp.write(_url)
            _fp.write("\n")

    make_zip_qrcodes(_urls, _qrcode_dir, _zip_file, _more_files, _qr)
