import axios from "axios";

// Create an Axios instance
const apiClient = axios.create({
  baseURL: "http://localhost:8080/api", // Change this to your actual API base URL
  timeout: 5000, // Set a timeout (optional),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
// apiClient.interceptors.request.use(
//   (config) => {
//     console.log("Request Sent:", config);
//     return config;
//   },
//   (error) => {
//     console.error("Request Error:", error);
//     return Promise.reject(error);
//   }
// );

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Response Error:", error);
    return Promise.reject(error);
  }
);

export default apiClient;
