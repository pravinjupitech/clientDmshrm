import axios from "axios";

const instance = axios.create({
  baseURL: "https://customer-node.rupioo.com/",
});

export default instance;
