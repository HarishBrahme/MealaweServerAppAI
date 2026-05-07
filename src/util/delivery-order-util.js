
const getOrientations = (item) => {
  const { width, height, length } = item;
  return [
    { w: width, h: height, l: length },
    { w: width, h: length, l: height },
    { w: height, h: width, l: length },
    { w: height, h: length, l: width },
    { w: length, h: width, l: height },
    { w: length, h: height, l: width }
  ];
}

getMinBoxWithRotation = (items) => {
  let minVolume = Infinity;
  let bestBox = null;

  // Generate all combinations of orientations
  function generate(index, currentCombo) {
    if (index === items.length) {
      // Stack items in one direction (height), find max width and length
      let totalHeight = 0;
      let maxWidth = 0;
      let maxLength = 0;

      for (const item of currentCombo) {
        totalHeight += item.h;
        maxWidth = Math.max(maxWidth, item.w);
        maxLength = Math.max(maxLength, item.l);
      }

      const volume = totalHeight * maxWidth * maxLength;
      if (volume < minVolume) {
        minVolume = volume;
        bestBox = {
          width: maxWidth,
          height: totalHeight,
          length: maxLength,
          volume: volume
        };
      }
      return;
    }

    const orientations = getOrientations(items[index]);
    for (const o of orientations) {
      generate(index + 1, [...currentCombo, o]);
    }
  }

  generate(0, []);

  return bestBox;
}


module.exports = { getMinBoxWithRotation }