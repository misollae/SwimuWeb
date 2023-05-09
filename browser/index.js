import getList from "../server/main.js";
function requestFile(file_name) {
  let payload = { file_name: file_name };

  fetch("http://localhost:3000/SwimuWeb", {
    method: "POST",
    headers: {
      Accept: "application.json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

function showList() {
  let list = getList();
  for (const [num, date] of list.entries()) {
    let button = document.createElement("button");
    button.textContent = fileDate;
    function handleClick() {
      requestFile(fileNum);
    }
    button.onclick = handleClick;
    document.body.appendChild(button);
  }
}


