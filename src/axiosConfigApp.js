import axios from "axios";

const instance = axios.create({
  baseURL: "https://hrm-lite-node.rupioo.com/",
});

export default instance;
