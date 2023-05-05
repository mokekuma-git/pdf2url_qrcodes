// const URL_REGEX = /https?:\/\/[^\s/$.?#].[^\s]*/gi;

const OPTION = {
  "cellSize": 2,
  "margin": 4,
  "errorCorrectionLevel": "L",
  "version": 0,
  "mode": "Byte"
}

const readPdfFile = ()=> {
  const pdfInput = document.getElementById("pdfSelector");
  if (pdfInput == null) {
    console.log("PDF Input is null");
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", readPDF);
  reader.readAsArrayBuffer(pdfInput.files[0]);
};

const readPDF = async (event)=> {
  clearLink();
  const typedarray = new Uint8Array(event.target.result);
  const loadingTask = pdfjsLib.getDocument(typedarray);
  const pdfDocument = await loadingTask.promise;
  for (let pageNum=1; pageNum<=pdfDocument.numPages; pageNum++) {
    readPage(pdfDocument, pageNum);
  }
};

const readPage = async (pdfDocument, pageNum)=> {
  const page = await pdfDocument.getPage(pageNum);
  const textContent = await page.getTextContent();
  const pageText = textContent.items.map(function(item) {return item.str;}).join("");
  //console.log(`Page ${pageNum}: ${extractUrls(pageText)}`);
  for (let link of linkify.find(pageText)) appendLink(link.value);
};

const appendLink = (link)=> {
  if (link === "") return;
  const list = document.getElementById("list");
  const li = document.createElement("li");
  const content = document.createElement("button");
  content.innerHTML = link;
  content.addEventListener("click", make_qrcode_event);
  li.appendChild(content);
  list.appendChild(li);
}

const clearLink = ()=> {
  const list = document.getElementById("list");
  list.innerHTML = "";
}

const readTextFile = ()=> {
  clearLink();
  const textInput = document.getElementById("textSelector");
  if (textInput == null) {
    console.log("Text Input is null");
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", readText);
  reader.readAsText(textInput.files[0]);
};

const readText = async (event)=> {
  const fileContent = event.target.result;
  for (let line of fileContent.split(/\r?\n/)) appendLink(line);
};

/*
const extractUrls = (textContent) => {
  const matched_urls = [];
  let match;
  while ((match = URL_REGEX.exec(textContent)) !== null) {
    matched_urls.push(match[0]);
  }
  return matched_urls;
};
*/

const onLoad = ()=> {
  const pdfInput = document.getElementById("pdfSelector");
  if (pdfInput != null) pdfInput.addEventListener("change", readPdfFile);
  const textInput = document.getElementById("textSelector");
  if (textInput != null) textInput.addEventListener("change", readTextFile);
  const contentInput = document.getElementById("content");
  if (contentInput != null) contentInput.addEventListener("change",
      function(event) {console.log(event.target.value);make_qrcode(event.target.value);
    });
  create_settings();
}

const create_settings = ()=> {
  const settings = document.getElementById("settings");
  // Error Correction Level
  settings.appendChild(document.createTextNode("エラー訂正レベル: (修正可能割合)"));
  const select = document.createElement("select");
  select.id = "errorCorrectionLevel";
  const levels = {"L": 7, "M": 15, "Q": 20, "H": 30};
  for (let lv of Object.keys(levels)) {
    const opt = document.createElement("option");
    opt.value = lv;
    opt.innerHTML = lv + " (" + levels[lv] + "%)";
    select.appendChild(opt);
  }
  select.addEventListener("change", function(event) {
    OPTION.errorCorrectionLevel = event.target.value;
  });
  settings.appendChild(select);

  // Cell Size
  settings.appendChild(document.createTextNode("セルサイズ: "));
  const cellSize = document.createElement("input");
  cellSize.type = "number";
  cellSize.id = "cellSize";
  cellSize.min = 2;
  cellSize.max = 20;
  cellSize.value = OPTION.cellSize;
  cellSize.addEventListener("change", function(event) {
    OPTION.cellSize = event.target.value;
  });
  settings.appendChild(cellSize);

  // Margin
  settings.appendChild(document.createTextNode("マージン: "));
  const margin = document.createElement("input");
  margin.type = "number";
  margin.id = "margin";
  margin.min = 4;
  margin.max = 20;
  margin.value = OPTION.margin;
  margin.addEventListener("change", function(event) {
    OPTION.margin = event.target.value;
  });
  settings.appendChild(margin);

}

const make_qrcode = (content)=> {
  // TODO: 毎回作るけどそれで良い？
  const qr = qrcode(OPTION.version, OPTION.errorCorrectionLevel);
  qr.addData(content, OPTION.mode);
  qr.make();
  document.getElementById("qrcode").innerHTML = qr.createImgTag(OPTION.cellSize, OPTION.margin);
}

const make_qrcode_event = (event)=> {
  const content = event.target.innerHTML;
  document.getElementById("content").value = content;
  make_qrcode(content, OPTION.mode);
}
