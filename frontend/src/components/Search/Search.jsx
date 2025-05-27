import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch }  from 'react-icons/fa';
import './Search.css'; // Import the CSS file
import axios from 'axios';
import UserServices from '../../services/UserServices';

function Search() {
  const [query, setQuery] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [filteredSuggestionsTotalCount, setFilteredSuggestionsTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestions = async () => {

      const suggestionsResponse = await UserServices.getSearchUsers(query, currentPage, 10);
      // console.log("search queyr ", query, " and response ", suggestionsResponse.data.suggestions);
      if (suggestionsResponse.status === 200 && suggestionsResponse.data.suggestions.length > 0){
          setFilteredSuggestions(suggestionsResponse.data.suggestions);
          setFilteredSuggestionsTotalCount(suggestionsResponse.data.totalCount);
          console.log('filtered suggestions ', filteredSuggestions);
      } else {
        setFilteredSuggestions([]);
        setLoading(false);
        return;
      }
    }
    if (query === '' || query.length < 1) {
      setFilteredSuggestions([]);
      setLoading(false);
      return;
    } else {
      if(query.length >= 1) {
        setLoading(true);
        fetchSuggestions();
        setLoading(false);
        setShowSuggestions(true);
      }
    }

  }, [query]);

  useEffect(() => {
    const handleCLickOutside = (event) => {
        if(searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
            setShowSuggestions(false);
        }
    };
    document.addEventListener('mousedown', handleCLickOutside);
    return () =>{
        document.removeEventListener('mousedown', handleCLickOutside);
    };
  }, []);

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSuggestionClick = (user) => {
    navigate(`/viewprofile/${user._id}`, { replace: false });
    setShowSuggestions(false);
  };

  const handleViewAllClick = () => {
    navigate('/view-all', { state: { 
      query : query, 
      totalCount : filteredSuggestionsTotalCount, 
      suggestions : filteredSuggestions, 
      currentPage : currentPage } });
  };

  const highlightQuery = (text, query) => {
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="highlight">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="search-container" ref={searchContainerRef}>
      <div className="search-input-container">
      <FaSearch className="search-icon" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search..."
          className="search-input"
        />
      </div>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        showSuggestions && (
        <div className="search-item-list"> 
          <ul className="suggestions-list">
            {filteredSuggestions.length > 0 ? (
                <>
                    {filteredSuggestions.slice(0, 10).map((user) => (
                        <div className="search-item">
                            <li key={user._id} onClick={() => handleSuggestionClick(user)}>
                                <img src={`http://localhost:8080${user.profilePicture}`} alt = {`${user.firtName} ${user.lastName}`}  className="profile-picture"/>
                                <span>  {`${user.firstName} ${user.lastName} `}</span>
                            </li>
                        </div>
                    ))}
                    {filteredSuggestionsTotalCount > 10 && (
                        <li className="view-all" onClick={handleViewAllClick}>
                            View All
                        </li>
                    )}
                </>
            ) : (
                <li className='no-results'> No Results</li>
            )}
          </ul>
          </div>
        )
      )}
    </div>
  );
}

export default Search;