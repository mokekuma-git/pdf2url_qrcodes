// const URL_REGEX = /https?:\/\/[^\s/$.?#].[^\s]*/gi;

let QRCODE = null;

const readFile = ()=> {
  const input = document.getElementById('fileSelector');
  if (input == null) {
    console.log("input is null");
    return;
  }
  const reader = new FileReader();
  reader.addEventListener('load', readPDF);
  reader.readAsArrayBuffer(input.files[0]);
};

const readPDF = async (event)=> {
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
  for (let link of linkify.find(pageText)) appendLink(link);
};

const appendLink = (link)=> {
  const list = document.getElementById('list');
  const li = document.createElement('li');
  const url = document.createElement('button');
  url.innerHTML = link.value;
  url.addEventListener('click', make_qrcode_event);
  li.appendChild(url);
  list.appendChild(li);
}

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
  const input = document.getElementById('fileSelector');
  //console.log(input);
  input.addEventListener('change', readFile);
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
