import { useEffect, useState } from "react";
import "./SideBarAds.css";
import { FaAd } from "react-icons/fa";
import AdServices from "../../services/AdService";

const SidebarAds = () => {
  const [adBanners, setAdBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await AdServices.getAds();

        if (response.status !== 200) {
          throw new Error("Failed to load ads");
        }

        const data = response.data;
        setAdBanners(data.data || []); // Ensure it defaults to an empty array
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  return (
    <div className="sidebar-ads-container">
      <h3 className="ads-header">Sponsored</h3>

      {loading && <p>Loading ads...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && adBanners.length === 0 && <p>No ads available</p>}

      {adBanners.map((ad, index) => (
        <div key={index} className="ad-banner">
          <a href={ad.redirectUrl} target="_blank" rel="noopener noreferrer">
            <div className="ad-content">
              {ad.imageUrl ? (
                <img
                  src={ad.imageUrl}
                  alt={ad.title || "Advertisement"}
                  className="ad-image"
                />
              ) : (
                <div className="ad-placeholder">
                  <FaAd className="ad-icon" />
                  <img src="/ad.png" alt="Default Ad" className="ad-image" />
                </div>
              )}
              <div className="ad-info">
                <h4 className="ad-title">{ad.title}</h4>
                <p className="ad-description">{ad.description}</p>
              </div>
            </div>
          </a>
        </div>
      ))}
    </div>
  );
};

export default SidebarAds;
