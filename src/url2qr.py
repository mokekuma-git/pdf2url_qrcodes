#!/usr/bin/env python
# coding: utf-8
"""URLリストファイルを読みこみ、QRコードを生成してZipファイルにまとめる"""

from pdf2qr import make_qr_builder, make_zip_qrcodes, make_argparse, get_more_files

if __name__ == "__main__":
    parser = make_argparse()
    parser.add_argument("filename", type=str, help="URLリストファイル名")
    _args = parser.parse_args()

    _qr = make_qr_builder(_args)
    _url_file = _args.filename
    _more_files = get_more_files(_args.more_files, _url_file)

    with open(_url_file, mode="r", encoding="utf-8") as _fp:
        urls = [url.strip() for url in _fp.readlines()]

    make_zip_qrcodes(urls, _args.qrcode_dir, _args.zip_file, _more_files, _qr)
