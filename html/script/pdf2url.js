// const URL_REGEX = /https?:\/\/[^\s/$.?#].[^\s]*/gi;

/**
 * QRコード生成オプション
 * @param {string} callSize: セルのサイズ
 * @param {string} margin: 余白
 * @param {string} errorCorrectionLevel: エラー訂正レベル
 * @param {string} version: バージョン (QRコードサイズ、0で自動選択)
 * @param {string} mode: モード (Byte, Numeric, Alphanumeric, Kanji) // Byte以外は未確認
 * @param {string} type: 画像フォーマット (PNG, SVG)
 */
const OPTION = {
  cellSize: 2,
  margin: 4,
  errorCorrectionLevel: "L",
  version: 0,
  mode: "Byte",
  type: "PNG",
  listWithIndex: false,
};

/**
 * PDFファイルセレクタを元にPDFファイルを読み込む
 *
 * 1ページごとにreadPageで読み込み、読み込んだURL文字列毎にappendLinkを呼び出す
 * @returns {Promise} readPDFのPromise
 */
function readPdfFile() {
  const pdfInput = document.getElementById("pdfSelector");
  if (pdfInput == null) {
    console.log("PDF Input is null");
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", readPDF);
  reader.readAsArrayBuffer(pdfInput.files[0]);
}

/**
 * PDFファイルセレクタの読み込み完了イベントを受けて、PDFファイルを読み込む
 *
 * 1ページごとにreadPageで読み込み、読み込んだURL文字列毎にappendContentを呼び出す
 * @param {Event} event PDFファイルセレクタの読み込み完了イベント
 */
async function readPDF(event) {
  clearContentList();
  const typedarray = new Uint8Array(event.target.result);
  const loadingTask = pdfjsLib.getDocument(typedarray);
  const pdfDocument = await loadingTask.promise;
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    readPage(pdfDocument, pageNum);
  }
}

/**
 * PDFファイルのページを読み込む
 *
 * 指定されたページのテキストを読み込み、読み込んだURL文字列毎にappendContentを呼び出す
 * @param {PDFDocumentProxy} pdfDocument PDFドキュメント
 * @param {number} pageNum ページ番号
 */
async function readPage(pdfDocument, pageNum) {
  const page = await pdfDocument.getPage(pageNum);
  const textContent = await page.getTextContent();
  const pageText = textContent.items
    .map(function (item) {
      return item.str;
    })
    .join("");
  //console.log(`Page ${pageNum}: ${extractUrls(pageText)}`);
  for (let link of linkify.find(pageText)) appendContent(link.value);
}

/**
 * 与えられたQRコード化対象文字列をリストに追加する
 *
 * 各要素はボタンとして作成、クリックするとQRコードを生成・表示
 * @param {string} link QRコード化対象文字列
 */
function appendContent(link) {
  if (link === "") return;
  const list = document.getElementById("list");
  const li = document.createElement("li");
  const content = document.createElement("button");
  content.innerHTML = link;
  content.addEventListener("click", makeQrcodeByButton);
  li.appendChild(content);
  list.appendChild(li);
}

/**
 * QRコード化対象文字列リストをクリアする
 */
function clearContentList() {
  const list = document.getElementById("list");
  list.innerHTML = "読み取った文字列候補 (クリックでQRコード生成)";
}

/**
 * テキストファイルセレクタを元にテキストファイルを読み込む
 *
 * 1行ごとにappendContentを呼び出す
 * @returns {Promise} readTextのPromise
 */
