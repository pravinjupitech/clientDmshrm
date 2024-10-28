import React, { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import * as tf from '@tensorflow/tfjs';
const faceLandmarksDetection = require('@tensorflow-models/face-landmarks-detection');

const Capture2 = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [count, setCount] = useState(0);
  const [model, setModel] = useState(null);
  const [maxLeft, setMaxLeft] = useState(0);
  const [maxRight, setMaxRight] = useState(0);
  const webcamRef = useRef(null);

  useEffect(() => {
    tf.setBackend('webgl');
    loadModel();
  }, []);

  const loadModel = async () => {
    // console.log("loading modal...");
    // Load the MediaPipe Facemesh package.
    faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
        { maxFaces: 1 }
      ).then(model => {
        // console.log(model);
        setModel(model);
      }).catch(err => {
        console.log(err);
      });
  }

  const handleClick = () => {
    // console.log('handleClick');
    const newIsOpen = !isOpen;
    const newCount = isOpen ? count : 0;
    setIsOpen(newIsOpen);
    setCount(newCount);
  }
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setText('detecting...');
        // console.log("detecting...");
        detectPoints();
      }, 2000);
    }
  }, [isOpen]);

  const detectPoints = async () => {
    const video = await webcamRef.current.video;

    try {
    const predictions = await model.estimateFaces({
        input: video,
        returnTensors: false,
        flipHorizontal: true,
        predictIrises: true
        });
    
        if (predictions.length > 0) {
        // Somente 1 face
        const keypoints = predictions[0].scaledMesh;
        if (detectarBlink(keypoints)) {
            // TODO :: Found blink, do someting
            const countN = count + 1
            setCount(countN);
    
            if (!isOpen) {
            // stop detection
            setText('');
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

    setTimeout(async () => {
      await detectPoints();
    }, 1000);
  }

  const detectarBlink = (keypoints) => {
    const leftEye_left = 263;
    const leftEye_right = 362;
    const leftEye_top = 386;
    const leftEye_buttom = 374;
    const rightEye_left = 133;
    const rightEye_right = 33;
    const rightEye_top = 159;
    const rightEye_buttom = 145;

    const leftVertical = calculateDistance(keypoints[leftEye_top][0], keypoints[leftEye_top][1], keypoints[leftEye_buttom][0], keypoints[leftEye_buttom][1]);
    const leftHorizontal = calculateDistance(keypoints[leftEye_left][0], keypoints[leftEye_left][1], keypoints[leftEye_right][0], keypoints[leftEye_right][1]);
    const eyeLeft = leftVertical / (2 * leftHorizontal);

    const rightVertical = calculateDistance(keypoints[rightEye_top][0], keypoints[rightEye_top][1], keypoints[rightEye_buttom][0], keypoints[rightEye_buttom][1]);
    const rightHorizontal = calculateDistance(keypoints[rightEye_left][0], keypoints[rightEye_left][1], keypoints[rightEye_right][0], keypoints[rightEye_right][1]);
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
      if ((eyeLeft < baseCloseEye) && (eyeRight < baseCloseEye)) {
        result = true;
      }
//    }
    // console.log(maxLeft);
    // console.log(limitOpenEye);
    // console.log(maxRight);
    // console.log(limitOpenEye);
    // console.log(eyeLeft);
    // console.log(baseCloseEye);
    // console.log(eyeRight);
    // console.log(baseCloseEye);
    // console.log(result);

    return result;
  }

  const calculateDistance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
  }

  const videoConstraints = {
    width: 720,
    height: 480,
    facingMode: "user"
  };

  return (
    <div style={{ margin: 20 }}>
      <div>
        <button type="button" onClick={() => handleClick()}>Start/Stop</button>
        <b> {text} </b>
        <b> :: Count blink = {count} </b>
      </div>

      {isOpen ?
        <Webcam
          audio={false}
          height={480}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={720}
          videoConstraints={videoConstraints}
        />
        : null
      }
    </div>
  );
}

export default Capture2;