export function getNumStrokes(data) {
  const averageAngles = averageAngle(data);
  const locals        = getLocals(averageAngles);
  console.log(calculateNumStrokes(
    locals.max,
    locals.min
  ))
  return { averageAngles : averageAngles, locals : locals }
}

function averageAngle(data) {
  const result = [];
  const averageAngles = data.map((obj) => {
    const roll  = parseFloat(obj.roll) - 180;
    const pitch = parseFloat(obj.pitch) - 180;
    const yaw   = parseFloat(obj.yaw) - 180;

    result.push({
      timestamp: obj.timestamp,
      avgAngle: (roll + pitch + yaw) / 3,
    });
  });
  return result;
}

function getLocals(data) {
  const invertedData = data.map((item) => {
    return { timestamp: item.timestamp, avgAngle: -item.avgAngle };
  });
  
  let angleSum = 0;
  for (let i = 0; i < data.length; i++) {
    angleSum += data[i].avgAngle;
  }
  const averageAngle = angleSum / data.length;

  if (averageAngle > 0) 
    return {max : computeMinMax(data, averageAngle), min:computeMinMax(averageAngle, -averageAngle)};
  else
    return {max : computeMinMax(invertedData, -averageAngle), min : computeMinMax(data, averageAngle)};
}

function computeMinMax(data, averageAngle) {
  let limit;
  let locals = [];
  if (averageAngle > 0) {
    const globalMax = Math.max(...data.map(obj => obj.avgAngle));
    for (let i = 0; i < data.length; i++) {
      if ((data[i].avgAngle >= globalMax / 2)) { 
        var lastIndex = locals[locals.length - 1];
        if (!lastIndex || (i - lastIndex) >= 100) {
          locals.push(i); 
        }
      }
    }
  } else {
    const globalMin = Math.min(...data.map(obj => obj.avgAngle));
    for (let i = 0; i < data.length; i++) {
      if ((data[i].avgAngle >= globalMin / 2)) { 
        var lastIndex = locals[locals.length - 1];
        if (!lastIndex || (i - lastIndex) >= 100) {
          locals.push(i); 
        }
      }
    }
  }
  console.log(locals)
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
