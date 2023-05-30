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

function listSessionsWithRetry() {
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