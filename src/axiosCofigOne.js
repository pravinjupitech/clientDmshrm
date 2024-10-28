import axios from "axios";

const instance = axios.create({
  baseURL: "https://node-second.rupioo.com/",

});

export default instance;
