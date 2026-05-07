const { Client } = require("@googlemaps/google-maps-services-js");
const axios = require('axios');
const { getGeoFencingList } = require("../service/geoFencing.service");
const pointInPolygon = require('point-in-polygon');
const GoogleKeys = [
  'AIzaSyCtIAU1RAa32Y9at1VnmL-fa79AP0NPreQ',
  'AIzaSyCmr-5IADqvdD7ot82A4k9nQzA-dkpeq8M',
  'AIzaSyCz__RVzMB1DZcBCK69hDpOHPNeZbuV9oU',
  'AIzaSyA4y8_4KQNIEHOQqMrtjYtCZpkJsC_Wv9A',
  'AIzaSyBhKCD_QFW8RMjs-MAZaEmWg-v45r7BsUI',
  'AIzaSyDM1xo_P6s-jDo6mU-UeO4RkozvOQu5hkE',
  'AIzaSyDXcHyUmI63me0FOpK4gx1XpD_KoaBxjUo',
  'AIzaSyA6IuuFObd5AVrL0T4BwczNQKL2a7cLewg',
  'AIzaSyBM_YbgvpwSq6D2xZl1hf4kuMt0w85R4xA',
  'AIzaSyByJhV9h4HE9jTlOenAgVNQbzDjL7J4IlY'
];

const client = new Client({ axiosInstance: axios });
const requestQueue = [];
let requestProcessingCount = 0;
let geoClusterList;

getKitchenGoogleDistance = (origins, destinations) => {
  return new Promise((resolve, reject) => {
    const googleKey = GoogleKeys[Math.floor(Math.random() * GoogleKeys.length)];
    const params = {
      origins,
      destinations,
      key: googleKey
    };
    client.distancematrix({ params }).then(result => {
      if (result && result.data && result.data.rows && result.data.rows.length > 0) {
        const finalResult = [];
        result.data.rows.forEach(row => {
          finalResult.push(row.elements[0])
        });
        resolve(finalResult);
      } else {
        resolve([]);
      }
    })
      .catch(e => {
        // console.log(e);
        resolve([]);
      });
  });
}

requestGoogleDistance = (origins, destinations, increaseCounter) => {
  return new Promise(async (resolve, reject) => {
    if (increaseCounter) {
      requestProcessingCount++;
    }
    if (increaseCounter && requestProcessingCount > 20) {
      requestQueue.push({ origins, destinations, resolve, reject });
    } else {
      try {
        const result = await getKitchenGoogleDistance(origins, destinations);
        if (requestQueue && requestQueue.length > 0) {
          // console.log('inside queue',increaseCounter,requestProcessingCount,requestQueue.length);
          const queueRequestObj = requestQueue.shift();
          const res = await requestGoogleDistance(queueRequestObj.origins, queueRequestObj.destinations, false);
          queueRequestObj.resolve(res);
        }
        requestProcessingCount--;
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
  });
}

calulateDistance = (lat1, lon1, lat2, lon2) => {
  if ((lat1 == lat2) && (lon1 == lon2)) {
    return 0;
  }
  else {
    var radlat1 = Math.PI * lat1 / 180;
    var radlat2 = Math.PI * lat2 / 180;
    var theta = lon1 - lon2;
    var radtheta = Math.PI * theta / 180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    const distInMtr = parseFloat(dist * 1.609344 * 1000).toFixed(2);
    const distInKm = parseFloat(distInMtr / 1000).toFixed(2);

    const finalObj = { distance: { value: distInMtr, text: distInKm + 'km' }, status: 'OK' };
    return finalObj;
  }
}

getArialDistance = (origins, destinations) => {
  const finalResult = [];
  if (destinations && destinations.length > 0) {
    const distination = destinations[0];
    origins.forEach(kitchenLatlng => {
      if(kitchenLatlng){
      const distObj = calulateDistance(distination.lat, distination.lng, kitchenLatlng.lat, kitchenLatlng.lng);
      finalResult.push(distObj);
      }
    });
  }
  return finalResult;
}

checkLatLngInCluster = (latLngObj) => {
  return new Promise(async (resolve, reject) => {
    try {
      let geoFencinglist = [];
      if (geoClusterList) {
        geoFencinglist = geoClusterList;
      } else {
        geoClusterList = await getGeoFencingList();
        geoFencinglist = geoClusterList;
      }
      const mappedClusterList = []
      if (geoFencinglist && geoFencinglist.length > 0 && latLngObj && latLngObj.lat && latLngObj.lng) {
        let clusterFound = false;
        geoFencinglist.forEach((cluster) => {
          const polygon = cluster.clusterCoordinates.map(coordinateObj => [coordinateObj.lat, coordinateObj.lng]);
          clusterFound = pointInPolygon([latLngObj.lat, latLngObj.lng], polygon);
          // console.log(clusterFound,cluster.clusterId,cluster.clusterName);               
          if (clusterFound) {
            mappedClusterList.push({ clusterId: cluster.clusterId, clusterName: cluster.clusterName });
          }
        });
      }
      if (mappedClusterList.length > 0) {
        resolve(mappedClusterList[0]);
      } else {
        resolve(false)
      }

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  requestGoogleDistance,
  getArialDistance,
  checkLatLngInCluster
}
