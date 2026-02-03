const formData = new FormData();
formData.append("file", pdfFile);

fetch("url/upload-pdf", {
  method: "POST",
  body: formData,
});
