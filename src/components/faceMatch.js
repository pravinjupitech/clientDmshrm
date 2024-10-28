// import React from "react";

// export default function faceMatch() {
//   const convertFileToBuffer = (file) => {
//     const reader = new FileReader();
//     reader.onload = () => {
//       // reader.result is an ArrayBuffer
//       setFileBuffer(reader.result);
//       console.log(reader.result); // You can see the buffer in the console
//     };
//     reader.readAsArrayBuffer(file);
//   };
//   const detect = async () => {
//     let buffer = await convertFileToBuffer(file);
//     const imageBuffer = buffer;

//     const imageBase64 = `data:${
//       file.mimetype
//     };base64,${imageBuffer.toString("base64")}`;

//     const registeredUsers = await User.find({ database: req.body.database });

//       const options = {
//         returnEarlyThreshold: 100,
//       };

//       for (let i = 0; i < registeredUser.descriptions.length; i++) {
//         registeredUser.descriptions[i] = new Float32Array(
//           Object.values(registeredUser.descriptions[i])
//         );
//       }
//       const faces = new faceapi.LabeledFaceDescriptors(
//         registeredUser.panNo,
//         registeredUser.descriptions
//       );
//       const faceMatcher = new faceapi.FaceMatcher(faces, 0.6);
//       const img = await loadImage(buffer);
//       let temp = faceapi.createCanvasFromMedia(img);
//       const displaySize = { width: img.width, height: img.height };
//       faceapi.matchDimensions(temp, displaySize);

//       const detections = await faceapi
//         .detectSingleFace(img)
//         .withFaceLandmarks()
//         .withFaceDescriptor();
//       const misMatchPercentage = faceapi.euclideanDistance(
//         detections.descriptor,
//         registeredUser.descriptions[0]
//       );
//       console.log("misMatchPercentage", misMatchPercentage);

//       const resizedDetections = faceapi.resizeResults(detections, displaySize);
//       const result = faceMatcher.findBestMatch(resizedDetections.descriptor);

//       console.log("results", result);
//       if (misMatchPercentage <= 0.5) {
//         await attendance(registeredUser, req.body);
//         console.log("success");
//         return res
//           .status(200)
//           .json({ registeredUser, message: "User logged in successfully!" });
//       } else {
//         console.log("fail");
//         // return res.status(404).json("User Not Found!");

//       }

//   };

//   return <div>faceMatch</div>;
// }
