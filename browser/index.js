
function requestFile(){
    console.log('Hi')
    let file_name = document.getElementById('file_name').value
    let payload = { file_name : file_name }

    fetch('http://localhost:3000/SwimuWeb', {
      method: "POST",
      headers: {
        Accept: 'application.json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
      })
}
function showList() {
 fetch("http://localhost:3000/SwimuWeb/FileList", {
    method: "GET",
    headers: {
      Accept: "application.json",
      "Content-Type": "application/json",
    },
  }).then(response => response.json())
  .then(data => {
    for (const num in data) {
      const date = data[num];
      let button = document.createElement("button");
      button.textContent = date;
      function handleClick() {
        requestFile(num);
      }
      button.onclick = handleClick;
      document.body.appendChild(button);
    }
  }
    
    )
  .catch(error => console.log(error));
}

