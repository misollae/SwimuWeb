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

    requestSessionWithRetry(fileList[currentIndex]); 
    getSessionStatistics(fileList[currentIndex]);
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

function getSessionStatistics(filename) {
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

    totalStrokes = data.numStrokes;
    totalLaps = (data.numLaps == 0) ? 1 : data.numLaps;
    totalMeters  = totalLaps * 20;
    lapsInfo     = data.lapInfo;
    totalTime    = data.totalTime;
    avgTime      = data.avgTime;

    document.getElementById("totalStrokes").textContent = totalStrokes;
    document.getElementById("totalLaps").textContent = totalLaps;
    document.getElementById("totalMeters").textContent = totalMeters + "m";
    document.getElementById("totalTime").textContent = formatTime(totalTime);
    document.getElementById("avgTime").textContent = formatTime(avgTime);

    swolfchart.data.parse(lapsInfo);
  });
}

function convertToHHMM(seconds) {
  if (seconds < 60) {
    return "<00:01";
  }

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = remainingMinutes.toString().padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}`;
}

function formatTime(seconds) {
  seconds = Math.round(seconds);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  let result = "";

  if (hours > 0) {
    result += hours + "h ";
  }

  if (minutes > 0) {
    result += minutes + "m ";
  }

  if (remainingSeconds > 0 || result === "") {
    result += remainingSeconds + "s";
  }

  return result.trim();
}

function convertToMMSS(seconds) {
  if (seconds < 1) {
    return "<00:01";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

  return `${formattedMinutes}:${formattedSeconds}`;
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

   // document.getElementById("totalStrokes").textContent = data.numStrokes;


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

function deleteFileWithRetry() {
  filename = fileList[currentIndex];
  const endpoint = "http://localhost:3000/SwimuWeb/DeleteFile";
  const options = {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filename: filename }),
  };
  retryFetch(endpoint, options).then(data => {
      console.log("File deleted successfully: " + filename);
      currentIndex = currentIndex > 0 ? currentIndex - 1 : 0;
      listSessionsWithRetry();
    })
  .catch(error => console.log(error));
}

const swolfData = [
  { lap: "1",  "SWOLF Score": 35, swimStyle: "Backstroke" },
  { lap: "2",  "SWOLF Score": 37, swimStyle: "Backstroke" },
  { lap: "3",  "SWOLF Score": 33, swimStyle: "Backstroke" },
  { lap: "4",  "SWOLF Score": 35, swimStyle: "Backstroke" },
  { lap: "5",  "SWOLF Score": 38, swimStyle: "Backstroke" },
  { lap: "6",  "SWOLF Score": 38, swimStyle: "Backstroke" },
  { lap: "7",  "SWOLF Score": 36, swimStyle: "Backstroke" },
  { lap: "8",  "SWOLF Score": 36, swimStyle: "Backstroke" },
  { lap: "9",  "SWOLF Score": 30, swimStyle: "Backstroke" },
  { lap: "10", "SWOLF Score": 37, swimStyle: "Backstroke" },
];

function getSWOLFGraph() {
  function tooltipTemplate(p) {
    return p[0] + ", Style: " + swolfData[p[1]].swimStyle;
  };

  return {
    type: swolfData.length >= 21 ? "splineArea" : "bar",
    marker: true,

    css: "dhx_widget--bg_white ",
    scales: {
      "bottom": {
        text: "lap",
        textRotate: 90,
        title: "Lap",
      },
      "left": {
        maxTicks: 10,
        max: 75,
        min: 0,
      }
    },
    series: [ 
      {
        id: "A",
        value: "SWOLF Score",
        color: swolfData.length >= 21 ? "#6292bb" : "#5580a2",
        pointType: "circle",
        //barWidth: 20,
        tooltipTemplate: tooltipTemplate,
        strokeWidth: 3
      }
    ],
    legend: {
      series: ["A"],
      halign: "right",
      valign: "top",
    }
  }
}

const pieData = [
  { id: "Jan", value: 44.33, color: "#394e79", style: "Freestyle" },
  { id: "Feb", value: 22.12, color: "#5e83ba", style: "Backstroke" },
  { id: "Mar", value: 53.21, color: "#c2d2e9", style: "Breaststroke" },
  { id: "Apr", value: 34.25, color: "#202d45", style: "Butterfly" },
];

function getStylesChart() {
  return {
    type: "donut",
    css: "dhx_widget--bg_white",
    series: [
      {
        value: "value",
        color: "color",
        text: "style"
      }
    ]
  }
}

const swolfchart = new dhx.Chart("swolfChart", getSWOLFGraph());
//swolfchart.data.parse(swolfData);
const chart = new dhx.Chart("timePerStyleChart", getStylesChart());
chart.data.parse(pieData);
