import React, { useState, useEffect } from "react";
import { _GetList, _Get, _Put } from "../components/ApiCalling";
import { HRM_ATTENDANCE_LIST, All_Users_HRM } from "../EndPoint/EndPoint";
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
} from "reactstrap";
import axios from "axios";
import Header from "../components/Header";
import { Col, Input, Row, Spinner, Table } from "reactstrap";
import swal from "sweetalert";
import { useNavigate } from "react-router-dom";
import { Edit } from "react-feather";
function InnerTable({ insideData }, args) {
  const [InTime, setInTime] = useState("");
  const [OutTime, setOutTime] = useState("");
  const [EditData, setEditData] = useState(null);
  const [modal, setModal] = useState(false);

  const toggle = () => setModal(!modal);

  const handleViewOne = (data, intimeIndex, OutTimeIndex) => {
    let value = {
      ...data,
      intimeIndex: intimeIndex,
      OutTimeIndex: OutTimeIndex,
    };

    setEditData(value);
    setInTime(value?.details?.inTimes[intimeIndex]);
    setOutTime(value?.details?.outTimes[OutTimeIndex]);
    toggle();
  };
  const handleEditAttendanceSubmit = async (e) => {
    e.preventDefault();

    let Payload = {
      inTimeIndex: EditData?.intimeIndex,
      inTime: InTime,
      outTimeIndex: EditData?.OutTimeIndex,
      outTime: OutTime,
    };
    await axios
      .put(
        `https://node-second.rupioo.com/editTimes/${EditData?.details?._id}`,
        Payload
      )
      .then((res) => {
        if (res?.data?.status) {
          toggle();
          window.location.reload();
        }
      })
      .catch((err) => {
        if (!!err?.response?.data?.message) {
          swal("error", `${err?.response?.data?.message}`, "error");
        }
      });
  };
  return (
    <>
      <div className="d-flex justify-content-center p-2">
        <strong>
          <h2>
            {insideData[0]?.details?.name &&
              insideData[0]?.details?.name?.toUpperCase()}
          </h2>
        </strong>
      </div>
      <Table hover responsive className="innerTable">
        <thead>
          <tr style={{ height: "47px" }}>
            <th>Date</th>
            <th>InTime</th>
            <th>OutTime</th>
            <th>lateBy</th>
            <th>ShortBy</th>
            <th>Working</th>
            <th>Amount</th>
            {/* <th>Action</th> */}
          </tr>
        </thead>
        <tbody>
          {insideData?.length > 0 &&
            insideData
              ?.map((custom, index) => (
                <>
                  {custom?.details.inTimes?.length > 0 ? (
                    <>
                      {custom?.details.inTimes?.map((ele, i) => {
                        return (
                          <>
                            <tr style={{ height: "47px" }} key={index}>
                              <td>{custom?.details?.date}</td>
                              <td>{ele}</td>
                              <td>
                                {custom?.details?.outTimes[i] &&
                                  custom?.details?.outTimes[i]}
                              </td>
                              <td>{custom?.details?.late}</td>
                              <td>{custom?.details?.early}</td>
                              <td>
                                {custom?.attendance?.totalWorkingHours?.toFixed(
                                  2
                                )}
                              </td>
                              <td>{custom?.Amount}</td>
                              {/* <td>
                                {" "}
                                <span
                                  onClick={() =>
                                    handleViewOne(
                                      custom,
                                      i,
                                      custom?.attendence?.details?.outTimes
                                        ?.length > 0
                                        ? i
                                        : 0
                                    )
                                  }
                                  style={{ cursor: "pointer" }}
                                  className="mr-1"
                                >
                                  <Edit color="green" />
                                </span>
                              </td> */}
                            </tr>
                          </>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      <td>1</td>
                      <td>2</td>
                    </>
                  )}
                </>
              ))
              .reverse()}
        </tbody>
      </Table>
      <Modal isOpen={modal} toggle={toggle} {...args}>
        <ModalHeader toggle={toggle}>Update Attendance</ModalHeader>
        <ModalBody>
          <div className="d-flex justify-content-center">
            <h4>
              Edit Attendance for{" "}
              {EditData?.firstName && (
                <>
                  {EditData?.firstName} {EditData?.lastName}
                </>
              )}{" "}
            </h4>
          </div>
          <div className="d-flex justify-content-center">
            <h4>
              {EditData?.attendence?.attendance?.date ? (
                <> Date : {EditData?.attendence?.attendance?.date}</>
              ) : null}
            </h4>
          </div>
          <div className="p-1 pt-1 pb-1">
            <Row>
              <Col>
                <Label>In Time</Label>
                <Input
                  value={InTime}
                  onChange={(e) => setInTime(e.target.value)}
                  placeholder="In time.."
                />
              </Col>
              <Col>
                <Label>Out Time</Label>
                <Input
                  value={OutTime}
                  onChange={(e) => setOutTime(e.target.value)}
                  placeholder="Out time.."
                />
              </Col>
            </Row>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleEditAttendanceSubmit}>
            Submit
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

function OuterTable({ Search, setSearch }, args) {
  const [dataSource, setDataSource] = useState([]);
  const [AllDataSource, setAllDataSource] = useState([]);
  const [insideData, setInsideData] = useState([]);
  const [TotalAttendance, setTotalAttendance] = useState([]);
  const [TodayImages, setTodayImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [EditData, setEditData] = useState(null);
  const [isTrue, setIstrue] = useState(false);
  const [currentIndex, setCurrentIndex] = useState("");
  const [InTime, setInTime] = useState("");
  const [OutTime, setOutTime] = useState("");
  const [modal, setModal] = useState(false);

  const toggle = () => setModal(!modal);
  useEffect(() => {
    let searchingItem = AllDataSource?.filter(
      (element, index) =>
        element?.attendence?.details?.name?.toLowerCase()?.includes(Search) ||
        element?.firstName?.toLowerCase()?.includes(Search)
    );
    if (Search?.length) {
      setDataSource(searchingItem);
    } else {
      setDataSource(AllDataSource);
    }
  }, [Search]);

  useEffect(() => {
    listData();
  }, []);
  const listData = () => {
    (async () => {
      let todayDate = new Date()?.toISOString()?.split("T")[0];
      let user = JSON.parse(localStorage.getItem("userData"));

      setLoading(true);
      await _GetList("https://node-second.rupioo.com/checkImage", 1, 1)
        .then((res) => {
          // console.log(res?.data);
          let today = res?.data?.filter(
            (ele) =>
              ele?.createdAt?.split("T")[0] == todayDate &&
              ele?.database == user?.database
          );
          setTodayImages(today);
        })
        .catch((err) => {
          console.log(err);
        });
      let userId = JSON.parse(localStorage.getItem("userData"));
      let RegisterUser = [];
      await _Get(All_Users_HRM, userId?.database)
        .then((res) => {
          let value = res?.User;
          if (value?.length > 0) {
            // RegisterUser = value;
            RegisterUser = value?.filter(
              (ele) => ele?.rolename?.roleName !== "SuperAdmin"
            );
          }
        })
        .catch((err) => {
          console.log(err);
        });
      await _Get(HRM_ATTENDANCE_LIST, userId?.database)
        .then((res) => {
          let latest = res?.attendanceTotal?.filter(
            (atten) => atten?.attendance?.date == todayDate
          );

          setTotalAttendance(res?.attendanceTotal);
          RegisterUser?.flatMap((ele, i) => {
            latest?.flatMap((data, index) => {
              if (
                ele?.Pan_No == data?.details?.panNo ||
                ele?.Aadhar_No == data?.details?.panNo
              ) {
                ele.attendence = data;
              } else {
                return ele;
              }
            });
          });
          setLoading(false);
          setDataSource(RegisterUser);
          setAllDataSource(RegisterUser);
          // console.log(RegisterUser);
          // console.log("selected", RegisterUser);
          // }
        })
        .catch((error) => {
          setDataSource([]);
          setLoading(false);
          console.error("Error fetching data:", error);
        });
    })();
  };

  const handleName = (ind, data) => {
    let userOne;
    if (data?.panNo || data?.Pan_No || data?.Aadhar_No) {
      userOne = TotalAttendance?.filter(
        (ele) =>
          ele?.details?.panNo == data?.panNo ||
          ele?.details?.panNo == data?.Pan_No ||
          ele?.details?.panNo == data?.Aadhar_No
      );
      setInsideData(userOne);
      // setAllInsideData(userOne);
      // console.log(data._id);
      setCurrentIndex(ind);
      setIstrue(!isTrue);
    } else {
      swal("error", "No Data Found for Today", "error");
    }
  };
  const handleViewOne = (data, intimeIndex, OutTimeIndex) => {
    let value = {
      ...data,
      intimeIndex: intimeIndex,
      OutTimeIndex: OutTimeIndex,
    };

    setEditData(value);
    setInTime(data?.attendence?.details?.inTimes[intimeIndex]);
    setOutTime(data?.attendence?.details?.outTimes[OutTimeIndex]);
    toggle();
  };
  const handleEditAttendanceSubmit = async (e) => {
    e.preventDefault();

    let Payload = {
      inTimeIndex: EditData?.intimeIndex,
      inTime: InTime,
      outTimeIndex: EditData?.OutTimeIndex,
      outTime: OutTime,
    };
    await axios
      .put(
        `https://node-second.rupioo.com/editTimes/${EditData?.attendence?.details._id}`,
        Payload
      )
      .then((res) => {
        if (res?.data?.status) {
          listData();
          toggle();
        }
      })
      .catch((err) => {
        if (!!err?.response?.data?.message) {
          swal("error", `${err?.response?.data?.message}`, "error");
        }
      });
  };
  return (
    <>
      {loading ? (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Spinner
              style={{
                height: "4rem",
                width: "4rem",
              }}
              color="primary"
            >
              Loading...
            </Spinner>
          </div>
        </>
      ) : (
        <>
          <Table hover responsive className="outerTable">
            <thead>
              <tr style={{ height: "47px" }}>
                <th>Name</th>
                <th>In Time</th>
                <th>Out Time</th>
                <th>Salary</th>
                {/* <th>Action</th> */}
              </tr>
            </thead>
            <tbody>
              {dataSource &&
                dataSource?.map((ele, ind) => (
                  <>
                    <tr style={{ height: "47px" }} key={ind}>
                      <td
                        onClick={() =>
                          handleName(
                            ind,
                            ele?.attendence?.details
                              ? ele?.attendence?.details
                              : ele
                          )
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <span>
                          {!!ele?.firstName && (
                            <>{`${ele?.firstName} ${ele?.lastName}`}</>
                          )}
                        </span>
                      </td>
                      <td>
                        {!!ele?.attendence?.details?.inTimes[0] &&
                          ele?.attendence?.details?.inTimes[0]}
                      </td>
                      <td>
                        {!!ele?.attendence?.details?.outTimes?.length > 0 &&
                          ele?.attendence?.details?.outTimes[
                            ele?.attendence?.details?.outTimes?.length - 1
                          ]}
                      </td>
                      <td>{ele?.salary}</td>
                      {/* <td>
                        {" "}
                        <span
                          onClick={() =>
                            handleViewOne(
                              ele,
                              0,
                              ele?.attendence?.details?.outTimes?.length > 0
                                ? ele?.attendence?.details?.outTimes?.length - 1
                                : 0
                            )
                          }
                          style={{ cursor: "pointer" }}
                          className="mr-1"
                        >
                          <Edit color="green" />
                        </span>
                      </td> */}
                    </tr>

                    {currentIndex == ind && isTrue && (
                      <tr>
                        <td colSpan="4" className="innerTable">
                          {/* <div className="d-flex justify-content-end">
                            <Col lg="2" md="2" sm="12">
                              <Input
                                width={30}
                                className="mt-1 mb-1"
                                type="text"
                                placeholder="Search Date here ..."
                                onChange={(e) =>
                                  setSearch(e.target.value?.toLowerCase())
                                }
                              />
                            </Col>
                          </div> */}
                          <InnerTable insideData={insideData} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
            </tbody>
          </Table>
          <>
            <Row>
              {/* {TodayImages?.length > 0 &&
                TodayImages?.map((ele, index) => (
                  <>
                    <Col key={index} lg="2" md="2">
                      <img src={ele?.image} height={150} width={100} />
                    </Col>
                  </>
                ))} */}
            </Row>
          </>
        </>
      )}
      <Modal isOpen={modal} toggle={toggle} {...args}>
        <ModalHeader toggle={toggle}>Update Attendance</ModalHeader>
        <ModalBody>
          <div className="d-flex justify-content-center">
            <h4>
              Edit Attendance for{" "}
              {EditData?.firstName && (
                <>
                  {EditData?.firstName} {EditData?.lastName}
                </>
              )}{" "}
            </h4>
          </div>
          <div className="d-flex justify-content-center">
            <h4>
              {EditData?.attendence?.attendance?.date ? (
                <> Date : {EditData?.attendence?.attendance?.date}</>
              ) : null}
            </h4>
          </div>
          <div className="p-1 pt-1 pb-1">
            <Row>
              <Col>
                <Label>In Time</Label>
                <Input
                  value={InTime}
                  onChange={(e) => setInTime(e.target.value)}
                  placeholder="In time.."
                />
              </Col>
              <Col>
                <Label>Out Time</Label>
                <Input
                  value={OutTime}
                  onChange={(e) => setOutTime(e.target.value)}
                  placeholder="Out time.."
                />
              </Col>
            </Row>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            // onClick={toggle}
            onClick={handleEditAttendanceSubmit}
          >
            Submit
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

function List() {
  const [Search, setSearch] = useState("");
  const history = useNavigate();
  const handleLogs = () => {
    history("/Logs");
  };
  return (
    <div>
      <Header />
      <div className="container">
        <Row>
          <Col lg="4" md="4" sm="12" xs="12">
            <h1 className="mb-3">Attendance List</h1>
          </Col>
          <Col>
            <div className="d-flex justify-content-end">
              <Button color="primary" onClick={handleLogs}>
                Logs
              </Button>
            </div>
          </Col>
          <Col lg="2" md="2" sm="12">
            <Input
              width={30}
              type="text"
              placeholder="Search Name here ..."
              onChange={(e) => setSearch(e.target.value?.toLowerCase())}
            />
          </Col>
        </Row>
        <div className="d-flex justify-content-space-between">
          {/* <div>
        </div> */}
        </div>
        <OuterTable Search={Search} setSearch={setSearch} />
      </div>
    </div>
  );
}

export default List;
