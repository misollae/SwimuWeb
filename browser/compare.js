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
      // checkbox.addEventListener("click", requestSessionWithRetry(file));
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);

        table.appendChild(row);

        if (index < 5) {
          checkbox.checked = true; 
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
      const timestamps = [];
      const avgAngles = [];

      for (const item of data.averageAngles) {
        timestamps.push(item.timestamp);
        avgAngles.push(item.avgAngle);
      }

      document.getElementById("totalStrokes").textContent = data.numStrokes;

      new Chart(document.getElementById("bar-chart"), {
        type: "bar",
        data: {
          labels: timestamps,
          datasets: [
            {
              label: "Population (millions)",
              data: avgAngles,
            },
          ],
        },
        options: {
          legend: { display: false },
          title: {
            display: true,
            text: "U.S population",
          },
        },
      });
    })
    .catch((error) => console.log(error));
}
