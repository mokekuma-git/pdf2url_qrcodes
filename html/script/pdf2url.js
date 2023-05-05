// const URL_REGEX = /https?:\/\/[^\s/$.?#].[^\s]*/gi;

let QRCODE = null;

const readPdfFile = ()=> {
  const pdfInput = document.getElementById('pdfSelector');
  if (pdfInput == null) {
    console.log("PDF Input is null");
    return;
  }
  const reader = new FileReader();
  reader.addEventListener('load', readPDF);
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
  const pageText = textContent.items.map(function(item) {return item.str;}).join('');
  //console.log(`Page ${pageNum}: ${extractUrls(pageText)}`);
  for (let link of linkify.find(pageText)) appendLink(link.value);
};

const appendLink = (link)=> {
  if (link === "") return;
  const list = document.getElementById('list');
  const li = document.createElement('li');
  const url = document.createElement('button');
  url.innerHTML = link;
  url.addEventListener('click', make_qrcode_event);
  li.appendChild(url);
  list.appendChild(li);
}

const clearLink = ()=> {
  const list = document.getElementById('list');
  list.innerHTML = "";
}

const readTextFile = ()=> {
  clearLink();
  const textInput = document.getElementById('textSelector');
  if (textInput == null) {
    console.log("Text Input is null");
    return;
  }
  const reader = new FileReader();
  reader.addEventListener('load', readText);
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
  const pdfInput = document.getElementById('pdfSelector');
  if (pdfInput != null) pdfInput.addEventListener('change', readPdfFile);
  const textInput = document.getElementById('textSelector');
  if (textInput != null) textInput.addEventListener('change', readTextFile);
  if (QRCODE === null) QRCODE = new QRCode(document.getElementById("qrcode"), "");
}

const make_qrcode = (url)=> {
  QRCODE.clear();
  QRCODE.makeCode(url); 
}

const make_qrcode_event = (event)=> {
  const url = event.target.innerHTML;
  document.getElementById("url").value = url;
  make_qrcode(url);
}