function readTextFile() {
  clearContentList();
  const textInput = document.getElementById("textSelector");
  if (textInput == null) {
    console.log("Text Input is null");
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", readText);
  reader.readAsText(textInput.files[0]);
}

/**
 * テキストファイルセレクタの読み込み完了イベントを受けて、テキストファイルを読み込む
 *
 * 1行ごとにappendContentを呼び出す
 * @param {Event} event テキストファイルセレクタの読み込み完了イベント
 */
async function readText(event) {
  const fileContent = event.target.result;
  for (let line of fileContent.split(/\r?\n/)) {
    if (line === "") continue;
    if (OPTION.listWithIndex) line = line.replace(/^\d+\s/, "");
    appendContent(line);
  }
}

/*
function extractUrls(textContent) {
  const matched_urls = [];
  let match;
  while ((match = URL_REGEX.exec(textContent)) !== null) {
    matched_urls.push(match[0]);
  }
  return matched_urls;
}*/

/**
 * 初期化処理
 *
 * EventListenerの登録、設定フォームの作成
 */
function onLoad() {
  const pdfInput = document.getElementById("pdfSelector");
  if (pdfInput != null) pdfInput.addEventListener("change", readPdfFile);
  const textInput = document.getElementById("textSelector");
  if (textInput != null) textInput.addEventListener("change", readTextFile);
  const listWithIndexInput = document.getElementById("listWithIndex");
  if (listWithIndexInput != null)
    listWithIndexInput.addEventListener("change", function (event) {
      OPTION.listWithIndex = event.target.checked;
    });
  const contentInput = document.getElementById("content");
  if (contentInput != null)
    contentInput.addEventListener("change", function (event) {
      console.log(event.target.value);
      makeQrcodeView(event.target.value);
    });
  createSettings();
  const dl_latest = document.getElementById("download_latest");
  if (dl_latest != null) {
    dl_latest.addEventListener("click", downloadZipOnView());
  }
  const dl_zip = document.getElementById("download_zip");
  if (dl_zip != null) {
    dl_zip.addEventListener("click", downloadZipAll);
  }
  const dl_list = document.getElementById("download_list");
  if (dl_list != null) {
    dl_list.addEventListener("click", downloadList());
  }
}

/**
 * 設定フォームを作成する
 */
function createSettings() {
  const settings = document.getElementById("settings");
  // Error Correction Level
  settings.appendChild(
    document.createTextNode("エラー訂正レベル(修正可能割合): ")
  );
  const select = document.createElement("select");
  select.id = "errorCorrectionLevel";
  const levels = { L: 7, M: 15, Q: 20, H: 30 };
  for (let lv of Object.keys(levels)) {
    const opt = document.createElement("option");
    opt.value = lv;
    opt.innerHTML = lv + " (" + levels[lv] + "%)";
    select.appendChild(opt);
  }
  select.addEventListener("change", function (event) {
    OPTION.errorCorrectionLevel = event.target.value;
  });
  settings.appendChild(select);

  // Cell Size
  settings.appendChild(document.createTextNode("セル幅(px): "));
  const cellSize = document.createElement("input");
  cellSize.type = "number";
  cellSize.id = "cellSize";
  cellSize.min = 2;
  cellSize.max = 20;
  cellSize.value = OPTION.cellSize;
  cellSize.addEventListener("change", function (event) {
    OPTION.cellSize = event.target.value;
  });
  settings.appendChild(cellSize);

  // Margin
  settings.appendChild(document.createTextNode("余白(px): "));
  const margin = document.createElement("input");
  margin.type = "number";
  margin.id = "margin";
  margin.min = 4;
  margin.max = 20;
  margin.value = OPTION.margin;
  margin.addEventListener("change", function (event) {
    OPTION.margin = event.target.value;
  });
  settings.appendChild(margin);

  // Type
  settings.appendChild(document.createTextNode("画像フォーマット: "));
  const type = document.createElement("select");
  type.id = "type";
  const types = { PNG: "PNG", SVG: "SVG" };
  for (let t of Object.keys(types)) {
    const opt = document.createElement("option");
    opt.value = t;
    opt.innerHTML = types[t];
    type.appendChild(opt);
  }
  type.addEventListener("change", function (event) {
    OPTION.type = event.target.value;
  });
  settings.appendChild(type);
}

/**
 * type指定に合わせてQRコードを生成・表示する
 *
 * @param {string} content QRコード化対象文字列
 */
function makeQrcodeView(content) {
  document.getElementById("qrcode").innerHTML = makeQrcodeElement(content);
}

/**
 * type指定に合わせてQRコード要素内容を生成する
 *
 * @param {string} content
 * @returns
 */
function makeQrcodeElement(content) {
  // TODO: 毎回作るけどそれで良い？
  const qr = qrcode(OPTION.version, OPTION.errorCorrectionLevel);
  qr.addData(content, OPTION.mode);
  qr.make();
  if (OPTION.type.toUpperCase() === "SVG")
    return qr.createSvgTag({
      cellSize: OPTION.cellSize,
      margine: OPTION.margin,
    });
  return qr.createImgTag(OPTION.cellSize, OPTION.margin);
}

/**
 * 指定された文字列からHTML要素を生成する
 *
 * @param {string} elementStr HTML要素内容を表す文字列
 * @returns
 */
function makeElement(elementStr) {
  let div = document.getElementById("newElementParent");
  if (div == null) {
    div = document.createElement("div");
    div.id = "newElementParent";
  }
  div.innerHTML = elementStr.trim();
  return div.firstChild;
}

/**
 * ボタンクリックによるQRコード作成指示を受けて、QRコードを生成・表示する
 *
 * @param {Event} event QRコード作成指示ボタンクリックイベント
 */
function makeQrcodeByButton(event) {
  const content = event.target.innerHTML;
  document.getElementById("content").value = content;
  makeQrcodeView(content, OPTION.mode);
}

/**
 * 与えられたQRコード要素を画像ファイルとしてBlobに変換する
 *
 * 表示結果が無い時はnullを返す
 * @param {Element} img QRコード要素
 * @returns {Promise} BlobのPromise
 */
function makeImageBlob(img) {
  if (img == null) return null;
  if (img.tagName.toUpperCase() === "SVG") return svg2blob(img);
  return png2blob(img);
}
let IMG_ELEMENT;

/**
 * 表示中のQRコードをSVGファイルとしてBlobに変換する
 *
 * @param {SVGElement} img 表示中のQRコード
 */
async function svg2blob(img) {
  const svg = img.outerHTML;
  return new Blob([svg], { type: "image/svg+xml" });
}

/**
 * 表示中のQRコードをPNGファイルとしてBlobに変換する
 *
 * @param {HTMLImageElement} img 表示中のQRコード
 * @returns {Promise} Blobオブジェクト生成のPromise
 */
async function png2blob(img) {
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/**
 * 表示中のQRコードを画像ファイルとしてダウンロードする
 */
function downloadZipOnView() {
  return async function () {
    const blob = await makeImageBlob(
      document.getElementById("qrcode").firstChild
    );
    if (blob == null) return;
    downloadLink(
      blob,
      replaceEscape(document.getElementById("content").value) +
        getExtention(blob.type)
    );
  };
}

/**
 * QRコード化対象文字列リストをテキストファイルとしてダウンロードする
 */
function downloadList() {
  return async function () {
    const list = document.getElementById("list");
    const files = Array.from(list.getElementsByTagName("li")).map(
      (li, index) => {
        if (OPTION.listWithIndex)
          return index + " " + li.getElementsByTagName("button")[0].innerHTML;
        return li.getElementsByTagName("button")[0].innerHTML;
      }
    );
    const blob = new Blob([files.join("\n")], { type: "text/plain" });
    downloadLink(blob, "urls.txt");
  };
}

/**
 * 表示中の全QRコード化対象文字列からQRコードを作成し、Zipファイルとしてダウンロードする
 */
function downloadZipAll() {
  const files = {};
  const list = document.getElementById("list");
  Array.from(list.getElementsByTagName("li")).forEach((li, index) => {
    const content = li.getElementsByTagName("button")[0].innerHTML;
    const blob = makeImageBlob(makeElement(makeQrcodeElement(content)));
    files[makeFilePath(content, index, OPTION.type)] = blob;
  });
  downloadZip(files);
}

/**
 * ファイル名を作成する
 *
 * @param {string} content QRコード化対象文字列
 * @param {number} index ファイル番号
 * @returns {string} ファイル名
 */
function makeFilePath(content, index) {
  return "qrcode/" + makeFileName(content, index) + getExtention(OPTION.type);
}

/**
 * 画像フォーマットに合わせた拡張子を返す
 *
 * @param {string} type 画像フォーマット (tag名またはMIMEタイプ)
 * @returns {string} 拡張子
 */
function getExtention(type) {
  if (
    type.toUpperCase() === "SVG" ||
    type.toLocaleLowerCase() === "image/svg+xml"
  )
    return ".svg";
  return ".png";
}

/**
 * ファイル名を作成する
 *
 * @param {string} content QRコード化対象文字列
 * @param {number} index ファイル番号
 * @returns {string} ファイル名
 */
function makeFileName(content, index) {
  if (OPTION.listWithIndex) return index + " " + replaceEscape(content);
  return replaceEscape(content);
}

/**
 * ファイル名に使えない文字をアンダーバーに置き換える
 *
 * @param {string} content ファイル名の元文字列
 * @returns {string} 置き換え後のファイル名
 */
function replaceEscape(content) {
  return content.replace(/[\\/:*?"<>|]+/g, "_");
}

/**
 * 指定されたファイルリストから、Zipファイルを作成・ダウンロードさせる
 *
 * @param {Object} files ファイルリスト {ファイル名: ファイル内容BlobのPromise, ...}
 */
function downloadZip(files) {
  let zip = new JSZip();
  Object.keys(files).forEach(function (name) {
    zip.file(name, files[name]);
  });
  //zip.file(file.name, file.content);
  zip.generateAsync({ type: "blob" }).then(function (content) {
    downloadLink(content, "qrcodes.zip");
  });
}

/**
 * Blob内容をファイルとしてブラウザからダウンロードさせる
 *
 * @param {Blob} blob ダウンロードさせるBlob
 * @param {string} filename ダウンロードさせるファイル名
 */
function downloadLink(blob, filename) {
  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = filename;

  // ダウンロードリンクをクリックしてダウンロードを開始する
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
