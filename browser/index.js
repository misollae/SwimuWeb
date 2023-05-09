function retryFetch(endpoint, options, retries = 3, delay = 1000) {
  function makeRequest() {
    fetch(endpoint, options)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(response.statusText);
        }
      })
      .then(data => {
        console.log(data);
      })
      .catch(error => {
        console.error(`Failed to fetch ${endpoint}. Retrying in ${delay}ms...`);
        if (retries > 0) {
          setTimeout(makeRequest, delay);
          retries--;
        } else {
          console.error(`Failed to fetch ${endpoint} after ${retries} retries.`, error);
        }
      });
  }

  makeRequest();
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
  retryFetch(endpoint, options);
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
    .then(response => response.json())
    .then(data => {
      for (const num in data) {
        const date = data[num];
        let button = document.createElement("button");
        button.textContent = date;
        function handleClick() {
          requestFileWithRetry(num); // modify this line
        }
        button.onclick = handleClick;
        document.body.appendChild(button);
      }
    })
    .catch(error => console.log(error));
}
