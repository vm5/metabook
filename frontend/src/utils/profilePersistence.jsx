// src/utils/profilePersistence.js
export const getPersistedProfileId = () => {
    return localStorage.getItem('userId') || localStorage.getItem('lastProfileId');
  };
  
  export const persistProfileId = (id) => {
    localStorage.setItem('lastProfileId', id);
  };