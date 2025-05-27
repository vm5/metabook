import apiClient from './apiClient';


const UserServices = {
    getSearchUsers: (query, page, limit 
    ) => apiClient.get('/users/search',{
        params : {
            searchText : query,
            page,
            limit
        }
    }),
};

export default UserServices;