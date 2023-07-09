let selectedOptions = {};

function retryFetch(endpoint, options, retries = 20, delay = 5000) {
  let responseReceived = false;

  return new Promise((resolve, reject) => {
    function makeRequest() {
      fetch(endpoint, options)
        .then((response) => {
          if (response.ok) {
            responseReceived = true;
            return response.json();
          } else {
            throw new Error(response.statusText);
          }
        })
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          console.error(
            `Failed to fetch ${endpoint}. Retrying in ${delay}ms...`
          );
          if (retries > 0 && !responseReceived) {
            setTimeout(makeRequest, delay);
            retries--;
          } else if (responseReceived) {
            console.log(`Response received for ${endpoint}.`);
          } else {
            console.error(
              `Failed to fetch ${endpoint} after ${retries} retries.`,
              error
            );
            reject(error);
          }
        });
    }

    makeRequest();
  });
}

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
    .then((data) => {
      const fileList = Object.values(data);
      const table = document.getElementById("sessionTable");
      fileList.forEach((file, index) => {
        const row = document.createElement("tr");

        const labelCell = document.createElement("td");
        const label = document.createTextNode(formatFileDate(parseFileDate(file)));
        labelCell.appendChild(label);
        row.appendChild(labelCell);

        const checkboxCell = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "session";
        checkbox.value = file;
        checkbox.addEventListener("click", function() {

          if (Object.keys(selectedOptions).length >= 5) {
            checkbox.checked = false;
            return;
          }

          if (checkbox.checked) {
            if (!selectedOptions.hasOwnProperty(file)) {
              requestSessionWithRetry(file);
            }
          } else {
            if (selectedOptions.hasOwnProperty(file)) {
              delete selectedOptions[file];
              update();
            }
          }
        });
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);
        table.appendChild(row);

        if (index < 5) {
          checkbox.checked = true; 
          requestSessionWithRetry(file);
        }
      });
    })
    .catch((error) => console.log(error));
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
  const options = {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  };
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
  retryFetch(endpoint, options)
    .then((data) => {
      selectedOptions[filename] = data;
      update();
    })
    .catch((error) => console.log(error));
}


const companiesData = [
  { month: "02", "Lowest SWOLF": 20, "Average SWOLF": 52, "Highest SWOLF": 72 },
  { month: "03", "Lowest SWOLF": 5,  "Average SWOLF": 33, "Highest SWOLF": 90 },
  { month: "04", "Lowest SWOLF": 55, "Average SWOLF": 30, "Highest SWOLF": 81 },
  { month: "05", "Lowest SWOLF": 30, "Average SWOLF": 11, "Highest SWOLF": 62 },
  { month: "06", "Lowest SWOLF": 27, "Average SWOLF": 14, "Highest SWOLF": 68 },
  { month: "07", "Lowest SWOLF": 32, "Average SWOLF": 31, "Highest SWOLF": 64 },
];


function getConfig() {
  return {
    type: "bar",
    css: "dhx_widget--bg_white",
    scales: {
      "bottom": {
        text: "month"
      },
      "left": {}
    },
    series: [
      {
        id: "A",
        value: "Lowest SWOLF",
        fill: "#394E79",
        color: "none"
      },
      {
        id: "B",
        value: "Average SWOLF",
        fill: "#5E83BA",
        color: "none"
      },
      {
        id: "C",
        value: "Highest SWOLF",
        fill: "#C2D2E9",
        color: "none"
      }
    ],
    legend: {
      series: ["A", "B", "C"],
      form: "rect",
      valign: "top",
      halign: "right"
    }
  }
}

const chart = new dhx.Chart("compareChart", getConfig());
chart.data.parse(companiesData);

function update(){
  const newData = [];
  var leaderboardDiv = document.querySelector('.leaderboard');
  var content = "";
  leaderboardDiv.innerHTML = "";

  const keySWOLF = [];

  Object.entries(selectedOptions).forEach(([key, value]) => {
    let session = formatFileDate(parseFileDate(key));
    const parts = session.split(" at ");
    const datePart = parts[0];
    const timePart = parts[1].split(" ")[0];
    const extractedDate = `${datePart} ${timePart}`;

    keySWOLF.push({ session: session, average: value.swolfStudy.average });
    //console.log(keySWOLF)
  
    newData.push({
      month: extractedDate,
      "Lowest SWOLF": Math.round(value.swolfStudy.lowest),
      "Average SWOLF": Math.round(value.swolfStudy.average),
      "Highest SWOLF": Math.round(value.swolfStudy.highest),
    });
    
  });

  keySWOLF.sort((a, b) => a.average - b.average);

  keySWOLF.forEach(entry => {
    const value = keySWOLF[key];
    var listItem = `
    <li>
      <mark>${entry.session}</mark>
      <small>${Math.round(entry.average)}</small>
    </li>
    `;
    content += listItem;
  })

  leaderboardDiv.innerHTML = "<ol>" + content + "</ol>";
  chart.data.parse(newData);
}