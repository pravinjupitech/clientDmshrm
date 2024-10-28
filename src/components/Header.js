import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import logo from ".././assets/images/logo.png";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function BasicExample() {
  const [Headeing, setHeader] = useState(false);
  useEffect(() => {
    let userData = JSON.parse(localStorage.getItem("userData"));
    if (!!userData) {
      setHeader(true);
    } else {
      setHeader(false);
    }
  }, []);

  return (
    <>
      {/* {Headeing ? ( */}
      <>
        <Container>
          <Navbar expand="lg" className="bg-body-tertiary">
            <Navbar.Brand href="/">
              <div className="d-flex justify-content-center">
                <img
                  className=""
                  height={55}
                  width={100}
                  src={logo}
                  alt="image"
                />
              </div>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link>
                  <Link to="/Home">Mark Attendance</Link>
                </Nav.Link>
                {/* <Nav.Link>
                  <Link to="/attendancelist">Attendance</Link>
                </Nav.Link> */}
                <Nav.Link>
                  <Link to="/attenlist">Attendance</Link>
                </Nav.Link>
                <Nav.Link>
                  <Link
                    onClick={() => {
                      localStorage.removeItem("userData");
                      window.location.replace("/");
                    }}
                  >
                    Log Out
                  </Link>
                </Nav.Link>
                {/* <Nav.Link href="#link">Link</Nav.Link>
                <NavDropdown title="Dropdown" id="basic-nav-dropdown">
                  <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                  <NavDropdown.Item href="#action/3.2">
                    Another action
                  </NavDropdown.Item>
                  <NavDropdown.Item href="#action/3.3">
                    Something
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item href="#action/3.4">
                    Separated link
                  </NavDropdown.Item>
                </NavDropdown> */}
              </Nav>
            </Navbar.Collapse>
          </Navbar>
        </Container>
      </>
      {/* // ) : null} */}
    </>
  );
}

export default BasicExample;
