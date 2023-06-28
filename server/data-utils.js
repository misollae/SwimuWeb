export function getNumStrokes(data) {
  console.log(data)
  data = module2(data)
  const averageAngles = averageAngle(data);
  const locals        = getBothLocals(averageAngles);

  console.log(locals)
  console.log(calculateNumStrokes(
    locals.max,
    locals.min
  ))
  return { averageAngles : averageAngles, locals : locals }
}


function module2(data) {
  const averageAngles = averageAngle(data);
  let angleSum = 0;
  for (let i = 0; i < averageAngles.length; i++) {
    angleSum += averageAngles[i].avgAngle;
  }
  var avgAngle = angleSum / data.length;
  var localIdx = (avgAngle > 0) ? computeMax(averageAngles, avgAngle) : computeMin(averageAngles, avgAngle)
  return data.slice(localIdx[0], localIdx[localIdx.length - 1])
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

function getBothLocals(data) {
  const invertedData = data.map((item) => {
    return { timestamp: item.timestamp, avgAngle: -item.avgAngle };
  });
  
  let angleSum = 0;
  for (let i = 0; i < data.length; i++) {
    angleSum += data[i].avgAngle;
  }
  const averageAngle = angleSum / data.length;

  if (averageAngle > 0) 
    return {max : computeMax(data, averageAngle), min:computeMin(invertedData, -averageAngle)};
  else
    return {max : computeMax(invertedData, -averageAngle), min : computeMin(data, averageAngle)};
}


function computeMax(data) {
  let limit;
  let locals = [];
  const globalMax = Math.max(...data.map(obj => obj.avgAngle));
  for (let i = 0; i < data.length; i++) {
    if ((data[i].avgAngle >= globalMax / 2)) { 
      var lastIndex = locals[locals.length - 1];
      if (!lastIndex || (i - lastIndex) >= 100) {
        locals.push(i); 
      }
    }
  }
  return locals;
}

function computeMin(data) {
  let limit;
  let locals = [];
  const globalMin = Math.min(...data.map(obj => obj.avgAngle));
    for (let i = 0; i < data.length; i++) {
      if ((data[i].avgAngle >= globalMin / 2)) { 
        var lastIndex = locals[locals.length - 1];
        if (!lastIndex || (i - lastIndex) >= 100) {
          locals.push(i); 
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
