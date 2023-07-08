export function getNumStrokes(data) {
  data = module2(data)
  const averageAngles = averageAngle(data);
  const locals        = getBothLocals(averageAngles);
  //const numStrokes = calculateNumStrokes(locals.max, locals.min)
  
  const lapStarts = getNumLaps(locals.max);
  const dataSubarray = [];
  for (let i = 0; i < lapStarts.length - 1; i++) {
    const start = lapStarts[i];
    const end = lapStarts[i + 1];
    const subarray = averageAngles.slice(start, end);
    dataSubarray.push(subarray);
  }  

  const strokesPerLap = []
  const timePerLap    = []
  const swolfPerLap   = []
  const lapsData      = []
  for (let i = 0; i < dataSubarray.length; i++) {
    const subarray = dataSubarray[i];
    let subarrayLocals = getBothLocals(subarray);
    let strokes = calculateNumStrokes(subarrayLocals.max, subarrayLocals.min);
    let time    = getTotalTime(subarray);
    let swolf   = Math.round(strokes + time);
    strokesPerLap.push(strokes);
    timePerLap.push(time);
    swolfPerLap.push(swolf);
  
    lapsData.push({
      lap: i + 1,
      "SWOLF Score": swolf,
      swimStyle: "Freestyle"
    });
  }

  const numStrokes = strokesPerLap.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  const avgLapTime = timePerLap.reduce((sum, value) => sum + value, 0)  / timePerLap.length;

  const swolfStudy = {
    average: swolfPerLap.reduce((acc, val) => acc + val, 0) / swolfPerLap.length,
    highest: Math.max(...swolfPerLap),
    lowest: Math.min(...swolfPerLap)
  };

  return { averageAngles : averageAngles, 
           numStrokes: numStrokes, 
           totalTime: getTotalTime(averageAngles), 
           avgTime: avgLapTime, 
           numLaps: lapStarts.length - 1,
           lapInfo: lapsData,
           swolfStudy: swolfStudy}
}

function getTotalTime(data) {
  /*let seconds = (data[data.length - 1].timestamp - data[0].timestamp)/1000

  var hours = Math.floor(seconds / 3600);
  var minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0 && minutes === 0) {
    return "<00:01";
  }

  var hoursString = hours.toString().padStart(2, "0");
  var minutesString = minutes.toString().padStart(2, "0");*/

  return (data[data.length - 1].timestamp - data[0].timestamp)/1000;
}

function module2(data) {
  const averageAngles = averageAngle(data);  
  var localIdx = computeMax(averageAngles, true);
  return data.slice(localIdx[1], localIdx[localIdx.length - 2])
}

function averageAngle(data) {
  const result = [];
  const averageAngles = data.map((obj) => {
    const roll  = parseFloat(obj.roll);
    const pitch = parseFloat(obj.pitch);
    const yaw   = parseFloat(obj.yaw);

    result.push({
      timestamp: obj.timestamp,
      avgAngle: (roll + pitch + yaw) / 3,
    });
  });
  return result;
}

function getNumLaps(localMaximaIndices) {
  let lapStarts = [];

  let sumOfDifferences = 0;
  for (let i = 1; i < localMaximaIndices.length; i++) {
    sumOfDifferences += localMaximaIndices[i] - localMaximaIndices[i - 1];
  }
  const averageDifference = sumOfDifferences / (localMaximaIndices.length - 1);
  let sumOfSquaredDifferences = 0;
  for (let i = 1; i < localMaximaIndices.length; i++) {
    const difference = localMaximaIndices[i] - localMaximaIndices[i - 1];
    sumOfSquaredDifferences += Math.pow(difference - averageDifference, 2);
  }

  const variance = sumOfSquaredDifferences / (localMaximaIndices.length - 1);
  const standardDeviation = Math.sqrt(variance);

  for (let i = 0; i < localMaximaIndices.length; i++) {
    const currentMaxIndex = localMaximaIndices[i];
    const nextMaxIndex = localMaximaIndices[i + 1];
    if (nextMaxIndex - currentMaxIndex < averageDifference - standardDeviation/1.15) {
      lapStarts.push(localMaximaIndices[i]);
    } 
  }

  lapStarts.push(localMaximaIndices[localMaximaIndices.length-1])

  return lapStarts;
}

function getBothLocals(data) {
  const invertedData = data.map((item) => {
    return { timestamp: item.timestamp, avgAngle: -item.avgAngle + 360 };
  });

  return {max : computeMax(data), min:computeMax(invertedData)};
}

function computeMax(data, clean = false) {
  let locals = [];
  let localV = [];
  const globalMax = Math.max(...data.map(obj => obj.avgAngle));
  const globalMin = Math.min(...data.map(obj => obj.avgAngle));
  const maxLimit  = clean ? (globalMax + globalMin) / 2 : (globalMax + globalMin) / 2.5;

  for (let i = 0; i < data.length; i++) {
    let isLimit = (i == 0) || (i == data.length -1);
    if (isLimit || (data[i].avgAngle > data[i + 1].avgAngle && data[i].avgAngle > data[i - 1].avgAngle)) {
      if (data[i].avgAngle >= maxLimit) { 
        var lastIndex = locals[locals.length - 1];
        if (!lastIndex || (i - lastIndex) >= 100) {
          locals.push(i); 
          localV.push(data[i].timestamp);
        }
      }
    }
  }
  return locals;
}

function computeMin(data) {
  data = data.map((item) => {
    return { timestamp: item.timestamp, avgAngle: -item.avgAngle + 360 };
  });

  let limit;
  let locals = [];
  let localV = [];
  const globalMax = Math.max(...data.map(obj => obj.avgAngle));
  const minLimit  = globalMax/2;
  for (let i = 0; i < data.length; i++) {
    let isLimit = (i == 0) || (i == data.length -1);
    if (isLimit || (data[i].avgAngle > data[i + 1].avgAngle && data[i].avgAngle > data[i - 1].avgAngle)) {
      if (data[i].avgAngle) { 
        var lastIndex = locals[locals.length - 1];
        if (!lastIndex || (i - lastIndex) >= 100) {
          locals.push(i); 
          localV.push(data[i].timestamp);
        }
      }
    }
  }
  return locals;
}

function calculateNumStrokes(localMaximaIndices, localMinimaIndices) {
  if (localMaximaIndices.length < 2 || localMinimaIndices.length < 1) {
    return 0;
  }

  let strokeCount = 0;

  for (let i = 0; i < localMaximaIndices.length - 1; i++) {
    const currentMaxIndex = localMaximaIndices[i];
    const nextMaxIndex = localMaximaIndices[i + 1];

    const minimaBetweenMaxima = localMinimaIndices.filter(
      (minIndex) => minIndex > currentMaxIndex && minIndex < nextMaxIndex
    );

    if (minimaBetweenMaxima.length > 0) {
      const averageInstances = (nextMaxIndex - currentMaxIndex) / 2;

      let validInstances = true;
      for (const minIndex of minimaBetweenMaxima) {
        const numInstances = minIndex - currentMaxIndex;
        if (numInstances >= averageInstances * 2) {
          validInstances = false;
          break;
        }
      }

      if (validInstances) {
        strokeCount++;
      }
    }
  }

  return strokeCount;
}
