import apiClient from './apiClient';


const AdServices = {
    getAds: () => apiClient.get('/ad/'),
};

export default AdServices;