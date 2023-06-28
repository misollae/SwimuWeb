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

let fileList = [];
let currentIndex = 0;

/*function listSessionsWithRetry() {
  const endpoint = "http://localhost:3000/SwimuWeb/SessionList";
  const options = {
    method: "GET",
    headers: {
      Accept: "application.json",
      "Content-Type": "application/json",
    },
  };
  retryFetch(endpoint, options).then(data => {
    for (const session in data) {
      const filename = data[session];
      let button = document.createElement("button");
      button.textContent = filename;
      function handleClick() {
        requestSessionWithRetry(filename); 
      }
      button.onclick = handleClick;
      document.body.appendChild(button);
    }
  })
  .catch(error => console.log(error));
} */


function listSessionsWithRetry() {
  const endpoint = "http://localhost:3000/SwimuWeb/SessionList";
  const options = {
    method: "GET",
    headers: {
      Accept: "application.json",
      "Content-Type": "application/json",
    },
  };
  retryFetch(endpoint, options)
    .then(data => {
      fileList = Object.values(data);
      displayCurrentFile();
    })
    .catch(error => console.log(error));
}

function displayCurrentFile() {
  const fileListDiv = document.getElementById("file_list");

  const dropdownOptions = fileList.map((file, index) => {
    const date = formatFileDate(parseFileDate(file));
    return `<option value="${index}" ${index === currentIndex ? 'selected' : ''}>${date}</option>`;
  }).join("");

  fileListDiv.innerHTML = `
    <button id="prevButton" onclick="navigateFiles(-1)"><i class="fas fa-angle-left"></i></button>
    <select id="fileDropdown" onchange="selectFile(this.value)">${dropdownOptions}</select>
    <button id="nextButton" onclick="navigateFiles(1)"><i class="fas fa-angle-right"></i></button></button>
  `;
}

function selectFile(index) {
  currentIndex = parseInt(index);
  displayCurrentFile();
}

function navigateFiles(direction) {
  currentIndex += direction;
  if (currentIndex < 0) {
    currentIndex = 0;
  } else if (currentIndex >= fileList.length) {
    currentIndex = fileList.length - 1;
  }
  displayCurrentFile();
}

function parseFileDate(fileName) {
  const year = fileName.substring(0, 4);
  const month = fileName.substring(4, 6);
  const day = fileName.substring(6, 8);
  const hours = fileName.substring(8, 10);
  const minutes = fileName.substring(10, 12);
  const seconds = fileName.substring(12, 14);

  return new Date(year, month - 1, day, hours, minutes, seconds);
}

function formatFileDate(fileDate) {
  const options = { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "numeric", weekday: "long" };
  return fileDate.toLocaleDateString("en-US", options);
}

function requestSessionWithRetry(filename) {
  const endpoint = "http://localhost:3000/SwimuWeb/ShowSession";
  const options = {
    method: "POST",
    headers: {
      Accept: "application.json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filename: filename }),
  };
  retryFetch(endpoint, options).then(data => {
    const timestamps = [];
    const avgAngles  = [];

    for (const item of data.averageAngles) {
      timestamps.push(item.timestamp);
      avgAngles.push(item.avgAngle);
    }


    new Chart(document.getElementById("bar-chart"), {
      type: 'bar',
      data: {
         labels: timestamps,
         datasets: [
            {
               label: "Population (millions)",
               data: avgAngles
            }
         ]
      },
      options: {
         legend: { display: false },
         title: {
            display: true,
            text: 'U.S population'
         }
      }
   });

  })
  .catch(error => console.log(error));
}

// {averageAngles: Array(4700), max: Array(4601), min: Array(4601)}