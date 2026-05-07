const getLocalDate = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

const changeToLocalDate = (date) => {
  return new Date(new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
};

// 24 hours ago
const get24HoursStartTime = () => {
  const date = getLocalDate();
  date.setHours(date.getHours() - 24);
  return date;
};

// 48 hours ago
const get48HoursStartTime = () => {
  const date = getLocalDate();
  date.setHours(date.getHours() - 48);
  return date;
};

const getLast2MinutesStartTime = () => {
  const date = getLocalDate();
  date.setMinutes(date.getMinutes() - 2);
  return date;
};

const getLast5MinutesStartTime = () => {
  const date = getLocalDate();
  date.setMinutes(date.getMinutes() - 5);
  return date;
};

const getLast10MinutesStartTime = () => {
  const date = getLocalDate();
  date.setMinutes(date.getMinutes() - 10);
  return date;
};

const getTodayStartTime = () => {
  const indiaDateString = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const indiaDate = new Date(indiaDateString);
  const midNightIndiaDate = new Date();
  midNightIndiaDate.setHours(midNightIndiaDate.getHours() - indiaDate.getHours());
  midNightIndiaDate.setMinutes(midNightIndiaDate.getMinutes() - indiaDate.getMinutes());
  midNightIndiaDate.setSeconds(midNightIndiaDate.getSeconds() - indiaDate.getSeconds());
  return midNightIndiaDate;
}

const getTodayEndTime = () => {
  const indiaDateString = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const indiaDate = new Date(indiaDateString);
  const midNightIndiaDate = new Date();
  midNightIndiaDate.setHours(midNightIndiaDate.getHours() + (23 - indiaDate.getHours()));
  midNightIndiaDate.setMinutes(midNightIndiaDate.getMinutes() + (59 - indiaDate.getMinutes()));
  midNightIndiaDate.setSeconds(midNightIndiaDate.getSeconds() + (59 - indiaDate.getSeconds()));
  return midNightIndiaDate;
}

const getLocalMidDate = (date) => {
  const indiaDateString = new Date(new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const indiaDate = new Date(indiaDateString);
  const midDayIndiaDate = new Date(date);
  midDayIndiaDate.setHours(midDayIndiaDate.getHours() + (12 - indiaDate.getHours()));
  return midDayIndiaDate;
}

const getLocalStartTime = (date) => {
  const indiaDateString = new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const indiaDate = new Date(indiaDateString);
  const midNightIndiaDate = new Date();
  midNightIndiaDate.setHours(midNightIndiaDate.getHours() - indiaDate.getHours());
  midNightIndiaDate.setMinutes(midNightIndiaDate.getMinutes() - indiaDate.getMinutes());
  midNightIndiaDate.setSeconds(midNightIndiaDate.getSeconds() - indiaDate.getSeconds());
  return midNightIndiaDate;
}

const getLocalEndTime = (date) => {
  const indiaDateString = new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const indiaDate = new Date(indiaDateString);
  const midNightIndiaDate = new Date();
  midNightIndiaDate.setHours(midNightIndiaDate.getHours() + (23 - indiaDate.getHours()));
  midNightIndiaDate.setMinutes(midNightIndiaDate.getMinutes() + (59 - indiaDate.getMinutes()));
  midNightIndiaDate.setSeconds(midNightIndiaDate.getSeconds() + (59 - indiaDate.getSeconds()));
  return midNightIndiaDate;
}

const padTo2Digits = (num) => {
  return num.toString().padStart(2, '0');
}

const formatDate = (date) => {
  return (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join('-') +
    ' ' +
    [
      padTo2Digits(date.getHours()),
      padTo2Digits(date.getMinutes()),
      '00',
    ].join(':')
  );
}
const formatOnlyDate = (date) => {
  date = new Date(date);
  return (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join('-')
  );
}
const compareDatesWithoutTime = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  d1.setHours(0, 0, 0, 0); // Strip time
  d2.setHours(0, 0, 0, 0);

  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
};

module.exports = {
  getLocalDate,
  changeToLocalDate,
  getTodayStartTime,
  getTodayEndTime,
  getLocalStartTime,
  getLocalEndTime,
  formatDate,
  formatOnlyDate,
  getLocalMidDate,
  compareDatesWithoutTime,
  get24HoursStartTime,
  get48HoursStartTime,
  getLast2MinutesStartTime,
  getLast5MinutesStartTime,
  getLast10MinutesStartTime
}