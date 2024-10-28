import React, { useEffect, useState, useRef } from "react";
import Webcam from "react-webcam";
import axios from "axios";
// import { Navigate, useLocation, useNavigate } from "react-router-dom";
import * as tf from "@tensorflow/tfjs";

const faceLandmarksDetection = require("@tensorflow-models/face-landmarks-detection");

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    database: "",
    lastName: "",
    mobile: "",
    image: null,
  });
  const webcamRef = useRef(null);
  const [showWebcam, setShowWebcam] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("modal loading...");
  const [count, setCount] = useState(0);
  const [model, setModel] = useState(null);
  const [maxLeft, setMaxLeft] = useState(0);
  const [maxRight, setMaxRight] = useState(0);
  const [backloading, setBackloading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    tf.setBackend("webgl");
    // console.log("backend set");
    loadModel();
  }, []);

  const loadModel = async () => {
    // console.log("loading modal...");
    // Load the MediaPipe Facemesh package.
    faceLandmarksDetection
      .load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
        maxFaces: 1,
      })
      .then((model) => {
        // console.log(model);
        setModel(model);
        setText("ready for capture");
      })
      .catch((err) => {
        console.log(err);
      });
  };
  //facedetection modals

  const handleClick = () => {
    // console.log("handleClick");
    const newIsOpen = !isOpen;
    const newCount = isOpen ? count : 0;
    setIsOpen(newIsOpen);
    setCount(newCount);
  };
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setText("detecting...");
        console.log("detecting...");
        detectPoints();
      }, 2000);
    }
  }, [isOpen]);
  const detectPoints = async () => {
    if (isOpen === false) return;

    try {
      const video = await webcamRef.current.video;

      const predictions = await model.estimateFaces({
        input: video,
        returnTensors: false,
        flipHorizontal: true,
        predictIrises: true,
      });

      if (predictions.length > 0) {
        // Somente 1 face
        const keypoints = predictions[0].scaledMesh;
        if (detectarBlink(keypoints)) {
          // TODO :: Found blink, do something

          setShowWebcam(false);

          const countN = count + 1;
          setCount(countN);
          setIsOpen(false);

          //console.log("cant", countN);
          // console.log("isopen", isOpen);

          handleCapture();
          handleClick();

          if (!isOpen) {
            // stop detection
            setText("");
            return null;
          }
        }
      } else {
        setMaxLeft(0);
        setMaxRight(0);
      }
    } catch (error) {
      console.log(error);
    }
    if (!isOpen) {
      // stop detection
      setText("");
      return null;
    }
    setTimeout(async () => {
      await detectPoints();
    }, 100);
  };

  const detectarBlink = (keypoints) => {
    const leftEye_left = 263;
    const leftEye_right = 362;
    const leftEye_top = 386;
    const leftEye_buttom = 374;
    const rightEye_left = 133;
    const rightEye_right = 33;
    const rightEye_top = 159;
    const rightEye_buttom = 145;

    const leftVertical = calculateDistance(
      keypoints[leftEye_top][0],
      keypoints[leftEye_top][1],
      keypoints[leftEye_buttom][0],
      keypoints[leftEye_buttom][1]
    );
    const leftHorizontal = calculateDistance(
      keypoints[leftEye_left][0],
      keypoints[leftEye_left][1],
      keypoints[leftEye_right][0],
      keypoints[leftEye_right][1]
    );
    const eyeLeft = leftVertical / (2 * leftHorizontal);

    const rightVertical = calculateDistance(
      keypoints[rightEye_top][0],
      keypoints[rightEye_top][1],
      keypoints[rightEye_buttom][0],
      keypoints[rightEye_buttom][1]
    );
    const rightHorizontal = calculateDistance(
      keypoints[rightEye_left][0],
      keypoints[rightEye_left][1],
      keypoints[rightEye_right][0],
      keypoints[rightEye_right][1]
    );
    const eyeRight = rightVertical / (2 * rightHorizontal);

    const baseCloseEye = 0.1;
    const limitOpenEye = 0.14;
    if (maxLeft < eyeLeft) {
      setMaxLeft(eyeLeft);
    }
    if (maxRight < eyeRight) {
      setMaxRight(eyeRight);
    }

    let result = false;
    //    if ((maxLeft > limitOpenEye) && (maxRight > limitOpenEye)) {
    if (eyeLeft < baseCloseEye && eyeRight < baseCloseEye) {
      result = true;
      setIsOpen(false);
      //        console.log("isopen", isOpen);
    }
    //      console.log("isopen", isOpen);
    //    }

    console.log(result);

    return result;
  };

  const calculateDistance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  };

  const videoConstraints = {
    width: 720,
    height: 480,
    facingMode: "user",
  };
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const capture = () => {
    setShowWebcam(true);
    handleClick();
  };

  const handleCapture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setFormData({
      ...formData,
      image: imageSrc,
    });

    //console.log(topLeft);
    //console.log(bottomRight);
    //console.log('data', webcamRef.current);

    setShowWebcam(false);
  };

  function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("mobile", formData.mobile);
      formDataToSend.append("image", dataURItoBlob(formData.image));

      setBackloading(true);

      const response = await axios.post(
        "http://89.116.21.59:4000/register",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // console.log(response);
      setRegistered(true);

      // Reset form after successful submission
      setFormData({
        name: "",
        database: "",
        lastName: "",
        mobile: "",
        image: null,
      });
    } catch (error) {
      console.error("Error registering:", error);
    }
  };

  return (
    <>
      {model == null ? (
        <>
          <h1>Wait while model loading...</h1>
        </>
      ) : (
        <>
          <div className="max-w-md mx-auto mt-10 p-4 border rounded-md shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Register</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-1" htmlFor="name">
                  Name:
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="border rounded-md px-2 py-1 w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1" htmlFor="lastName">
                  Last Name:
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="border rounded-md px-2 py-1 w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1" htmlFor="mobileNumber">
                  Mobile Number:
                </label>
                <input
                  type="text"
                  id="mobileNumber"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="border rounded-md px-2 py-1 w-full"
                  required
                />
              </div>

              <div className="mb-4">
                <button
                  type="button"
                  onClick={capture}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Capture Image
                </button>
                <p>{text}</p>
              </div>
              {showWebcam && (
                <div className="mb-4">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="mb-2"
                  />
                  <button
                    type="button"
                    onClick={handleCapture}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  >
                    Take Picture
                  </button>
                </div>
              )}
              {formData.image && (
                <div className="mb-4">
                  <img src={formData.image} alt="Captured" className="mb-2" />
                </div>
              )}
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                Register
              </button>
              {backloading && <p>Wait for a minute.</p>}
              {registered && <p>Registered.</p>}
            </form>
            <div></div>
          </div>
        </>
      )}
    </>
  );
};

export default SignUpForm;
