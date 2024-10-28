import React, { useEffect, useState, useRef } from "react";
import Webcam from "react-webcam";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import * as tf from "@tensorflow/tfjs";
import { Button, Col, Form, Input, Label, Row } from "reactstrap";
import axiosConfig from "./../../axiosConfig";
import axiosConfigApp from "./../../axiosConfigApp";
import axiosConfigThirdpartyApp from "../../axiosConfigThirdpartyApp";
import axiosConfigOne from "./../../axiosCofigOne";
import axiosConfigThirdParty from "./../../axiosConfitthirdparty";
import {
  Login,
  Recognize,
  Recognizevianode,
  Save_location,
  SaveData,
} from "../../EndPoint/EndPoint";
import Header from "../../components/Header";
import logo from ".././../assets/images/logo.png";
import swal from "sweetalert";
import { ToastContainer, toast } from "react-toastify";
import { RiArrowGoBackFill, RiLogoutCircleRLine } from "react-icons/ri";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import axios from "axios";
import Cropper from "react-cropper";
import { CustomerApplogin, Customer_App_Shift } from "./APPEndPoint";

const faceLandmarksDetection = require("@tensorflow-models/face-landmarks-detection");

const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

let currentDate;
const Loginform = (args) => {
  const navigate = useNavigate();
  const [modal, setModal] = useState(false);
  currentDate = moment();

  const toggle = () => setModal(!modal);
  const [formData, setFormData] = useState({
    mobile: "",
    image: null,
  });
  const [imageUrl, setImageUrl] = useState("");
  const [croppedImageUrl, setCroppedImageUrl] = useState("");
  const webcamRef = useRef(null);
  const [image, setImage] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [MarkAttendenceData, setMarkAttendenceData] = useState({});
  const lastCallTimeRef = useRef(Date.now());
  const cropperRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("modal loading...");
  const [count, setCount] = useState(0);
  const [model, setModel] = useState(null);
  const [maxLeft, setMaxLeft] = useState(0);
  const [maxRight, setMaxRight] = useState(0);
  const [Registration, setRegistration] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [LoginData, setLogin] = useState({});
  const [Timing, setTiming] = useState([]);
  const [LoginScreen, setLoginScreen] = useState(true);
  const [checkInTime, setCheckInTime] = useState(getCurrentTime());
  const [shift, setShift] = useState({});

  const [LoginButton, setLoginButton] = useState("Submit");
  const [msgLocation, setMsgLocation] = useState({
    Latitude: " ",
    Longitude: "",
  });
  const ShiftTiming = () => {
    (async () => {
      let userId = JSON.parse(localStorage.getItem("AppUserData"));
      await axiosConfigApp
        .get(`${Customer_App_Shift}/${userId?._id}`)
        .then((res) => {
          if (res?.data?.Shift?.length > 0) {
            setTiming(res?.data?.Shift);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    })();
  };
  useEffect(() => {
    ShiftTiming();
    getLocation();

    tf.setBackend("webgl");
    loadModel();
    let userData = JSON.parse(localStorage.getItem("AppUserData"));
    if (!!userData) {
      setLoginScreen(false);
    }
  }, []);
  const isTimeWithinRange = (time, startTime, endTime) => {
    const parseTime = (t) => {
      const [hours, minutes, seconds] = t.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    const timeToCheck = parseTime(time);
    const start = parseTime(startTime);
    const end = parseTime(endTime);

    if (end < start) {
      return timeToCheck >= start || timeToCheck <= end;
    } else {
      return timeToCheck >= start && timeToCheck <= end;
    }
  };

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
        capture();
      })
      .catch((err) => {
        console.log(err);
      });
  };
  function showPosition(position) {
    setMsgLocation({
      Latitude: position.coords.latitude,
      Longitude: position.coords.longitude,
    });
  }
  function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition);
    } else {
      setMsgLocation("");
    }
  }
  const handleClick = () => {
    const newIsOpen = !isOpen;
    const newCount = isOpen ? count : 0;
    setIsOpen(newIsOpen);
    setCount(newCount);
  };
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setText("detecting...");
        detectPoints();
        getLocation();
      }, 2000);
    }
  }, [isOpen]);

  const detectPoints = async () => {
    if (isOpen == false) return;
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
          // TODO :: Found blink, do someting
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
      // console.log(error);
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
    // console.log("isopen:::::", isOpen);
    let result = false;
    //    if ((maxLeft > limitOpenEye) && (maxRight > limitOpenEye)) {
    if (eyeLeft < baseCloseEye && eyeRight < baseCloseEye) {
      result = true;
      setIsOpen(false);
      // console.log("isopen", isOpen);
    }
    // console.log("isopen", isOpen);
    //    }

    // console.log(result);

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
  const handleInputChange = (e) => {
    setLogin({
      ...LoginData,
      [e.target.name]: e.target.value,
    });
  };
  const capture = () => {
    setShowWebcam(true);
    handleClick();
  };

  const handleCapture = async () => {
    setShowWebcam(false);
    const imageSrc = webcamRef.current.getScreenshot();
    // setImageUrl(imageSrc);
    // setCroppedImageUrl(imageSrc);
    // handleFaceDetect(imageSrc);
    setImage(imageSrc);
    setFormData({
      ...formData,
      image: imageSrc,
      images: imageSrc,
    });
    if (Registration) {
      toggle();
    } else {
      // await handleSubmit(imageSrc);
    }
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

  //
  const handleCheckIn = () => {
    // const userShift = officeTimings.find(
    if (Timing?.length > 0) {
      const userShift = Timing?.find(
        (shift) =>
          isTimeWithinRange(checkInTime, shift.fromTime, shift.lateByTime) ||
          isTimeWithinRange(checkInTime, shift.toTime, shift.shortByTime)
      );

      if (userShift) {
        setShift(userShift.shift);
        return userShift;
      } else {
        setShift("No shift found");
        return "No shift found";
      }
    } else {
      swal("error", "Shift Data not found", "error");
      ShiftTiming();
    }
  };

  useEffect(() => {
    const handleCapture = async (newImage) => {
      const currentTime = Date.now();
      const timeSinceLastCall = currentTime - lastCallTimeRef.current;
      if (timeSinceLastCall < 8000) {
        // If the last call was made less than 10 seconds ago, do nothing
        return;
      }

      lastCallTimeRef.current = currentTime;
      // api calling here for mark attendance
      handleSubmit(newImage);
    };
    // if (croppedImageUrl) {
    //   handleCapture(croppedImageUrl);
    // }
    if (image) {
      handleCapture(image);
      // setCroppedImageUrl(image);
    }
  }, [image]);
  // }, [croppedImageUrl]);

  //
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr?.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };
  const isCurrentTimeBetween = (fromTimeStr, lateByTimeStr) => {
    const fromTimes = parseTime(fromTimeStr);
    const lateByTimes = parseTime(lateByTimeStr);
    const currentTime = new Date();

    return currentTime >= fromTimes && currentTime <= lateByTimes;
  };

  const AllAttendance = (uuid, imageSrc) => {
    let form = new FormData();
    currentDate = moment();
    const formattedDate = currentDate.format();
    const formattedTime = currentDate.format("h:mm:ss a");

    form.append("time", formattedTime);
    form.append("date", formattedDate?.split("T")[0]);
    form.append("uuid", uuid);
    form.append("image", imageSrc);
    form.append("latitude", msgLocation?.Latitude);
    form.append("longitude", msgLocation?.Longitude);

    (async () => {
      await axiosConfig
        .post("/markAttendance", form)
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    })();
  };
  const MarkAttendance = async (
    userinfo,
    imageSrc,
    image,
    shift,
    date,
    time,
    collectionid
  ) => {
    setShowWebcam(false);
    setTimeout(() => {
      setShowWebcam(true);
    }, 3000);
    // start of checking time
    // let spliteDate = date?.split("-");
    // let currentDate=`${spliteDate[2]}-${spliteDate[1]}-${spliteDate[0]}}`
    let payload = {
      collectionId: collectionid,
      image: image,
      database: userinfo?._id,
      shift: shift,
      // shift: shift,
      currentDate: date,
      currentTime: time,
      adminId: userinfo?._id,
    };
    const formdata = new FormData();
    formdata.append("collectionId", collectionid);
    formdata.append("database", userinfo?._id);
    formdata.append("adminId", userinfo?._id);
    formdata.append("image", image);
    formdata.append("shift", shift);
    formdata.append("currentDate", date);
    formdata.append("currentTime", time);
    // await axiosConfigThirdParty
    //   .post(Recognize, formdata)
    await axiosConfigThirdpartyApp
      .post(Recognize, payload)
      .then((res) => {
        debugger;
        let msg =
          res?.data?.fullName && res?.data?.fullName
            ? `${res?.data?.fullName} ${res?.data?.message}`
            : `${res?.data?.message}`;
        if (res?.status == 200) {
          let timerInterval;
          Swal.fire({
            title: msg,
            timer: 2000,
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading();
              const timer = Swal?.getPopup()?.querySelector("b");
              timerInterval = setInterval(() => {
                // timer.textContent = `${Swal.getTimerLeft()}`;
              }, 100);
            },
            willClose: () => {
              clearInterval(timerInterval);
            },
          }).then((result) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              // console.log("I was closed by the timer");
            }
          });
          setShowWebcam(true);
        }
        if (res?.status == "500") {
          let timerInterval;
          Swal.fire({
            title: "Error Occurred",
            timer: 2000,
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading();
              const timer = Swal?.getPopup()?.querySelector("b");
              timerInterval = setInterval(() => {
                // timer.textContent = `${Swal.getTimerLeft()}`;
              }, 100);
            },
            willClose: () => {
              clearInterval(timerInterval);
            },
          }).then((result) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              // console.log("I was closed by the timer");
            }
          });
          // setShowWebcam(true);
        }
      })
      .catch((err) => {
        let timerInterval;
        if (err?.response?.data?.error) {
          let error = err?.response?.data?.error;
          if (error) {
            Swal.fire({
              title: error,
              timer: 2000,
              timerProgressBar: true,
              didOpen: () => {
                Swal.showLoading();
                timerInterval = setInterval(() => {
                  // timer.textContent = `${Swal.getTimerLeft()}`;
                }, 100);
              },
              willClose: () => {
                clearInterval(timerInterval);
              },
            }).then((result) => {
              if (result.dismiss === Swal.DismissReason.timer) {
                // console.log("I was closed by the timer");
              }
            });
          }
        } else {
          Swal.fire({
            title: `${err?.response?.data?.error}`,
            timer: 2000,
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading();
              timerInterval = setInterval(() => {
                // timer.textContent = `${Swal.getTimerLeft()}`;
              }, 100);
            },
            willClose: () => {
              clearInterval(timerInterval);
            },
          }).then((result) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              // console.log("I was closed by the timer");
            }
          });
        }
        console.log(err);
      });
  };
  const MarkOutAttendance = async (
    userinfo,
    imageSrc,
    image,
    shift,
    date,
    time,
    collectionid
  ) => {
    setShowWebcam(false);
    setTimeout(() => {
      setShowWebcam(true);
    }, 3000);
    let payload = {
      collectionId: collectionid,
      image: image,
      database: userinfo?._id,
      // shift: shift,
      shift: shift,
      currentDate: date,
      currentTime: time,
      adminId: userinfo?._id,
    };
    const formdata = new FormData();

    formdata.append("collectionId", collectionid);
    formdata.append("database", userinfo?._id);
    formdata.append("adminId", userinfo?._id);
    formdata.append("image", image);
    formdata.append("shift", shift);
    formdata.append("currentDate", date);
    formdata.append("currentTime", time);
    // await axiosConfigThirdParty
    //   .post(Recognize, formdata)
    await axiosConfigThirdpartyApp
      .post(Recognize, payload)
      .then((res) => {
        console.log(res);
        if (res?.status == 200) {
          let msg = res?.data?.fullName
            ? `${res?.data?.fullName} ${res?.data?.message}`
            : `${res?.data?.message}`;
          let timerInterval;
          Swal.fire({
            title: msg,
            timer: 2000,
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading();
              const timer = Swal?.getPopup()?.querySelector("b");
              timerInterval = setInterval(() => {
                // timer.textContent = `${Swal.getTimerLeft()}`;
              }, 100);
            },
            willClose: () => {
              clearInterval(timerInterval);
            },
          }).then((result) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              // console.log("I was closed by the timer");
            }
          });
          // setShowWebcam(true);
        }
        if (res?.status == "500") {
          let timerInterval;
          Swal.fire({
            title: "Error Occurred",
            timer: 2000,
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading();
              const timer = Swal?.getPopup()?.querySelector("b");
              timerInterval = setInterval(() => {
                // timer.textContent = `${Swal.getTimerLeft()}`;
              }, 100);
            },
            willClose: () => {
              clearInterval(timerInterval);
            },
          }).then((result) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              // console.log("I was closed by the timer");
            }
          });
          // setShowWebcam(true);
        }
      })
      .catch((err) => {
        let msg = err?.response?.data?.error
          ? err?.response?.data?.error
          : "Something Went Wrong";
        let timerInterval;
        Swal.fire({
          title: msg,
          timer: 2000,
          timerProgressBar: true,
          didOpen: () => {
            Swal.showLoading();
            const timer = Swal?.getPopup()?.querySelector("b");
            timerInterval = setInterval(() => {
              // timer.textContent = `${Swal.getTimerLeft()}`;
            }, 100);
          },
          willClose: () => {
            clearInterval(timerInterval);
          },
        }).then((result) => {
          if (result.dismiss === Swal.DismissReason.timer) {
            // console.log("I was closed by the timer");
          }
        });
        // console.log(err?.response.data.message);
        setShowWebcam(true);

        // console.log(err);
      });
  };
  const handleSubmit = async (imageSrc) => {
    debugger;
    let userinfo = JSON.parse(localStorage.getItem("AppUserData"));
    let collectionid = userinfo?._id;
    // let collectionid = `${userinfo?.database}_${userinfo?.branch?.branchName}`;
    let findShift = handleCheckIn();

    if (findShift == "No shift found") {
      let timerInterval;

      Swal.fire({
        title: "Not in Office shift Timing",
        timer: 2500,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
          // const timer = Swal?.getPopup()?.querySelector("b");
          timerInterval = setInterval(() => {
            //       setShowWebcam(true);
            // setFormData({
            //   ...formData,
            //   image: null,
            // });
            // timer.textContent = `${Swal.getTimerLeft()}`;
          }, 100);
        },
        willClose: () => {
          clearInterval(timerInterval);
        },
      })
        .then((result) => {
          if (result?.dismiss === Swal.DismissReason.timer) {
            setShowWebcam(true);
            // setFormData({
            //   ...formData,
            //   image: null,
            // });
            // console.log("I was closed by the timer");
          } else {
            setShowWebcam(true);
          }
        })
        .catch((err) => {
          setShowWebcam(true);
        });
    } else {
      let Intime = false;
      let Outtime = false;
      let value = findShift;
      const fromTime = value?.fromTime;
      const lateByTime = value?.lateByTime;
      const toTime = value?.toTime;
      const shortByTime = value?.shortByTime;
      let InTimestatus = isCurrentTimeBetween(fromTime, lateByTime);
      let OutTimestatus = isCurrentTimeBetween(toTime, shortByTime);

      currentDate = moment();
      const formattedDate = currentDate.format("YYYY-MM-DD");
      const formattedTime = currentDate.format("h:mm:ss A");
      let image = imageSrc.split(",");
      // let image = croppedImageUrl.split(",");
      image[0] = "data:image/jpeg;base64";
      let finalImage = `${image[0]},${image[1]}`;
      // await MarkAttendance(userinfo, dataURItoBlob(imageSrc), imageSrc,findShift,formattedDate,formattedTime);

      if (InTimestatus) {
        await MarkAttendance(
          userinfo,
          "dataURItoBlob(imageSrc)",
          finalImage,
          // dataURItoBlob(imageSrc),
          // imageSrc,
          findShift,
          formattedDate,
          formattedTime,
          collectionid
        );
      }
      if (OutTimestatus) {
        await MarkOutAttendance(
          userinfo,
          "dataURItoBlob(imageSrc)",
          finalImage,
          // dataURItoBlob(imageSrc),
          // imageSrc,
          findShift,
          formattedDate,
          formattedTime,
          collectionid
        );
      }
      if (!OutTimestatus && !InTimestatus) {
        setShowWebcam(true);
        let timerInterval;

        Swal.fire({
          title: `You are Not in Office InTime /OutTime`,

          // title: `${data?.message}`,
          timer: 2000,
          timerProgressBar: true,
          didOpen: () => {
            Swal.showLoading();
            const timer = Swal?.getPopup()?.querySelector("b");
            timerInterval = setInterval(() => {
              // timer.textContent = `${Swal.getTimerLeft()}`;
            }, 100);
          },
          willClose: () => {
            clearInterval(timerInterval);
          },
        }).then((result) => {
          if (result.dismiss === Swal.DismissReason.timer) {
          }
        });
        // toast("You are Not in Office InTime /OutTime");
      }
    }
  };

  const HandleSubmitData = async (e) => {
    e.preventDefault();
    let userinfo = JSON.parse(localStorage.getItem("AppUserData"));
    setLoginButton("Submitting...");

    // console.log(LoginData);
    // console.log(formData);
    let formdata = new FormData();
    formdata.append("image", dataURItoBlob(formData.image));
    formdata.append("panNo", LoginData?.panNo);
    formdata.append("name", LoginData?.name);
    formdata.append("database", userinfo?.database);
    await axiosConfigOne
      .post("/register", formdata)
      .then((res) => {
        swal("Sucess", "Data Saved Sucessfully");
        // console.log(res);
        setLoginButton("Submit");
        toggle();
        // navigate("/home");
      })
      .catch((err) => {
        setLoginButton("Submit");
        // console.log(err.response);
        if (!!err.response?.data?.message) {
          swal("Error", err.response?.data?.message);
        }
      });
  };

  const handleCheck = () => {
    if (isOpen) {
      setTimeout(() => {
        setText("detecting...");
        // console.log("detecting...");
        detectPoints();
      }, 1500);
    }
  };
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginButton("Loading...");
    let payload = {
      Email: LoginData?.email,
      Password: LoginData?.password,
    };
    await axiosConfigApp
      .post(CustomerApplogin, payload)
      .then((res) => {
        setLoginButton("Submit");
        // handleCapture();

        if (res?.data?.Customer) {
          //   if (!!res?.data?.user?.branch?.branchName) {
          //   } else {
          //     swal("error", "Admin Branch Not Found, Add Branch", "error");
          //   }

          if (res?.status == 200) {
            capture();
            localStorage.removeItem("AppUserData");
            localStorage.setItem(
              "AppUserData",
              JSON.stringify(res?.data?.Customer)
            );
            setLoginScreen(false);
            handleCheck();
          }
        }
        // console.log(res);
      })
      .catch((err) => {
        setLoginButton("Submit");

        // console.log(err.response);
        setLoginScreen(true);

        swal("Error", err?.response?.data?.message, "error");
      });
  };
  const handleFaceDetect = (faces) => {
    if (cropperRef.current) {
      const face = {
        x: 100,
        y: 100,
        width: 200,
        height: 220,
      }; // Assuming there's only one face detected
      const cropper = cropperRef.current.cropper;
      const faceBounds = {
        x: face.x,
        y: face.y,
        width: face.width,
        height: face.height,
      };
      // Crop the image based on detected face bounds
      const croppedImageBase64 = cropper
        .getCroppedCanvas(faceBounds)
        .toDataURL();
      setCroppedImageUrl(croppedImageBase64);
    }
  };
  const captureone = (imageSrc) => {
    handleFaceDetect(imageSrc);
  };
  return (
    <>
      <div className="container-fluid">
        {/* <Header /> */}
        <>
          <ToastContainer />
          {/* {model == null ? (
          <>
            <h5>Wait while model loading...</h5>
          </>
        ) : (
          <>
            <div className="max-w-md mx-auto mt-10 p-4 border rounded-md shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Login</h2>
              <form onSubmit={handleSubmit}>
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
                  login
                </button>
                {backloading && <p>Wait for a minute.</p>}
                {registered && <p>Registered.</p>}
              </form>
              <div>
                <p>
                  Not a user?{" "}
                  <span onClick={() => navigate("/signup")}>Register</span>
                </p>
              </div>
            </div>
          </>
        )} */}
        </>
        <Row>
          <Col></Col>
          <Col lg="4" md="4" sm="12">
            <div className="max-w-md mx-auto mt-10 p-4 border rounded-md shadow-lg">
              <div className="">
                {!LoginScreen && !LoginScreen && (
                  <>
                    <Row>
                      <Col>
                        <>
                          <div className="d-flex justify-content-start">
                            {/* <span
                              title="Go Back"
                              onClick={() => navigate("/Applogin")}
                              style={{
                                borderRadius: "50%",
                                color: "blue",
                                cursor: "pointer",
                              }}
                            >
                              <RiArrowGoBackFill />
                            </span> */}
                          </div>
                        </>
                      </Col>
                      <Col>
                        <div className="d-flex justify-content-end">
                          <span
                            title=" Click to LogOut"
                            onClick={() => {
                              localStorage.removeItem("AppUserData");
                              window.location.replace("/Applogin");
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <RiLogoutCircleRLine color="red" size={25} />
                          </span>
                        </div>
                      </Col>
                    </Row>
                  </>
                )}
              </div>

              <div className="d-flex justify-content-center">
                <img height={130} width={200} src={logo} alt="image" />
              </div>
              <div className="d-flex justify-content-center">
                <h2 className="text-2xl font-bold mb-4">Mark Attendance</h2>
              </div>
              {model == null ? (
                <>
                  <div className="d-flex justify-content-center">
                    <span style={{ color: "red" }}>Wait while Loading...</span>
                  </div>
                </>
              ) : null}
              {LoginScreen && LoginScreen ? (
                <>
                  <Form onSubmit={handleLoginSubmit}>
                    <Row>
                      <Col lg="12" sm="12" md="12">
                        <Label>Email id</Label>
                        <Input
                          required
                          name="email"
                          onChange={handleInputChange}
                          value={LoginData?.email}
                          type="email"
                          placeholder="Enter Email to Login"
                        />
                      </Col>
                      <Col lg="12" sm="12" md="12">
                        <Label className="mt-1">Password</Label>
                        <Input
                          required
                          name="password"
                          onChange={handleInputChange}
                          value={LoginData?.password}
                          type="password"
                          placeholder="Enter Password to Login"
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col lg="12" sm="12" md="12">
                        <div className="d-flex justify-content-center pt-2 mt-2">
                          <Button type="submit" color="primary">
                            {LoginButton && LoginButton}
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </>
              ) : (
                <>
                  <Row>
                    <Col lg="12" sm="12" md="12">
                      {model == null ? null : (
                        <>
                          <div className="max-w-md mx-auto  p-4 border rounded-md shadow-lg">
                            {formData.image && (
                              <div className="mb-2">
                                <img
                                  style={{
                                    borderRadius: "10px",
                                    position: "absolute",
                                  }}
                                  height={100}
                                  width={90}
                                  src={formData.image}
                                  alt="Captured"
                                  className="mb-1"
                                />
                              </div>
                            )}
                            <form onSubmit={handleSubmit}>
                              {/* <div className="mb-4">
                            <button
                              type="button"
                              onClick={capture}
                              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                            >
                              Capture Image
                            </button>
                            <p>{text}</p>
                          </div> */}
                              {showWebcam && (
                                <div className="mb-4">
                                  <Webcam
                                    style={{ width: "100%" }}
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    className="mb-2"
                                  />
                                  <div className="d-flex justify-content-center">
                                    <Button
                                      type="button"
                                      color="primary"
                                      onClick={handleCapture}
                                    >
                                      Capture
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {/* {croppedImageUrl && (
                                <div className="mb-5">
                                  <img
                                    src={croppedImageUrl}
                                    alt="Captured"
                                    className="mb-1"
                                  />
                                </div>
                              )} */}
                              {formData?.image && (
                                <div className="mb-2">
                                  <img
                                    src={formData.image}
                                    alt="Captured"
                                    className="mb-1"
                                  />
                                </div>
                              )}
                              {/* <button
                         type="submit"
                          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                        >
                          Register new User
                        </button> */}
                              {/* {backloading && <p>Wait for a minute.</p>} */}
                              {registered && <p>Registered.</p>}
                            </form>
                            {imageUrl && (
                              <>
                                {/* <div> */}
                                <div
                                  style={{ margin: "20px 0", display: "none" }}
                                >
                                  <Cropper
                                    ref={cropperRef}
                                    // src={UploadedImage}
                                    src={imageUrl}
                                    style={{ height: "100%", width: "100%" }}
                                    aspectRatio={1} // Set aspect ratio as needed
                                    guides={true}
                                    cropBoxResizable={true}
                                    dragMode="move"
                                    viewMode={1} // Set to 1 to restrict the cropping area to within the image dimensions
                                    ready={() => {
                                      // This callback can be used for face detection logic
                                      // For real face detection, use an appropriate library
                                      // Example of dummy face detection logic:
                                      handleFaceDetect([
                                        {
                                          x: 100,
                                          y: 100,
                                          width: 200,
                                          height: 220,
                                        },
                                      ]);
                                    }}
                                  />
                                </div>
                                {/* <div className="d-flex justify-content-center mt-2 mb-2">
                                  <Button
                                    color="primary"
                                    className="primary"
                                    onClick={() => captureone(formData?.image)}
                                  >
                                    Crop
                                  </Button>
                                </div> */}
                              </>
                            )}
                            <Row>
                              <Col>
                                {Registration && Registration ? null : (
                                  <>
                                    <div>
                                      {/* <p style={{ fontSize: "12px" }}>
                                        Not a user?{" "}
                                        <span
                                          style={{ cursor: "pointer" }}
                                          onClick={() => {
                                            // setRegistration(true);
                                            // capture();
                                            navigate("/");
                                          }}
                                        >
                                          <span style={{ color: "blue" }}>
                                            Register here
                                          </span>
                                        </span>
                                      </p> */}
                                    </div>
                                  </>
                                )}
                              </Col>
                            </Row>
                          </div>
                        </>
                      )}
                    </Col>
                  </Row>
                  {/* <form onSubmit={handleSubmit}>
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
                login
              </button>
              {backloading && <p>Wait for a minute.</p>}
              {registered && <p>Registered.</p>}
            </form>
            <div>
              <p>
                Not a user?{" "}
                <span onClick={() => navigate("/signup")}>Register</span>
              </p>
            </div> */}
                </>
              )}
            </div>
          </Col>
          <Col></Col>
        </Row>

        {/* {model == null ? (
        <>
          <h4>Wait while model loading...</h4>
        </>
      ) : (
        <>
          <div className="max-w-md mx-auto mt-10 p-4 border rounded-md shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Login</h2>
            {LoginScreen && LoginScreen ? (
              <>
                <Form onSubmit={handleLoginSubmit}>
                  <Row>
                    <Col lg="12" sm="12" md="12">
                      <Label>Email id</Label>
                      <Input
                        required
                        name="email"
                        onChange={handleInputChange}
                        value={LoginData?.email}
                        type="email"
                        placeholder="Enter Email to Login"
                      />
                    </Col>
                    <Col lg="12" sm="12" md="12">
                      <Label className="mt-1">Password</Label>
                      <Input
                        required
                        name="password"
                        onChange={handleInputChange}
                        value={LoginData?.password}
                        type="password"
                        placeholder="Enter Password to Login"
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col lg="12" sm="12" md="12">
                      <div className="d-flex justify-content-center pt-2 mt-2">
                        <Button type="submit" color="primary">
                          Submit
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Form>
              </>
            ) : (
              <>
                <form onSubmit={handleSubmit}>
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
                      <img
                        src={formData.image}
                        alt="Captured"
                        className="mb-2"
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  >
                    login
                  </button>
                  {backloading && <p>Wait for a minute.</p>}
                  {registered && <p>Registered.</p>}
                </form>
                <div>
                  <p>
                    Not a user?{" "}
                    <span onClick={() => navigate("/signup")}>Register</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </>
      )} */}
        <Modal isOpen={modal} toggle={toggle} {...args}>
          <ModalHeader toggle={toggle}>Submit Details here</ModalHeader>
          <div className="p-3">
            <Form onSubmit={HandleSubmitData}>
              <Row>
                <Col className="p-2" lg="12" sm="12" md="12">
                  <Label>Pan Number *</Label>
                  <Input
                    required
                    name="panNo"
                    onChange={handleInputChange}
                    value={LoginData?.panNo}
                    type="text"
                    placeholder="Enter Pan Number..."
                  />
                </Col>
                <Col className="p-2" lg="12" sm="12" md="12">
                  <Label className="mt-1">Name *</Label>
                  <Input
                    required
                    name="name"
                    onChange={handleInputChange}
                    value={LoginData?.name}
                    type="text"
                    placeholder="Enter Name"
                  />
                </Col>
                <Col lg="12" sm="12" md="12">
                  {model == null ? (
                    <>
                      <h1>Wait while model loading...</h1>
                    </>
                  ) : (
                    <>
                      <div className="max-w-md mx-auto  p-4 border rounded-md shadow-lg">
                        <form onSubmit={handleSubmit}>
                          {/* <div className="mb-4">
                            <button
                              type="button"
                              onClick={capture}
                              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                            >
                              Capture Image
                            </button>
                            <p>{text}</p>
                          </div> */}
                          {showWebcam && (
                            <div className="mb-4">
                              <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="mb-2"
                              />
                              {/* <button
                                type="button"
                                onClick={handleCapture}
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                              >
                                Take Picture
                              </button> */}
                            </div>
                          )}
                          {formData.image && (
                            <div className="mb-2 d-flex justify-content-center">
                              <img
                                style={{ borderRadius: "12px" }}
                                src={formData.image}
                                alt="Captureds"
                                className="mb-1"
                              />
                            </div>
                          )}
                          {/* <button
                            type="submit"
                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                          >
                            login
                          </button>
                          {backloading && <p>Wait for a minute.</p>}
                          {registered && <p>Registered.</p>} */}
                        </form>
                        {/* <div>
                          <p>
                            Not a user?{" "}
                            <span onClick={() => navigate("/signup")}>
                              Register
                            </span>
                          </p>
                        </div> */}
                      </div>
                    </>
                  )}
                </Col>
              </Row>
              <Row>
                <Col lg="12" sm="12" md="12">
                  <div className="d-flex justify-content-center pt-2 mt-2">
                    <Button type="submit" color="primary">
                      {LoginButton && LoginButton}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default Loginform;
