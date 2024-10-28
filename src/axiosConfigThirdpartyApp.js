import axios from "axios";

const instance = axios.create({
  baseURL: "https://dms-node.rupioo.com/",
});

export default instance;
