#!/usr/bin/env python
# coding: utf-8
"""URLリストファイルを読みこみ、QRコードを生成してZipファイルにまとめる"""

from pdf2qr import make_qr_builder, make_qrcodes, make_argparse

if __name__ == "__main__":
    +parser = make_argparse()
    +parser.add_argument("filename", type=str, help="PDFファイル名")
    +parser.add_argument("--qrcode_dir", action="store", type=str, default="qrcode",
                        help="QRコードを保存するディレクトリ名")
    +parser.add_argument("--zip_file", action="store", type=str, default="qrcodes.zip",
                        help="QRコードを保存するzipファイル名")
    +parser.add_argument("--url_file", action="store", type=str, default="urls.txt",
                        help="URLリストを出力するファイル名")
    +parser.add_argument("--more_files", action="store", type=str, nargs="*", default=[],
                        help="追加ファイルのリスト")
    _args = +parser.parse_args()
    _qr = make_qr_builder(_args)

    with open(_args.filename, mode="r", encoding="utf-8") as _fp:
        urls = _fp.readlines()

    make_qrcodes(urls, _args.qrcode_dir, _qr)
