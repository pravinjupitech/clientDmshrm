const faceLandmarksDetection = require("@tensorflow-models/face-landmarks-detection");

export const loadModel = async () => {
  console.log("loading modal...");
  // Load the MediaPipe Facemesh package.
  faceLandmarksDetection
    .load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
      maxFaces: 1,
    })
    .then(model => {
      // console.log(model);
      //   setModel(model);
      //   setText("ready for capture");
    })
    .catch(err => {
      console.log(err);
    });
};
