import axiosConfig from "../axiosConfig";

export const _GetList = async (URL, id, data) => {
  let response = await axiosConfig.get(`${URL}`, data).then((res) => res.data);
  return response;
};
export const _Get = async (URL, id, data) => {
  let response = await axiosConfig
    .get(`${URL}` + id, data)
    .then((res) => res.data);
  return response;
};
export const _Put = async (URL, id, data) => {
  let response = await axiosConfig
    .put(`${URL}` + id, data)
    .then((res) => res.data);
  return response;
};
