import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import axiosConfigThirdParty from "./../axiosConfitthirdparty";
import axiosConfig from "../axiosConfig";

import { Col, Input, Row, Spinner, Table, Button } from "reactstrap";
import axios from "axios";
import { SavedData, logsData } from "../EndPoint/EndPoint";
import { MdDelete } from "react-icons/md";
import swal from "sweetalert";

function Logs() {
  const [List, setList] = useState([]);
  const [Value, setValue] = useState("");
  const [Loading, setLoading] = useState(false);
  const [AllList, setAllList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    listData();
  }, []);
  const listData = () => {
    setLoading(true);
    let userData = JSON.parse(localStorage.getItem("userData"));
    axiosConfigThirdParty
      .get(`${logsData}/${userData?.database}`)
      .then((res) => {
        setLoading(false);
        debugger;
        if (res?.data?.Attendance?.length > 0) {
          let value = res?.data?.Attendance?.filter(
            (ele) => ele?.adminId == userData?._id
          );
          if (value?.length > 0) {
            setList(value);
            setAllList(value);
          }
        } else {
          setList([]);
          setAllList([]);
        }
      })
      .catch((err) => {
        setLoading(false);

        console.log(err);
        setList([]);
      });
  };
  if (Loading) {
    return (
      <>
        <div className="d-flex justify-content-center align-item-center">
          Loading...
        </div>
      </>
    );
  }
  const HandleDelete = (data) => {
    debugger;
    console.log(data);
    axiosConfigThirdParty
      .delete(`${logsData}/${data?._id}`)
      .then((res) => {
        debugger;
        listData();
        swal("success", "Deleted Success", "success");
      })
      .catch((err) => {
        debugger;

        swal("error", "Error", "error");
      });
  };
  return (
    <>
      <Header />
      <div className="container">
        <Row>
          <Col>
            <div className="mt-1 mb-1">
              <h2>Attendance Logs</h2>
            </div>
          </Col>
          <Col></Col>
          <Col lg="2" md="2" sm="6" xs="6">
            <div className="mt-1 mb-1 d-flex justify-content-end">
              <Input
                value={Value}
                onChange={(e) => {
                  let value = e.target.value;
                  setValue(value);
                  let filterdata;
                  if (value?.length > 0) {
                    filterdata = AllList?.filter((ele) =>
                      ele?.currentDate?.includes(value)
                    );
                    if (filterdata?.length > 0) {
                      setList(filterdata);
                    } else {
                      setList(AllList);
                    }
                  } else {
                    setList(AllList);
                  }
                }}
                placeholder="Search by Date..."
                type="text"
              />
            </div>
          </Col>
          <Col>
            <div className="mt-1 mb-1 d-flex justify-content-end">
              <Button
                color="primary"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/attenlist");
                }}
              >
                Back
              </Button>
            </div>
          </Col>
        </Row>
        <Table hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Image</th>
              <th>Date</th>
              <th>Time</th>
              {/* <th>Action</th> */}
            </tr>
          </thead>
          <tbody>
            {List?.length > 0 ? (
              <>
                {List?.map((ele, i) => {
                  return (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>
                        {" "}
                        <img
                          style={{ borderRadius: "12px" }}
                          width="120px"
                          height={80}
                          src={ele?.image}
                          alt=""
                        />{" "}
                      </td>
                      <td>{ele?.currentDate}</td>
                      <td>{ele?.currentTime}</td>
                      {/* <td>{shift?.shiftName && shift?.shiftName}</td> */}
                      {/* <td>
                        {" "}
                        <MdDelete
                          onClick={() => HandleDelete(ele)}
                          color="red"
                          size={25}
                          style={{ cursor: "pointer" }}
                        />
                      </td> */}
                    </tr>
                  );
                })}
              </>
            ) : (
              <></>
            )}
          </tbody>
        </Table>
      </div>
    </>
  );
}

export default Logs;
