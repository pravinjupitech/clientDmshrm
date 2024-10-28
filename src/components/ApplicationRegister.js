import React, { useEffect, useState, useRef } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { useNavigate } from "react-router-dom";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import * as tf from "@tensorflow/tfjs";
import { Button, Col, Form, Input, Label, Row } from "reactstrap";
import axiosConfig from "./../axiosConfig";
import axiosConfitthirdparty from "./../axiosConfitthirdparty";
import axiosConfigThirdpartyApp from "./../axiosConfigThirdpartyApp";
import axiosConfigApp from "./../axiosConfigApp";
import axiosConfigOne from "./../axiosCofigOne";
import {
  Createcollection,
  Login,
  Pan_Verify,
  Pan_VerifybyApp,
  Register,
  Registervianode,
  SaveData,
  UpdateCustomerAppEmployee,
} from "../EndPoint/EndPoint";
import logo from ".././assets/images/logo.png";
import { RiLogoutCircleRLine } from "react-icons/ri";
import swal from "sweetalert";
import { FaCheck } from "react-icons/fa";
import { MdOutlineCancel } from "react-icons/md";
import "./LoginStyle.css";
import Header from "./Header";
const faceLandmarksDetection = require("@tensorflow-models/face-landmarks-detection");

const ApplicationRegister = (args) => {
  const webcamRef = useRef(null);
  const cropperRef = useRef(null);
  const navigate = useNavigate();
  const [modal, setModal] = useState(false);

  const [formData, setFormData] = useState({
    mobile: "",
    image: null,
  });

  const [showWebcam, setShowWebcam] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageSize, setImageSize] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [PanVerify, setPanVerify] = useState(false);
  const [text, setText] = useState("modal loading...");
  const [count, setCount] = useState(0);
  const [model, setModel] = useState(null);
  const [maxLeft, setMaxLeft] = useState(0);
  const [maxRight, setMaxRight] = useState(0);
  const [backloading, setBackloading] = useState(false);
  const [Registration, setRegistration] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [LoginData, setLogin] = useState({});
  const [LoginScreen, setLoginScreen] = useState(true);
  const [LoginButton, setLoginButton] = useState("Submit");
  const [msgLocation, setMsgLocation] = useState({
    Latitude: " ",
    Longitude: "",
  });

  useEffect(() => {
    tf.setBackend("webgl");
    loadModel();

    setLoginScreen(false);
    // setRegistration(true);
  }, []);
  const toggle = () => {
    setModal(!modal);
    if (modal) {
      setShowWebcam(true);
    }
  };
  const toggleModal = () => {
    capture();
    setModal(false);

    // setRegistration(true);
  };
  const loadModel = async () => {
    faceLandmarksDetection
      .load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
        maxFaces: 1,
      })
      .then((model) => {
        setModel(model);
        setText("ready for capture");
      })
      .catch((err) => {
        console.log(err);
      });
  };

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
        console.log("detecting...");
        detectPoints();
      }, 2000);
    }
  }, [isOpen, modal]);

  const detectPoints = async () => {
    if (isOpen == false) return;
    try {
      const video = await webcamRef?.current?.video;
      const predictions = await model?.estimateFaces({
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
    if (e.target.name == "panNo") {
      setLogin({
        ...LoginData,
        [e.target.name]: e.target.value.toUpperCase(),
      });
    } else {
      setLogin({
        ...LoginData,
        [e.target.name]: e.target.value,
      });
    }
  };
  // const capture = () => {
  //   setShowWebcam(true);
  //   handleClick();
  //   setFormData({
  //     mobile: "",
  //     image: null,
  //   });
  // };
  // const capture = () => {
  //   setShowWebcam(true);
  //   handleClick();
  //   setFormData({
  //     mobile: "",
  //     image: null,
  //   });

  //   setTimeout(() => {
  //     const imageSrc = webcamRef.current.getScreenshot();
  //     if (imageSrc) {
  //       console.log("Screenshot captured:", imageSrc);
  //       handleCapture();
  //     } else {
  //       console.error("Error: Screenshot not captured.");
  //     }
  //   }, 2000);
  // };
  const captureone = (imageSrc) => {
    handleFaceDetect(imageSrc);
  };
  const capture = () => {
    setPanVerify(false);
    setLoginButton("Submit");

    setLogin({
      ...LoginData,
      panNo: "",
      name: "",
    });
    setShowWebcam(true);
    handleClick();
  };
  const handleSizeCalculate = (imageSrc) => {
    const base64Data = imageSrc.replace(/^data:image\/\w+;base64,/, "");

    // Decode the base64 string
    const binaryData = atob(base64Data);

    // Calculate the size in bytes
    const sizeInBytes = binaryData.length;

    const sizeInKB = sizeInBytes / 1024;
    const sizeInMB = sizeInKB / 1024;
    setImageSize({
      bytes: sizeInBytes?.toFixed(2),
      kb: sizeInKB?.toFixed(2),
      mb: sizeInMB?.toFixed(2),
    });
  };
  const handleCapture = () => {
    const imageSrc = webcamRef?.current?.getScreenshot();
    // if (imageSrc == undefined) {
    //   swal("error", "error Capture Image", "error");
    // } else {
    setImageUrl(imageSrc);
    // handleFaceDetect(imageSrc);
    if (imageSrc) {
      handleSizeCalculate(imageSrc);
      setCroppedImageUrl(imageSrc);
    }
    setFormData({
      ...formData,
      image: imageSrc,
    });
    setShowWebcam(false);
    // toggle();
    setModal(true);
    // }
  };
  const handleFaceDetect = () => {
    if (cropperRef.current) {
      const face = {
        x: 100,
        y: 100,
        width: 200,
        height: 200,
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
      handleSizeCalculate(croppedImageBase64);

      setFormData({
        ...formData,
        image: croppedImageBase64,
      });
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
      // setMsgLocation("Geolocation is not supported by this browser.");
      setMsgLocation("");
    }
  }
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("mobile", formData.mobile);
      formDataToSend.append("image", dataURItoBlob(formData.image));
      setBackloading(true);
      const response = await axiosConfigOne
        .post("/login", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((res) => {});
      setRegistered(true);
      navigate("/home");

      // Reset form after successful submission
      setFormData({
        mobile: "",
        image: null,
      });
    } catch (error) {
      console.error("Error registering:", error);
    }
  };
  const HandleSubmitData = async (e) => {
    debugger;
    console.log(LoginData);
    console.log(LoginData?.RegistratinInfo?.userId?._id);
    e.preventDefault();
    if (formData.image !== undefined) {
      let userinfo = JSON.parse(localStorage.getItem("userData"));
      let collectionid = `${LoginData?.RegistratinInfo?.userId?._id}`;
      (async () => {
        await axiosConfigThirdpartyApp
          .post(Createcollection, {
            collectionId: collectionid,
          })
          .then((res) => {
            console.log(res?.data?.message);
          })
          .catch((err) => {
            console.log(err);
          });
      })();

      setLoginButton("Submitting...");

      // let formdata = new FormData();
      let image = croppedImageUrl.split(",");
      image[0] = "data:image/jpeg;base64";
      let finalImage = `${image[0]},${image[1]}`;
      let payload = {
        collectionId: collectionid,
        image: finalImage,
        // image: formData.image,
        userId: LoginData?.id,
        fullName: LoginData?.name,
        latitude: msgLocation?.Latitude,
        longitude: msgLocation?.Longitude,
      };

      if (PanVerify) {
        await axiosConfigThirdpartyApp
          .post(Register, payload)
          .then((res) => {
            debugger;

            (async () => {
              let customerData = {
                Image: res?.data?.registerData?.imageUrl,
              };
              debugger;
              let URl = `${UpdateCustomerAppEmployee}/${LoginData?.id}`;
              await axiosConfigApp
                .put(URl, customerData)
                .then((res) => {
                  console.log(res);
                })
                .catch((err) => {
                  console.log(err);
                });
            })();
            if (res?.status == 200) {
              swal(
                "Sucess",
                `${LoginData?.fullName} is Registered Sucessfully`,
                "success"
              );
              setLoginButton("Submit");
              // capture();
              // toggle();
              setPanVerify(false);
            }
          })
          .catch((err) => {
            setPanVerify(false);
            // if (res?.status == "500") {
            swal("error", "Error in Registration Try Again", "error");
            setLoginButton("Submit");
            // capture();
            // toggle();
            // }
          });
      } else {
        swal("error", "Verify Your Identity", "error");
        setLoginButton("Submit");

        setPanVerify(false);
      }
    } else {
      swal("error", "Unable To Get Image", "error");
    }
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
      email: LoginData?.email,
      password: LoginData?.password,
    };
    await axiosConfig
      .post(Login, payload)
      .then((res) => {
        setLoginButton("Submit");
        console.log(res?.data?.user?.rolename?.roleName == "Admin");

        if (res?.data?.user?.rolename?.roleName == "Admin") {
          if (!!res?.data?.user?.branch?.branchName) {
          } else {
            swal("error", "Admin Branch Not Found, Add Branch", "error");
          }
          debugger;
          if (res?.status == 200) {
            capture();
            localStorage.removeItem("userData");
            localStorage.setItem("userData", JSON.stringify(res?.data?.user));
            setLoginScreen(false);
            handleCheck();
          }
        } else {
          swal("error", "User Not Login With Admin", "error");
        }
      })
      .catch((err) => {
        setLoginButton("Submit");

        // console.log(err.response);
        setLoginScreen(true);
        if (!!err?.response?.data?.message) {
          swal("Error", err?.response?.data?.message, "error");
        }
      });
  };

  const handleVerifyPancard = async () => {
    let userinfo = JSON.parse(localStorage.getItem("userData"));
    getLocation();
    if (LoginData?.panNo) {
      // let formdata = new FormData();
      // formdata.append("pancard_no", LoginData?.panNo);
      let payload = {
        panNo: LoginData?.panNo,
        // database: userinfo?.database,
      };
      await axiosConfigApp
        .post(Pan_VerifybyApp, payload)
        .then((res) => {
          debugger;
          // let RegisteringUserBranch =
          //   res?.data?.User?.branch &&
          //   res?.data?.User?.branch == userinfo?.branch?._id;
          // if (RegisteringUserBranch) {
          let fullname = res?.data?.Employee?.Name?.includes(" ")
            ? res?.data?.Employee?.Name.split(" ").join("")
            : res?.data?.Employee?.Name;
          setLogin({
            ...LoginData,
            ["name"]: fullname,
            ["fullName"]: res?.data?.Employee?.Name?.trim(),
            ["RegistratinInfo"]: res?.data?.Employee,

            ["id"]: res?.data?.Employee?._id,
          });
          setPanVerify(true);
          // } else {
          //   swal(
          //     "Error",
          //     `Employee is not From ${userinfo?.branch?.branchName} Branch`,
          //     "error"
          //   );
          //   setPanVerify(false);
          // }

          // console.log(res);
        })
        .catch((err) => {
          setPanVerify(false);
          console.log(err.message);
          if (!!err.message) {
            swal("Error", `${err?.message}`, "error");
          }
        });
    }
  };
  return (
    <>
      <div className="container-fluid">
        <>
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
        {/* {!LoginScreen && !LoginScreen && <Header />} */}
        <Row className="mt-20 mainheading">
          <Col></Col>
          <Col lg="4" md="4" sm="12">
            <div className="max-w-lg mx-auto mt-20 p-4 border rounded-md shadow-lg shadow-sm shadow-md">
              {/* {!LoginScreen && !LoginScreen && (
                <div className="d-flex justify-content-end">
                  <span
                    title=" Click to LogOut"
                    onClick={() => {
                      localStorage.removeItem("userData");
                      window.location.reload();
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <RiLogoutCircleRLine color="red" size={25} />
                  </span>
                </div>
              )} */}
              <div className="d-flex justify-content-center">
                <img
                  className="Compnaylogo"
                  height={250}
                  width={250}
                  // style={{
                  //   borderRadius: "12px",
                  //   height: "250px",
                  //   width: "100%",
                  // }}
                  src={logo}
                  alt="image"
                />
              </div>
              <div className="d-flex justify-content-center mb-2">
                {LoginScreen && LoginScreen && (
                  <h2 className="text-2xl font-bold mb-4">Login</h2>
                )}
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
                        <Label>Email id :</Label>
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
                        <Label className="mt-1">Password :</Label>
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
                          {/* <div className="max-w-md mx-auto  p-4 border rounded-md shadow-lg"> */}
                          <form onSubmit={handleSubmit}>
                            {showWebcam && (
                              <div className="mb-4">
                                <Webcam
                                  id="webcam"
                                  audio={false}
                                  style={{ width: "100%" }}
                                  ref={webcamRef}
                                  screenshotFormat="image/jpeg"
                                  className="mb-2 webcamheading"
                                />
                              </div>
                            )}
                            {Registration && (
                              <div className="d-flex justify-content-center mt-2 mb-2">
                                <Button color="primary" onClick={handleCapture}>
                                  Capture
                                </Button>
                              </div>
                            )}
                            {formData?.image && (
                              <div className="mb-2 mt-2">
                                <span
                                  // type="button"
                                  title="Remove This Image"
                                  style={{
                                    top: 230,
                                    position: "absolute",
                                    right: 400,
                                    color: "red",
                                    cursor: "pointer",
                                  }}
                                  onClick={capture}
                                >
                                  X
                                </span>
                                <img
                                  // height={250}
                                  // width={250}
                                  style={{
                                    borderRadius: "12px",
                                    height: "250px",
                                    width: "100%",
                                  }}
                                  src={formData.image}
                                  alt="Captured"
                                  className="mb-1"
                                />
                              </div>
                            )}

                            {registered && <p>Registered.</p>}
                          </form>
                          <Row>
                            <Col
                              lg="12"
                              md="12"
                              sm="12"
                              xs="12"
                              className="textLeft"
                            >
                              {Registration && Registration ? null : (
                                <>
                                  <p className="flexView">
                                    <span> Not a User ? : </span>
                                    <span
                                      onClick={() => {
                                        capture();
                                        setRegistration(true);
                                      }}
                                      style={{
                                        cursor: "pointer",
                                        color: "blue",
                                      }}
                                    >
                                      Register here
                                    </span>
                                  </p>
                                </>
                              )}
                            </Col>
                            <Col
                              lg="12"
                              md="12"
                              sm="12"
                              xs="12"
                              className="textRight"
                            >
                              {/* <div>
                                <p
                                  className="flexView"
                                >
                                  <span
                                    className="font"
                                  >
                                    User? :
                                  </span>
                                  <span
                                    className="font"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => {
                                      navigate("/Home");
                                    }}
                                  >
                                    <span style={{ color: "green" }}>
                                      &nbsp; Mark Attendance
                                    </span>
                                  </span>
                                </p>
                              </div> */}
                            </Col>
                          </Row>
                          {/* </div> */}
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
        <Modal
          fullscreen="true"
          backdrop="false"
          isOpen={modal}
          toggle={toggle}
          {...args}
        >
          <ModalHeader
            toggle={toggle}
            // toggle={toggleModal}
          >
            Add Details -
          </ModalHeader>
          <div className="p-3">
            <Form onSubmit={HandleSubmitData}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  color: "red",
                  fontSize: "15px",
                }}
              >
                Image Size Should Not be greater then 68 KB
              </div>
              <Row>
                <Col lg="7" sm="7" md="7">
                  <Row>
                    <Col className="p-1" lg="12" sm="12" md="12">
                      <label>Aadhar Number/PAN No. *</label>
                      <Input
                        required
                        name="panNo"
                        onChange={handleInputChange}
                        value={LoginData?.panNo}
                        type="text"
                        placeholder="Enter Pan /Aadhar Number..."
                      />
                      {/* {LoginData?.panNo?.length == 10 && !PanVerify && (
                )} */}
                      <div className="d-flex justify-content-center">
                        <span
                          onClick={handleVerifyPancard}
                          className="mr-1"
                          style={{
                            color: `${PanVerify ? "blue" : "green"}`,
                            cursor: "pointer",
                            fontSize: "10px",
                          }}
                        >
                          Click to Verify
                        </span>
                        {PanVerify && PanVerify ? (
                          <>
                            <span
                              style={{
                                color: "green",
                                cursor: "pointer",
                                fontSize: "10px",
                              }}
                            >
                              (Verified)
                            </span>
                          </>
                        ) : (
                          <>
                            <span
                              style={{
                                color: "red",
                                cursor: "pointer",
                                fontSize: "10px",
                              }}
                            >
                              {/* UnVerified */}
                            </span>
                          </>
                        )}
                      </div>
                    </Col>
                    <Col className="p-1" lg="12" sm="12" md="12">
                      <label className="">Name *</label>
                      <Input
                        required
                        disabled
                        name="name"
                        onChange={handleInputChange}
                        value={LoginData?.name}
                        type="text"
                        placeholder="Name"
                      />
                    </Col>
                    <Col className="p-1" lg="12" sm="12" md="12">
                      <label className="">Upload file *</label>
                      <Input
                        name="name"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setImageUrl(reader.result); // Base64 string
                            };
                            reader.readAsDataURL(file); // Convert file to Base64
                          }
                        }}
                        type="file"
                        placeholder="Name"
                      />
                    </Col>
                  </Row>
                </Col>
                <Col>
                  <label>
                    Image Size:{" "}
                    {imageSize?.kb >= 68 ? (
                      <span style={{ color: "red" }}>{imageSize?.kb} KB</span>
                    ) : (
                      <>
                        {imageSize?.kb ? <>{imageSize?.kb} KB</> : <>0 KB</>}{" "}
                      </>
                    )}
                  </label>
                  {croppedImageUrl && (
                    <div className="mt-1 mb-1">
                      <img
                        height={190}
                        src={croppedImageUrl}
                        alt="Cropped Face"
                        style={{ maxWidth: "100%", borderRadius: "20px" }}
                      />
                    </div>
                  )}
                </Col>
              </Row>
              <Row>
                <Col lg="12" sm="12" md="12">
                  {model == null ? (
                    <>
                      <h1>Wait while model loading...</h1>
                    </>
                  ) : (
                    <>
                      <div className="max-w-md mx-auto  p-4 border rounded-md shadow-lg">
                        <form onSubmit={handleSubmit}>
                          <div className="mb-4"></div>
                          {showWebcam && (
                            <div className="mb-4">
                              <Webcam
                                audio={false}
                                style={{ width: "100%" }}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="mb-2"
                              />
                              <Button
                                type="button"
                                onClick={handleCapture}
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                              >
                                Take Picture
                              </Button>
                            </div>
                          )}
                          {imageUrl && (
                            <>
                              <div>
                                {/* <div style={{ margin: "20px 0", display: "none" }}> */}
                                <Cropper
                                  ref={cropperRef}
                                  // src={UploadedImage}
                                  src={imageUrl}
                                  style={{ height: "100%", width: "100%" }}
                                  initialAspectRatio={6 / 14}
                                  // aspectRatio={1} // Set aspect ratio as needed
                                  guides={true}
                                  dragMode="move"
                                  cropBoxResizable={true}
                                  viewMode={1} // Set to 1 to restrict the cropping area to within the image dimensions
                                  // ready={() => {
                                  //   // This callback can be used for face detection logic
                                  //   // For real face detection, use an appropriate library
                                  //   // Example of dummy face detection logic:
                                  //   handleFaceDetect([
                                  //     {
                                  //       x: 100,
                                  //       y: 100,
                                  //       width: 200,
                                  //       height: 200,
                                  //     },
                                  //   ]);
                                  // }}
                                />
                              </div>
                              <div className="d-flex justify-content-center mt-2 mb-2">
                                <Button
                                  color="primary"
                                  className="primary"
                                  onClick={() => captureone(formData?.image)}
                                >
                                  Crop
                                </Button>
                              </div>
                            </>
                          )}
                          {formData?.image && (
                            <div className="mb-1 d-flex justify-content-center">
                              <span
                                title="Remove This Image"
                                style={{
                                  top: 330,
                                  position: "absolute",
                                  right: 50,
                                  fontSize: "20px",
                                  color: "red",
                                  cursor: "pointer",
                                }}
                                onClick={capture}
                              >
                                X
                              </span>
                              {/* <img
                                style={{
                                  borderRadius: "12px",
                                  height: "250px",
                                  width: "100%",
                                }}
                                src={formData?.image}
                                alt="Captured"
                                className="mb-1"
                              /> */}
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

export default ApplicationRegister;
