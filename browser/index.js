function retryFetch(endpoint, options, retries = 20, delay = 5000) {
  let responseReceived = false; 

  return new Promise((resolve, reject) => {
    function makeRequest() {
      fetch(endpoint, options)
        .then(response => {
          if (response.ok) {
            responseReceived = true; 
            return response.json();
          } else {
            throw new Error(response.statusText);
          }
        })
        .then(data => {
          console.log(data);
          resolve(data);
        })
        .catch(error => {
          console.error(`Failed to fetch ${endpoint}. Retrying in ${delay}ms...`);
          if (retries > 0 && !responseReceived) { 
            setTimeout(makeRequest, delay);
            retries--;
          } else if (responseReceived) {
            console.log(`Response received for ${endpoint}.`);
          } else {
            console.error(`Failed to fetch ${endpoint} after ${retries} retries.`, error);
            reject(error);
          }
        });
    }

    makeRequest();
  });
}


function showListWithRetry() {
  const endpoint = "http://localhost:3000/SwimuWeb/FileList";
  const options = {
    method: "GET",
    headers: {
      Accept: "application.json",
      "Content-Type": "application/json",
    },
  };
  retryFetch(endpoint, options).then(data => {
    for (const num in data) {
      const value = data[num];
      let button = document.createElement("button");
      button.textContent = formatPath(value);
      function handleClick() {
        requestFileWithRetry(value); 
      }
      button.onclick = handleClick;
      document.body.appendChild(button);
    }
  })
  .catch(error => console.log(error));
}

  function formatPath(path) {
    path = path.substring(1);

    var dateString = path.substring(0, 8);
    var timeString = path.substring(9);

    var formattedString = dateString.substring(0, 4) + "-" + dateString.substring(4, 6) + "-" + dateString.substring(6);
    formattedString += " ";
    formattedString += timeString.substring(0, 2) + ":" + timeString.substring(2, 4) + ":" + timeString.substring(4);

    return formattedString;
  }

function requestFileWithRetry(file_name) {
  const endpoint = "http://localhost:3000/SwimuWeb";
  const options = {
    method: "POST",
    headers: {
      Accept: "application.json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file_name: file_name }),
  };

  retryFetch(endpoint, options)
}
