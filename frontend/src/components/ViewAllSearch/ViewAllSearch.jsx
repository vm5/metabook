import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch }  from 'react-icons/fa';
import './ViewAllSearch.css'; // Import the CSS file
import axios from 'axios';
import UserServices from '../../services/UserServices';
import { useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";  // Bootstrap CSS
import "bootstrap/dist/js/bootstrap.bundle.min.js";  // Bootstrap JS (with Popper.js)



function ViewAllSearch() {
    const location = useLocation();
    const [currentPage, setCurrentPage] = useState(location.state.currentPage);
    const [suggestions, setSuggestions] = useState(location.state.suggestions);
    const [totalCount, setTotalCount] = useState(location.state.totalCount);
    const query = location.state.query;
    const pageSize = 10; // move to configuration
    let totalPages = Math.ceil(totalCount/pageSize);
    let isFirstTime = true;
    const navigate = useNavigate();
    console.log("total results", totalCount);

    useEffect(() => {
        console.log("inside use effect");
        if(currentPage<=totalPages && currentPage>=1){
            console.log("fetching suggestions");
            fetchSuggestions();
        }
        
    }, [currentPage]);

    const fetchSuggestions = async () => {
        try {
            const response = await UserServices.getSearchUsers(query, currentPage, pageSize);
            if (response.status === 200 && response.data.suggestions.length > 0){
                setSuggestions(response.data.suggestions);
                setTotalCount(response.data.totalCount);
                totalPages = Math.ceil(totalCount/pageSize);
            }

        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    return (
        <div className="container mt-4 text-white">
            <h2 className="search-text">Search Results for "{query}"</h2>
    
            <div className="row gy-3 mt-3">
                {suggestions.map((user) => (
                    <div key={user._id} className="col-md-6 col-lg-4">
                        <div 
                            className="user-card"
                            onClick= {() => {navigate(`/viewprofile/${user._id}`, { replace: false })}}>
                            <img 
                                src={`http://localhost:8080${user.profilePicture}`} 
                                alt={`${user.firstName} ${user.lastName}`} 
                                className="user-image"
                            />
                            <div className="user-info">
                                <h5>{user.firstName} {user.lastName}</h5>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

    
            <div className="pagination">
                <button 
                    className={`px-4 py-2 rounded-lg text-white ${currentPage === 1 ? 'bg-gray-600' : 'bg-purple-500 hover:bg-purple-600'}`} 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(currentPage - 1)}
                >
                    Previous
                </button>
                <span className="text-gray-400"> Page {currentPage} of {totalPages} </span>
                <button 
                    className={`px-4 py-2 rounded-lg text-white ${currentPage >= totalPages ? 'bg-gray-600' : 'bg-purple-500 hover:bg-purple-600'}`} 
                    disabled={currentPage >= totalPages} 
                    onClick={() => setCurrentPage(currentPage + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );

}

export default ViewAllSearch;